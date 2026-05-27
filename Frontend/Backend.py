"""
AI Personal Finance Tracker - Backend API
Flask server with PDF parsing, ML categorization, and transaction management
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import re
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import hashlib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import os
import joblib
from typing import List, Tuple

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    OPENAI_IMPORT_ERROR = None
except Exception as openai_err:
    OpenAI = None
    OPENAI_AVAILABLE = False
    OPENAI_IMPORT_ERROR = str(openai_err)

try:
    import pytesseract
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
    OCR_IMPORT_ERROR = None
except Exception as ocr_err:
    OCR_AVAILABLE = False
    OCR_IMPORT_ERROR = str(ocr_err)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUNTIME_DATA_DIR = os.path.join(BASE_DIR, 'runtime_data')
MODEL_PATH = os.path.join(RUNTIME_DATA_DIR, 'transaction_classifier.pkl')
LEARNED_FEEDBACK_PATH = os.path.join(RUNTIME_DATA_DIR, 'learned_corrections.json')
USERS_PATH = os.path.join(RUNTIME_DATA_DIR, 'users.json')
MANUAL_TRANSACTIONS_PATH = os.path.join(RUNTIME_DATA_DIR, 'manual_transactions.json')
CUSTOM_CATEGORIES_PATH = os.path.join(RUNTIME_DATA_DIR, 'custom_categories.json')
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
CONFIDENCE_THRESHOLD = 0.6
DEFAULT_PORT = int(os.environ.get('PORT', 5001))
OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-5-mini')

# Training data for ML model
TRAINING_DATA = [
    # Food & Dining
    ("Swiggy order delivered", "Food & Dining"),
    ("Zomato payment", "Food & Dining"),
    ("McDonald's restaurant", "Food & Dining"),
    ("Starbucks coffee", "Food & Dining"),
    ("Dominos pizza", "Food & Dining"),
    ("KFC chicken", "Food & Dining"),
    ("Restaurant bill payment", "Food & Dining"),
    ("Cafe coffee day", "Food & Dining"),
    
    # Transportation
    ("Uber ride", "Transportation"),
    ("Ola cab booking", "Transportation"),
    ("Petrol pump", "Transportation"),
    ("Metro card recharge", "Transportation"),
    ("Parking fee", "Transportation"),
    ("Auto rickshaw", "Transportation"),
    ("Bus ticket", "Transportation"),
    
    # Shopping
    ("Amazon purchase", "Shopping"),
    ("Flipkart order", "Shopping"),
    ("Myntra clothing", "Shopping"),
    ("Big Bazaar", "Shopping"),
    ("Mall shopping", "Shopping"),
    ("Online shopping", "Shopping"),
    ("Retail store", "Shopping"),
    
    # Entertainment
    ("Netflix subscription", "Entertainment"),
    ("Amazon Prime Video", "Entertainment"),
    ("Spotify premium", "Entertainment"),
    ("Movie ticket BookMyShow", "Entertainment"),
    ("Gaming purchase", "Entertainment"),
    ("YouTube premium", "Entertainment"),
    ("Disney Hotstar", "Entertainment"),
    
    # Bills & Utilities
    ("Electricity bill", "Bills & Utilities"),
    ("Water bill payment", "Bills & Utilities"),
    ("Gas cylinder", "Bills & Utilities"),
    ("Internet broadband", "Bills & Utilities"),
    ("Mobile recharge", "Bills & Utilities"),
    ("DTH recharge", "Bills & Utilities"),
    
    # Healthcare
    ("Apollo pharmacy", "Healthcare"),
    ("Hospital payment", "Healthcare"),
    ("Doctor consultation", "Healthcare"),
    ("Medicine purchase", "Healthcare"),
    ("Health checkup", "Healthcare"),
    ("Lab test", "Healthcare"),
    
    # Education
    ("Udemy course", "Education"),
    ("Coursera subscription", "Education"),
    ("Book purchase", "Education"),
    ("School fee", "Education"),
    ("Tuition payment", "Education"),
    
    # Investment
    ("Zerodha stock", "Investment"),
    ("Groww mutual fund", "Investment"),
    ("SIP investment", "Investment"),
    ("Equity purchase", "Investment"),
    
    # Salary/Income
    ("Salary credited", "Salary"),
    ("Payroll deposit", "Salary"),
    ("Freelance payment received", "Salary"),
    
    # Transfer
    ("Money transfer", "Transfer"),
    ("Bank transfer", "Transfer"),
    ("Wallet transfer", "Transfer"),
]

BASE_CATEGORY_OPTIONS = sorted({item[1] for item in TRAINING_DATA})
CATEGORY_OPTIONS = BASE_CATEGORY_OPTIONS

def normalize_description(text):
    normalized = re.sub(r'[^a-z0-9\s]', ' ', str(text).lower())
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized


def merchant_signature(text):
    """Create a stable merchant key by removing UPI/reference noise."""
    normalized = normalize_description(text)
    stop_words = {
        'upi', 'ref', 'rrn', 'txn', 'transaction', 'payment', 'paid', 'pay',
        'to', 'from', 'via', 'id', 'imps', 'neft', 'phonepe', 'paytm',
        'google', 'gpay', 'bharatpe', 'wallet', 'bank'
    }
    tokens = []
    for token in normalized.split():
        if token in stop_words or token.isdigit():
            continue
        if re.fullmatch(r'[a-z]*\d+[a-z]*', token):
            continue
        tokens.append(token)
    return ' '.join(tokens[:5]) or normalized


def load_feedback_data():
    os.makedirs(RUNTIME_DATA_DIR, exist_ok=True)
    if not os.path.exists(LEARNED_FEEDBACK_PATH):
        return []
    try:
        with open(LEARNED_FEEDBACK_PATH, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def save_feedback_data(entries):
    os.makedirs(RUNTIME_DATA_DIR, exist_ok=True)
    with open(LEARNED_FEEDBACK_PATH, 'w', encoding='utf-8') as file:
        json.dump(entries, file, indent=2)


def _json_safe(value):
    """Convert NumPy/Pandas scalar values into normal JSON-safe Python values."""
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    if hasattr(value, 'item') and callable(value.item):
        try:
            return _json_safe(value.item())
        except Exception:
            pass
    return value


def safe_jsonify(payload, status=None):
    response = jsonify(_json_safe(payload))
    if status is not None:
        response.status_code = status
    return response


def sanitize_category(category):
    cleaned = re.sub(r'\s+', ' ', str(category or '')).strip()
    if not cleaned:
        raise ValueError('Category is required.')
    if len(cleaned) > 40:
        raise ValueError('Category must be 40 characters or less.')
    if cleaned.lower() in {'unknown', 'select', 'choose category'}:
        raise ValueError('Please enter a real category name.')
    return cleaned


def load_custom_categories():
    custom = _load_json_file(CUSTOM_CATEGORIES_PATH, [])
    learned = [
        item.get('category', '').strip()
        for item in load_feedback_data()
        if item.get('category', '').strip()
    ]
    categories = []
    seen = set()
    for category in custom + learned:
        key = category.lower()
        if category and key not in seen and category not in BASE_CATEGORY_OPTIONS:
            categories.append(category)
            seen.add(key)
    return sorted(categories, key=str.lower)


def get_category_options():
    return sorted(set(BASE_CATEGORY_OPTIONS + load_custom_categories()), key=str.lower)


def remember_custom_category(category):
    category = sanitize_category(category)
    if category in BASE_CATEGORY_OPTIONS:
        return category

    custom = _load_json_file(CUSTOM_CATEGORIES_PATH, [])
    if category.lower() not in {item.lower() for item in custom}:
        custom.append(category)
        _save_json_file(CUSTOM_CATEGORIES_PATH, sorted(custom, key=str.lower))
    return category


def _load_json_file(path, default):
    os.makedirs(RUNTIME_DATA_DIR, exist_ok=True)
    if not os.path.exists(path):
        return default
    try:
        with open(path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return data if isinstance(data, type(default)) else default
    except (OSError, json.JSONDecodeError):
        return default


def _save_json_file(path, data):
    os.makedirs(RUNTIME_DATA_DIR, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2)


def _hash_password(password):
    return hashlib.sha256(str(password).encode('utf-8')).hexdigest()


def _auth_token(email):
    token_seed = f"{email}:{os.environ.get('AUTH_SECRET', 'finance-tracker-demo-secret')}"
    return hashlib.sha256(token_seed.encode('utf-8')).hexdigest()


def _public_user(user):
    return {
        'id': user['id'],
        'name': user.get('name') or user['email'].split('@')[0],
        'email': user['email']
    }


def create_review_questions(transactions):
    grouped = {}
    for txn in transactions:
        description = txn.get('description', '')
        signature = merchant_signature(description)
        if not signature or not txn.get('needs_review'):
            continue
        if signature not in grouped:
            grouped[signature] = {
                'description': description,
                'merchant_signature': signature,
                'count': 0,
                'total_amount': 0,
                'suggested_category': txn.get('suggested_category') or 'Other',
                'transaction_ids': []
            }
        grouped[signature]['count'] += 1
        grouped[signature]['total_amount'] += abs(float(txn.get('amount', 0) or 0))
        grouped[signature]['transaction_ids'].append(txn.get('id'))

    return [
        {
            **item,
            'question': f"Where did you spend on {item['description']}?"
        }
        for item in grouped.values()
        if item['count'] >= 1
    ]


def build_rule_based_ai_insights(transactions):
    expenses = [t for t in transactions if t.get('type') == 'debit']
    income = sum(float(t.get('amount', 0) or 0) for t in transactions if t.get('type') == 'credit')
    total_expenses = sum(abs(float(t.get('amount', 0) or 0)) for t in expenses)
    category_totals = {}
    for txn in expenses:
        category = txn.get('category') or 'Other'
        category_totals[category] = category_totals.get(category, 0) + abs(float(txn.get('amount', 0) or 0))

    top_category, top_amount = ('No spending yet', 0)
    if category_totals:
        top_category, top_amount = max(category_totals.items(), key=lambda item: item[1])

    savings_rate = ((income - total_expenses) / income * 100) if income else 0
    waste_score = min(100, round((top_amount / total_expenses) * 100)) if total_expenses else 0
    possible_savings = max(500, round(top_amount * 0.18)) if top_amount else 0

    return {
        'source': 'rule-engine',
        'summary': f'{top_category} is your biggest spending area. Current savings rate is {savings_rate:.1f}%.',
        'waste_areas': [
            {
                'title': f'{top_category} concentration',
                'detail': f'{top_category} accounts for about {waste_score}% of tracked expenses.',
                'impact': possible_savings
            },
            {
                'title': 'Recurring small spends',
                'detail': 'Repeated small UPI payments can quietly become a large monthly leak.',
                'impact': max(300, round(total_expenses * 0.05)) if total_expenses else 0
            }
        ],
        'recommendations': [
            f'Set a weekly cap for {top_category} and review it every Sunday.',
            f'Target saving about ₹{possible_savings:,}/month by reducing non-essential repeat payments.',
            'Mark unknown transactions once; the system will learn and categorize future PDFs automatically.'
        ],
        'next_actions': [
            'Review uncategorized repeated merchants',
            'Create a budget for the top spending category',
            'Upload next month statement to compare spending trend'
        ]
    }


def generate_openai_insights(transactions):
    fallback = build_rule_based_ai_insights(transactions)
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key or not OPENAI_AVAILABLE:
        fallback['openai_ready'] = bool(api_key and OPENAI_AVAILABLE)
        fallback['setup_hint'] = 'Set OPENAI_API_KEY on Render/local environment to enable OpenAI insights.'
        return fallback

    sample_transactions = transactions[:80]
    prompt_payload = {
        'transactions': sample_transactions,
        'categories': get_category_options(),
        'fallback_summary': fallback
    }

    try:
        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model=OPENAI_MODEL,
            instructions=(
                'You are a practical Indian personal-finance coach. '
                'Analyze UPI transactions and return only compact JSON with keys: '
                'summary, waste_areas, recommendations, next_actions. '
                'Never provide investment, legal, or tax advice. Focus on budgeting and spending habits.'
            ),
            input=json.dumps(prompt_payload)
        )
        text = response.output_text
        parsed = json.loads(text)
        parsed['source'] = 'openai'
        return parsed
    except Exception as exc:
        fallback['source'] = 'rule-engine-fallback'
        fallback['openai_error'] = str(exc)
        return fallback


def build_model(training_pairs):
    descriptions = [item[0] for item in training_pairs]
    categories = [item[1] for item in training_pairs]

    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=250)),
        ('classifier', MultinomialNB())
    ])
    model.fit(descriptions, categories)
    return model


def rebuild_model():
    global ml_model
    os.makedirs(RUNTIME_DATA_DIR, exist_ok=True)
    feedback_entries = load_feedback_data()
    learned_pairs = []
    for item in feedback_entries:
        description = item.get('description', '').strip()
        category = item.get('category', '').strip()
        if description and category:
            learned_pairs.append((description, category))

    training_pairs = TRAINING_DATA + learned_pairs
    ml_model = build_model(training_pairs)
    joblib.dump(ml_model, MODEL_PATH)
    return ml_model


def get_learned_category(description):
    normalized = normalize_description(description)
    signature = merchant_signature(description)
    if not normalized:
        return None

    for item in load_feedback_data():
        if item.get('normalized_description') == normalized or item.get('merchant_signature') == signature:
            return item.get('category')
    return None


ml_model = rebuild_model()

DATE_PATTERNS = [
    r'\b\d{2}/\d{2}/\d{4}\b',
    r'\b\d{2}-\d{2}-\d{4}\b',
    r'\b\d{4}-\d{2}-\d{2}\b',
    r'\b\d{4}/\d{2}/\d{2}\b',
    r'\b\d{2}/\d{2}/\d{2}\b',
    r'\b\d{2}-\d{2}-\d{2}\b',
    r'\b\d{2}\.\d{2}\.\d{4}\b',
    r'\b\d{2}\.\d{2}\.\d{2}\b',
    r'\b\d{1,2}-[A-Za-z]{3,9}-\d{4}\b',
    r'\b\d{1,2} [A-Za-z]{3,9} \d{4}\b',
    r'\b[A-Za-z]{3,9} \d{1,2}, \d{4}\b',
    r'\b\d{1,2}\s+[A-Za-z]{3,9}\b',
    r'\b\d{1,2}-[A-Za-z]{3,9}\b'
]

DATE_FORMATS = [
    '%d/%m/%Y',
    '%d-%m-%Y',
    '%Y-%m-%d',
    '%Y/%m/%d',
    '%d/%m/%y',
    '%d-%m-%y',
    '%d.%m.%Y',
    '%d.%m.%y',
    '%d-%b-%Y',
    '%d %b %Y',
    '%d-%B-%Y',
    '%d %B %Y',
    '%b %d, %Y',
    '%B %d, %Y'
]

DATE_FORMATS_NO_YEAR = [
    '%d %b',
    '%d %B',
    '%d-%b',
    '%d-%B',
    '%d/%m',
    '%d-%m',
    '%d.%m'
]

MONTHS = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
}

NOISE_KEYWORDS = [
    'paytm statement',
    'payments made',
    'payments received',
    'total money paid',
    'total money received',
    'passbook payments history',
    'all payments done',
    'for any queries',
    'contact us'
]

STATEMENT_RANGE_PATTERN = re.compile(
    r'\d{1,2}\s*[A-Za-z]{3,9}[\'’]?\d{2,4}\s*-\s*\d{1,2}\s*[A-Za-z]{3,9}[\'’]?\d{2,4}',
    re.IGNORECASE
)

AMOUNT_PATTERN = re.compile(
    r'(?:₹|Rs\.?|INR)?\s*[-+]?\s*\(?\d+(?:,\d{3})*(?:\.\d{1,2})?\)?\s*(?:CR|DR)?',
    re.IGNORECASE
)


def _parse_amount(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text.replace('₹', '').replace('Rs.', '').replace('Rs', '').replace('INR', '')
    text = text.replace(',', '').replace(' ', '')
    negative = False
    if text.startswith('(') and text.endswith(')'):
        negative = True
        text = text[1:-1]
    text = re.sub(r'(CR|DR)$', '', text, flags=re.IGNORECASE)
    if text.startswith('+'):
        text = text[1:]
    if text.startswith('-'):
        negative = True
        text = text[1:]
    if text in {'-', '--'}:
        return None
    try:
        amount = float(text)
        return -amount if negative else amount
    except ValueError:
        return None


def _find_date(text):
    if not text:
        return None
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None


def _parse_date(date_str, default_year=None, month_year_map=None):
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    for fmt in DATE_FORMATS_NO_YEAR:
        try:
            parsed = datetime.strptime(date_str, fmt)
        except ValueError:
            continue

        year = default_year
        if month_year_map and parsed.month in month_year_map:
            year = month_year_map[parsed.month]
        if not year:
            year = datetime.now().year
        return datetime(year, parsed.month, parsed.day)

    return None


def _infer_statement_context(text):
    if not text:
        return {'default_year': None, 'month_year_map': {}}

    range_pattern = re.compile(
        r'(\d{1,2})\s*([A-Za-z]{3,9})[\'’]?\s*(\d{2,4})\s*-\s*(\d{1,2})\s*([A-Za-z]{3,9})[\'’]?\s*(\d{2,4})',
        re.IGNORECASE
    )
    match = range_pattern.search(text)
    if not match:
        return {'default_year': None, 'month_year_map': {}}

    start_day, start_month_raw, start_year_raw, end_day, end_month_raw, end_year_raw = match.groups()
    start_month = MONTHS.get(start_month_raw.lower())
    end_month = MONTHS.get(end_month_raw.lower())
    if not start_month or not end_month:
        return {'default_year': None, 'month_year_map': {}}

    start_year = int(start_year_raw)
    end_year = int(end_year_raw)
    if start_year < 100:
        start_year += 2000
    if end_year < 100:
        end_year += 2000

    month_year_map = {}
    year = start_year
    month = start_month
    while True:
        month_year_map[month] = year
        if month == end_month and year == end_year:
            break
        month += 1
        if month > 12:
            month = 1
            year += 1
        if len(month_year_map) > 24:
            break

    return {'default_year': end_year, 'month_year_map': month_year_map}


def _extract_amounts(text):
    if not text:
        return []
    matches = []
    for match in AMOUNT_PATTERN.finditer(text):
        raw = match.group(0)
        value = _parse_amount(raw)
        if value is None:
            continue
        raw_stripped = raw.strip()
        raw_upper = raw_stripped.upper()
        has_currency = any(token in raw_stripped for token in ['₹', 'Rs', 'RS', 'INR'])
        has_sign = raw_stripped.startswith(('-', '+')) or 'CR' in raw_upper or 'DR' in raw_upper
        digits_only = re.sub(r'\D', '', raw_stripped)
        if not has_currency and not has_sign and len(digits_only) >= 9:
            # Likely a reference/phone number, skip
            continue
        matches.append((raw, value))
    return matches


def _select_amount(matches):
    if not matches:
        return None
    preferred = []
    for raw, value in matches:
        raw_upper = raw.upper()
        if '₹' in raw or 'RS' in raw_upper or 'INR' in raw_upper or ',' in raw or '.' in raw or 'CR' in raw_upper or 'DR' in raw_upper:
            preferred.append(value)
    if preferred:
        return preferred[-1]
    return matches[-1][1]


def _extract_lines_from_words(page):
    try:
        words = page.extract_words(x_tolerance=2, y_tolerance=2)
    except Exception:
        return []
    if not words:
        return []
    rows = {}
    for word in words:
        key = round(word.get('top', 0), 1)
        rows.setdefault(key, []).append(word)
    lines = []
    for y in sorted(rows.keys()):
        row_words = sorted(rows[y], key=lambda w: w.get('x0', 0))
        line = ' '.join([w.get('text', '') for w in row_words]).strip()
        if line:
            lines.append(line)
    return lines


def _is_noise_line(line: str) -> bool:
    if not line:
        return True
    lower = line.lower()
    if STATEMENT_RANGE_PATTERN.search(line):
        return True
    return any(keyword in lower for keyword in NOISE_KEYWORDS)


def extract_transactions_from_lines(lines: List[str], default_year=None, month_year_map=None) -> List[dict]:
    transactions = []
    if not lines:
        return transactions

    cleaned_lines = [ln.strip() for ln in lines if ln and ln.strip()]
    seen_lines = set()

    # Single-line extraction
    for line in cleaned_lines:
        if _is_noise_line(line):
            continue
        if line in seen_lines:
            continue
        seen_lines.add(line)
        date_str = _find_date(line)
        if not date_str:
            continue

        matches = _extract_amounts(line)
        amount = _select_amount(matches)
        if amount is None:
            continue

        lower_line = line.lower()
        if amount < 0:
            txn_type = 'debit'
            amount = abs(amount)
        else:
            txn_type = 'credit' if ('credit' in lower_line or 'cr' in lower_line or 'received' in lower_line) else 'debit'
            if 'debit' in lower_line or 'dr' in lower_line or 'sent' in lower_line:
                txn_type = 'debit'

        description = line
        description = re.sub('|'.join(DATE_PATTERNS), '', description)
        if matches:
            description = description.replace(matches[-1][0], '')
        description = description.replace('CR', '').replace('DR', '')
        description = re.sub(r'\s+', ' ', description).strip()
        if len(description) < 3 or not re.search(r'[A-Za-z]', description):
            continue

        date_obj = _parse_date(date_str, default_year=default_year, month_year_map=month_year_map) or datetime.now()

        transactions.append({
            'date': date_obj.strftime('%Y-%m-%d'),
            'description': description[:100],
            'amount': -amount if txn_type == 'debit' else amount,
            'type': txn_type
        })

    if transactions:
        return transactions

    # Block-based extraction (multi-line statements)
    blocks = []
    current = None
    for line in cleaned_lines:
        if _is_noise_line(line):
            continue
        date_str = _find_date(line)
        if date_str:
            if current:
                blocks.append(current)
            current = {'date': date_str, 'lines': [line]}
        elif current:
            current['lines'].append(line)

    if current:
        blocks.append(current)

    for block in blocks:
        block_text = ' '.join(block['lines'])
        matches = _extract_amounts(block_text)
        amount = _select_amount(matches)
        if amount is None:
            continue

        lower_block = block_text.lower()
        if amount < 0:
            txn_type = 'debit'
            amount = abs(amount)
        elif 'credit' in lower_block or 'cr' in lower_block or 'received' in lower_block:
            txn_type = 'credit'
        elif 'debit' in lower_block or 'dr' in lower_block or 'sent' in lower_block:
            txn_type = 'debit'
        else:
            txn_type = 'debit'

        description = block_text
        description = re.sub('|'.join(DATE_PATTERNS), '', description)
        if matches:
            description = description.replace(matches[-1][0], '')
        description = re.sub(r'\s+', ' ', description).strip()
        if len(description) < 3 or not re.search(r'[A-Za-z]', description):
            continue

        date_obj = _parse_date(block.get('date'), default_year=default_year, month_year_map=month_year_map) or datetime.now()

        transactions.append({
            'date': date_obj.strftime('%Y-%m-%d'),
            'description': description[:100],
            'amount': -abs(amount) if txn_type == 'debit' else abs(amount),
            'type': txn_type
        })

    return transactions


def _extract_text_via_ocr(pdf_path: str) -> Tuple[List[str], str]:
    if not OCR_AVAILABLE:
        return [], OCR_IMPORT_ERROR or 'OCR dependencies are missing.'

    try:
        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)
    except Exception as exc:
        return [], str(exc)

    lines: List[str] = []
    for page_number in range(1, page_count + 1):
        try:
            images = convert_from_path(
                pdf_path,
                dpi=180,
                first_page=page_number,
                last_page=page_number
            )
            text = pytesseract.image_to_string(images[0]) if images else ''
        except Exception as exc:
            return [], str(exc)
        if text:
            lines.extend(text.splitlines())

    return lines, ''


def _normalize_cell(cell):
    return str(cell).strip() if cell is not None else ''


def _is_header_row(row):
    header_terms = ['date', 'description', 'particular', 'narration', 'details', 'debit', 'credit', 'amount', 'withdrawal', 'deposit', 'dr', 'cr']
    row_text = ' '.join(_normalize_cell(cell).lower() for cell in row)
    return any(term in row_text for term in header_terms)


def extract_transactions_from_pdf(pdf_path):
    """
    Extract UPI transactions from PDF statement
    Supports common UPI apps like Google Pay, PhonePe, Paytm, etc.
    """
    transactions = []
    
    with pdfplumber.open(pdf_path) as pdf:
        all_text = []
        for page in pdf.pages:
            page_text = page.extract_text() or ''
            if page_text:
                all_text.append(page_text)
        context = _infer_statement_context('\n'.join(all_text))

        for page in pdf.pages:
            text = page.extract_text() or ''
            tables = page.extract_tables() or []
            word_lines = _extract_lines_from_words(page)
            raw_lines = []
            if text:
                raw_lines.extend(text.splitlines())
            raw_lines.extend(word_lines)

            # Table-based extraction (more reliable when statements are tabular)
            for table in tables:
                if not table or len(table) < 2:
                    continue

                header_row_index = None
                for idx, row in enumerate(table[:2]):
                    if _is_header_row(row):
                        header_row_index = idx
                        break

                if header_row_index is not None:
                    header = [_normalize_cell(cell).lower() for cell in table[header_row_index]]
                    def find_col(*keywords):
                        for i, col in enumerate(header):
                            if any(k in col for k in keywords):
                                return i
                        return None

                    date_idx = find_col('date')
                    desc_idx = find_col('description', 'particular', 'narration', 'details')
                    debit_idx = find_col('debit', 'withdrawal', 'dr')
                    credit_idx = find_col('credit', 'deposit', 'cr')
                    amount_idx = find_col('amount')

                    data_rows = table[header_row_index + 1:]
                else:
                    header = []
                    date_idx = desc_idx = debit_idx = credit_idx = amount_idx = None
                    data_rows = table

                for row in data_rows:
                    cells = [_normalize_cell(cell) for cell in row]
                    row_text = ' '.join(cells)
                    date_str = _find_date(cells[date_idx]) if date_idx is not None and date_idx < len(cells) else _find_date(row_text)
                    if not date_str:
                        continue

                    description = ''
                    if desc_idx is not None and desc_idx < len(cells):
                        description = cells[desc_idx]
                    else:
                        description = ' '.join([c for c in cells if c and _find_date(c) is None])

                    debit_val = _parse_amount(cells[debit_idx]) if debit_idx is not None and debit_idx < len(cells) else None
                    credit_val = _parse_amount(cells[credit_idx]) if credit_idx is not None and credit_idx < len(cells) else None
                    amount_val = _parse_amount(cells[amount_idx]) if amount_idx is not None and amount_idx < len(cells) else None

                    txn_type = None
                    amount = None
                    if debit_val is not None:
                        txn_type = 'debit'
                        amount = abs(debit_val)
                    elif credit_val is not None:
                        txn_type = 'credit'
                        amount = abs(credit_val)
                    elif amount_val is not None:
                        amount = abs(amount_val)
                        if amount_val < 0:
                            txn_type = 'debit'
                    else:
                        numeric_candidates = [_parse_amount(c) for c in cells]
                        numeric_candidates = [val for val in numeric_candidates if val is not None]
                        if numeric_candidates:
                            amount = abs(numeric_candidates[-1])

                    if amount is None:
                        continue

                    lower_row = row_text.lower()
                    if not txn_type:
                        if 'credit' in lower_row or 'cr' in lower_row or 'received' in lower_row:
                            txn_type = 'credit'
                        elif 'debit' in lower_row or 'dr' in lower_row or 'sent' in lower_row:
                            txn_type = 'debit'
                        else:
                            txn_type = 'debit'
                    date_obj = _parse_date(date_str, default_year=context.get('default_year'), month_year_map=context.get('month_year_map')) or datetime.now()

                    transactions.append({
                        'date': date_obj.strftime('%Y-%m-%d'),
                        'description': description[:100],
                        'amount': -amount if txn_type == 'debit' else amount,
                        'type': txn_type
                    })

            if raw_lines:
                transactions.extend(
                    extract_transactions_from_lines(
                        raw_lines,
                        default_year=context.get('default_year'),
                        month_year_map=context.get('month_year_map')
                    )
                )
    
    # Deduplicate by date+description+amount
    def score_description(text):
        lower = text.lower()
        score = len(text)
        if re.search(r'[A-Za-z]', text):
            score += 10
        if any(keyword in lower for keyword in ['paid to', 'received from', 'cashback', 'money sent', 'money received']):
            score += 20
        return score

    grouped = {}
    for txn in transactions:
        key = (txn['date'], txn['amount'], txn['type'])
        existing = grouped.get(key)
        if not existing or score_description(txn['description']) > score_description(existing['description']):
            grouped[key] = txn

    return list(grouped.values())


def _pdf_text_length(pdf_path):
    total_chars = 0
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ''
                total_chars += len(text.strip())
    except Exception:
        return 0
    return total_chars

def categorize_transaction(description):
    """Categorize transaction using learned feedback first, then ML."""
    learned_category = get_learned_category(description)
    if learned_category:
        return {
            'category': learned_category,
            'confidence': 1.0,
            'needs_review': False,
            'suggested_category': learned_category,
            'source': 'learned-feedback'
        }

    try:
        predicted_category = str(ml_model.predict([description])[0])
        probabilities = ml_model.predict_proba([description])[0]
        confidence = float(max(probabilities))

        needs_review = bool(confidence < CONFIDENCE_THRESHOLD)
        category = 'Unknown' if needs_review else predicted_category
        return {
            'category': category,
            'confidence': round(float(confidence), 2),
            'needs_review': needs_review,
            'suggested_category': predicted_category,
            'source': 'ml-model'
        }
    except Exception:
        return {
            'category': 'Unknown',
            'confidence': 0.0,
            'needs_review': True,
            'suggested_category': 'Other',
            'source': 'fallback'
        }


def learn_transaction_category(description, category):
    normalized = normalize_description(description)
    if not normalized:
        raise ValueError('Description is required.')
    category = remember_custom_category(category)

    feedback_entries = load_feedback_data()
    signature = merchant_signature(description)
    updated = False
    for item in feedback_entries:
        if item.get('normalized_description') == normalized or item.get('merchant_signature') == signature:
            item['description'] = description
            item['category'] = category
            item['merchant_signature'] = signature
            item['updated_at'] = datetime.utcnow().isoformat(timespec='seconds')
            updated = True
            break

    if not updated:
        feedback_entries.append({
            'description': description,
            'normalized_description': normalized,
            'merchant_signature': signature,
            'category': category,
            'updated_at': datetime.utcnow().isoformat(timespec='seconds')
        })

    save_feedback_data(feedback_entries)
    rebuild_model()

@app.route('/api/upload', methods=['POST'])
def upload_statement():
    """Handle PDF statement upload and processing"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save uploaded file temporarily
    safe_name = secure_filename(file.filename or 'statement.pdf')
    upload_path = os.path.join(UPLOADS_DIR, safe_name)
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    file.save(upload_path)
    
    try:
        # Extract transactions from PDF
        transactions = extract_transactions_from_pdf(upload_path)

        # OCR fallback if nothing parsed
        ocr_error = ''
        if not transactions:
            ocr_lines, ocr_error = _extract_text_via_ocr(upload_path)
            if ocr_lines:
                ocr_context = _infer_statement_context('\n'.join(ocr_lines))
                transactions = extract_transactions_from_lines(
                    ocr_lines,
                    default_year=ocr_context.get('default_year'),
                    month_year_map=ocr_context.get('month_year_map')
                )

        if not transactions:
            text_len = _pdf_text_length(upload_path)
            os.remove(upload_path)
            if ocr_error:
                return jsonify({'error': f'OCR failed or is unavailable. {ocr_error}'}), 422
            if text_len == 0:
                return jsonify({'error': 'This PDF looks like a scanned image. OCR is required to read it. Please enable OCR support or upload a text-based statement.'}), 422
            return jsonify({'error': 'No transactions found in this statement. Try a different statement or share a sample format so we can tune the parser.'}), 422
        
        # Apply ML categorization
        for txn in transactions:
            category_data = categorize_transaction(txn['description'])
            txn['category'] = category_data['category']
            txn['confidence'] = category_data['confidence']
            txn['needs_review'] = category_data['needs_review']
            txn['suggested_category'] = category_data['suggested_category']
            txn['learning_source'] = category_data['source']
            txn['id'] = hash(f"{txn['date']}{txn['description']}{txn['amount']}")
        
        # Clean up uploaded file
        os.remove(upload_path)
        
        return safe_jsonify({
            'success': True,
            'transactions': transactions,
            'count': len(transactions),
            'review_questions': create_review_questions(transactions)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/register', methods=['POST'])
def register_user():
    """Create a new account and return a login token."""
    data = request.json or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    users = _load_json_file(USERS_PATH, [])
    if any(user.get('email') == email for user in users):
        return jsonify({'error': 'Account already exists. Please login.'}), 409

    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters.'}), 400

    user = {
        'id': hashlib.sha256(email.encode('utf-8')).hexdigest()[:16],
        'name': name or email.split('@')[0],
        'email': email,
        'password_hash': _hash_password(password),
        'created_at': datetime.utcnow().isoformat(timespec='seconds')
    }
    users.append(user)
    _save_json_file(USERS_PATH, users)

    return jsonify({
        'success': True,
        'user': _public_user(user),
        'token': _auth_token(email),
        'message': 'Account created successfully.'
    })


@app.route('/api/auth/login', methods=['POST'])
def login_user():
    """Simple demo login for project users."""
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    users = _load_json_file(USERS_PATH, [])
    user = next((item for item in users if item.get('email') == email), None)
    if not user or user.get('password_hash') != _hash_password(password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    return jsonify({
        'success': True,
        'user': _public_user(user),
        'token': _auth_token(email)
    })


@app.route('/api/transactions/manual', methods=['POST'])
def add_manual_transaction():
    """Add one user-entered transaction and categorize it immediately."""
    data = request.json or {}
    description = data.get('description', '').strip()
    category = data.get('category', '').strip()
    txn_type = data.get('type', 'debit').strip().lower()
    user_id = data.get('user_id', 'guest')

    try:
        amount = abs(float(data.get('amount', 0)))
    except (TypeError, ValueError):
        return jsonify({'error': 'Amount must be a valid number.'}), 400

    if not description or amount <= 0:
        return jsonify({'error': 'Description and amount are required.'}), 400
    if txn_type not in {'credit', 'debit'}:
        return jsonify({'error': 'Transaction type must be credit or debit.'}), 400

    if category:
        try:
            category = remember_custom_category(category)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
        category_data = {
            'category': category,
            'confidence': 1,
            'needs_review': False,
            'suggested_category': category,
            'source': 'manual'
        }
        learn_transaction_category(description, category)
    else:
        category_data = categorize_transaction(description)

    signed_amount = amount if txn_type == 'credit' else -amount
    txn = {
        'id': hashlib.sha256(f"{datetime.utcnow().isoformat()}{description}{amount}".encode('utf-8')).hexdigest()[:16],
        'date': data.get('date') or datetime.utcnow().date().isoformat(),
        'description': description,
        'amount': signed_amount,
        'type': txn_type,
        'category': category_data['category'],
        'confidence': category_data['confidence'],
        'needs_review': category_data['needs_review'],
        'suggested_category': category_data['suggested_category'],
        'learning_source': category_data['source']
    }

    manual_transactions = _load_json_file(MANUAL_TRANSACTIONS_PATH, {})
    manual_transactions.setdefault(user_id, []).append(txn)
    _save_json_file(MANUAL_TRANSACTIONS_PATH, manual_transactions)

    return safe_jsonify({'success': True, 'transaction': txn})


@app.route('/api/ai-insights', methods=['POST'])
def ai_insights():
    """Generate spending waste and savings recommendations."""
    data = request.json or {}
    transactions = data.get('transactions', [])
    if not isinstance(transactions, list):
        return jsonify({'error': 'Transactions must be a list.'}), 400

    return safe_jsonify({
        'success': True,
        'insights': generate_openai_insights(transactions)
    })

@app.route('/api/categorize', methods=['POST'])
def categorize():
    """Categorize a single transaction description"""
    data = request.json
    description = data.get('description', '')

    return safe_jsonify(categorize_transaction(description))


@app.route('/api/categories', methods=['GET'])
def list_categories():
    """Return built-in and user-created categories."""
    return safe_jsonify({
        'success': True,
        'categories': get_category_options(),
        'base_categories': BASE_CATEGORY_OPTIONS,
        'custom_categories': load_custom_categories()
    })


@app.route('/api/feedback', methods=['POST'])
def save_feedback():
    """Store a user correction and rebuild the model."""
    data = request.json or {}
    description = data.get('description', '').strip()
    category = data.get('category', '').strip()

    if not description:
        return jsonify({'error': 'Description is required.'}), 400
    if not category:
        return jsonify({'error': 'Category is required.'}), 400

    try:
        learn_transaction_category(description, category)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    return safe_jsonify({
        'success': True,
        'category': category,
        'message': 'Correction saved. Future matching transactions will use this category.'
    })

@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """Retrain model with new data"""
    global ml_model
    data = request.json
    new_training_data = data.get('training_data', [])
    
    feedback_entries = load_feedback_data()
    for item in new_training_data:
        description = item.get('description', '').strip()
        category = item.get('category', '').strip()
        if not description or not category:
            continue
        try:
            category = remember_custom_category(category)
        except ValueError:
            continue
        feedback_entries.append({
            'description': description,
            'normalized_description': normalize_description(description),
            'merchant_signature': merchant_signature(description),
            'category': category,
            'updated_at': datetime.utcnow().isoformat(timespec='seconds')
        })

    save_feedback_data(feedback_entries)
    ml_model = rebuild_model()
    
    return safe_jsonify({
        'success': True,
        'message': f'Model retrained with {len(new_training_data)} new examples'
    })

@app.route('/api/analytics', methods=['POST'])
def get_analytics():
    """Generate analytics from transactions"""
    transactions = request.json.get('transactions', [])
    
    if not transactions:
        return jsonify({'error': 'No transactions provided'}), 400

    total_income = 0
    debit_total = 0
    category_spending = {}
    monthly_income = {}
    monthly_expenses = {}

    for transaction in transactions:
        txn_type = str(transaction.get('type', '')).lower()
        try:
            amount = float(transaction.get('amount', 0) or 0)
        except (TypeError, ValueError):
            amount = 0

        month = str(transaction.get('date', ''))[:7] or 'Unknown'
        category = transaction.get('category') or 'Other'

        if txn_type == 'credit':
            total_income += amount
            monthly_income[month] = monthly_income.get(month, 0) + amount
        elif txn_type == 'debit':
            debit_total += amount
            absolute_amount = abs(amount)
            category_spending[category] = category_spending.get(category, 0) + absolute_amount
            monthly_expenses[month] = monthly_expenses.get(month, 0) + absolute_amount

    total_expenses = abs(debit_total)
    balance = total_income - total_expenses

    return safe_jsonify({
        'balance': balance,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'category_spending': category_spending,
        'monthly_income': monthly_income,
        'monthly_expenses': monthly_expenses,
        'transaction_count': len(transactions)
    })

@app.route('/', methods=['GET'])
def index():
    """Basic landing response for hosted API checks."""
    return jsonify({
        'name': 'AI Personal Finance Tracker API',
        'status': 'running',
        'health': '/api/health'
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return safe_jsonify({
        'status': 'healthy',
        'model_loaded': ml_model is not None,
        'categories': get_category_options(),
        'custom_categories': load_custom_categories(),
        'confidence_threshold': CONFIDENCE_THRESHOLD,
        'learned_corrections': len(load_feedback_data())
    })

if __name__ == '__main__':
    # Ensure uploads directory exists
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(RUNTIME_DATA_DIR, exist_ok=True)
    
    print("🚀 AI Finance Tracker Backend Starting...")
    print("📊 ML Model Ready with", len(set([item[1] for item in TRAINING_DATA])), "categories")
    print(f"🌐 Server running on http://localhost:{DEFAULT_PORT}")
    
    app.run(debug=True, host='0.0.0.0', port=DEFAULT_PORT)
