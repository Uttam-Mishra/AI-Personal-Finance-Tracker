# AI Personal Finance Tracker

AI Personal Finance Tracker is a full-stack web app that reads UPI statement PDFs, extracts transactions automatically, categorizes them with machine learning, and shows spending analytics in a dashboard.

## Features

- Upload UPI statement PDFs
- Parse transaction date, amount, description, and type
- Support common layouts such as Paytm-style statements
- Categorize spending with an ML model
- Flag low-confidence predictions as `Unknown`
- Let users correct unknown transactions
- Learn from user corrections for future categorization
- Show dashboard totals, category splits, and monthly trends
- Use demo data when you want to preview the UI quickly

## Tech Stack

- Frontend: React, Vite, Recharts, CSS
- Backend: Python, Flask, pdfplumber, pandas
- ML: scikit-learn, TF-IDF, Multinomial Naive Bayes
- OCR fallback: pytesseract, pdf2image

## Local Run

### Backend

```bash
cd "/Users/uttammishra/IP PROJECT/Frontend"
python3 -m pip install -r requirements.txt
python3 Backend.py
```

Backend runs on `http://localhost:5001`.

### Frontend

```bash
cd "/Users/uttammishra/IP PROJECT/Frontend/client"
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Deployment

### Frontend on Netlify

- Netlify config is in `/Users/uttammishra/IP PROJECT/netlify.toml`
- Base directory: `Frontend/client`
- Build command: `npm run build`
- Publish directory: `dist`
- Set environment variable:
  - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

### Backend on Render

- Render config is in `/Users/uttammishra/IP PROJECT/render.yaml`
- Root directory: `Frontend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn --bind 0.0.0.0:$PORT Backend:app`
- Health check path: `/api/health`

## Important Runtime Files

The backend now writes generated files into `/Users/uttammishra/IP PROJECT/Frontend/runtime_data`, which is ignored by Git:

- `transaction_classifier.pkl`
- `learned_corrections.json`

Uploaded PDFs are stored temporarily in `/Users/uttammishra/IP PROJECT/Frontend/uploads`, which is also ignored by Git.
