"""
ML Model Training Script for Transaction Categorization
Advanced training with cross-validation, hyperparameter tuning, and evaluation
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

# Extended Training Dataset
TRAINING_DATA = [
    # Food & Dining (50 examples)
    ("Swiggy food delivery", "Food & Dining"),
    ("Zomato restaurant order", "Food & Dining"),
    ("McDonald's meal", "Food & Dining"),
    ("Starbucks coffee", "Food & Dining"),
    ("Dominos pizza delivery", "Food & Dining"),
    ("KFC chicken order", "Food & Dining"),
    ("Subway sandwich", "Food & Dining"),
    ("Burger King", "Food & Dining"),
    ("Pizza Hut", "Food & Dining"),
    ("Cafe Coffee Day", "Food & Dining"),
    ("Food delivery Uber Eats", "Food & Dining"),
    ("Restaurant bill payment", "Food & Dining"),
    ("Breakfast at cafe", "Food & Dining"),
    ("Dinner at restaurant", "Food & Dining"),
    ("Lunch buffet", "Food & Dining"),
    ("Grocery shopping BigBasket", "Food & Dining"),
    ("Fresh vegetables market", "Food & Dining"),
    ("Milk and bread", "Food & Dining"),
    ("Bakery items", "Food & Dining"),
    ("Ice cream parlor", "Food & Dining"),
    
    # Transportation (40 examples)
    ("Uber cab ride", "Transportation"),
    ("Ola auto booking", "Transportation"),
    ("Rapido bike taxi", "Transportation"),
    ("Metro card recharge", "Transportation"),
    ("Petrol pump fill", "Transportation"),
    ("Diesel fuel", "Transportation"),
    ("Bus ticket BMTC", "Transportation"),
    ("Train ticket booking", "Transportation"),
    ("Flight ticket", "Transportation"),
    ("Parking fee mall", "Transportation"),
    ("Toll tax highway", "Transportation"),
    ("Auto rickshaw fare", "Transportation"),
    ("Bike service", "Transportation"),
    ("Car washing", "Transportation"),
    ("Vehicle insurance", "Transportation"),
    ("Car EMI payment", "Transportation"),
    
    # Shopping (45 examples)
    ("Amazon online shopping", "Shopping"),
    ("Flipkart purchase", "Shopping"),
    ("Myntra fashion", "Shopping"),
    ("Ajio clothing", "Shopping"),
    ("Meesho order", "Shopping"),
    ("Snapdeal deal", "Shopping"),
    ("Nike shoes", "Shopping"),
    ("Adidas sportswear", "Shopping"),
    ("H&M store", "Shopping"),
    ("Zara fashion", "Shopping"),
    ("Lifestyle store", "Shopping"),
    ("Shoppers Stop", "Shopping"),
    ("Big Bazaar", "Shopping"),
    ("Reliance Digital electronics", "Shopping"),
    ("Croma gadgets", "Shopping"),
    ("Samsung mobile", "Shopping"),
    ("Apple iPhone", "Shopping"),
    ("Dell laptop", "Shopping"),
    ("HP printer", "Shopping"),
    ("Furniture shopping", "Shopping"),
    
    # Entertainment (35 examples)
    ("Netflix subscription", "Entertainment"),
    ("Amazon Prime Video", "Entertainment"),
    ("Disney+ Hotstar", "Entertainment"),
    ("Spotify Premium", "Entertainment"),
    ("YouTube Premium", "Entertainment"),
    ("Apple Music", "Entertainment"),
    ("Gaana Plus", "Entertainment"),
    ("Movie ticket BookMyShow", "Entertainment"),
    ("PVR cinema", "Entertainment"),
    ("INOX theater", "Entertainment"),
    ("Gaming subscription Xbox", "Entertainment"),
    ("PlayStation Plus", "Entertainment"),
    ("Steam game purchase", "Entertainment"),
    ("Concert ticket", "Entertainment"),
    ("Event pass", "Entertainment"),
    ("Theme park entry", "Entertainment"),
    
    # Bills & Utilities (40 examples)
    ("Electricity bill BESCOM", "Bills & Utilities"),
    ("Water bill payment", "Bills & Utilities"),
    ("Gas cylinder booking", "Bills & Utilities"),
    ("Internet broadband ACT", "Bills & Utilities"),
    ("Jio Fiber bill", "Bills & Utilities"),
    ("Airtel broadband", "Bills & Utilities"),
    ("Mobile recharge Jio", "Bills & Utilities"),
    ("Airtel prepaid", "Bills & Utilities"),
    ("Vodafone recharge", "Bills & Utilities"),
    ("DTH recharge Tata Sky", "Bills & Utilities"),
    ("Dish TV", "Bills & Utilities"),
    ("Airtel Digital TV", "Bills & Utilities"),
    ("Postpaid bill", "Bills & Utilities"),
    ("Credit card bill payment", "Bills & Utilities"),
    ("Loan EMI", "Bills & Utilities"),
    ("House rent payment", "Bills & Utilities"),
    ("Society maintenance", "Bills & Utilities"),
    
    # Healthcare (30 examples)
    ("Apollo Pharmacy", "Healthcare"),
    ("MedPlus medicine", "Healthcare"),
    ("1mg online pharmacy", "Healthcare"),
    ("PharmEasy order", "Healthcare"),
    ("Doctor consultation", "Healthcare"),
    ("Hospital bill", "Healthcare"),
    ("Lab test PathLabs", "Healthcare"),
    ("X-ray scan", "Healthcare"),
    ("Blood test", "Healthcare"),
    ("Dental checkup", "Healthcare"),
    ("Eye checkup", "Healthcare"),
    ("Health insurance premium", "Healthcare"),
    ("Gym membership", "Healthcare"),
    ("Yoga classes", "Healthcare"),
    ("Physiotherapy", "Healthcare"),
    
    # Education (25 examples)
    ("Udemy course", "Education"),
    ("Coursera subscription", "Education"),
    ("Skillshare premium", "Education"),
    ("LinkedIn Learning", "Education"),
    ("Book purchase Amazon", "Education"),
    ("Kindle Unlimited", "Education"),
    ("School fee", "Education"),
    ("Tuition fee", "Education"),
    ("Exam fee", "Education"),
    ("Stationery shopping", "Education"),
    ("Online coaching", "Education"),
    
    # Investment (25 examples)
    ("Zerodha stock purchase", "Investment"),
    ("Groww mutual fund", "Investment"),
    ("SIP investment", "Investment"),
    ("Upstox trading", "Investment"),
    ("Angel One equity", "Investment"),
    ("ICICI Direct", "Investment"),
    ("HDFC Securities", "Investment"),
    ("Gold purchase Digital", "Investment"),
    ("Fixed deposit", "Investment"),
    ("PPF deposit", "Investment"),
    ("NPS contribution", "Investment"),
    
    # Salary/Income (20 examples)
    ("Salary credited", "Salary"),
    ("Monthly payroll", "Salary"),
    ("Bonus payment", "Salary"),
    ("Incentive received", "Salary"),
    ("Freelance payment", "Salary"),
    ("Consultancy fees", "Salary"),
    ("Dividend income", "Salary"),
    ("Interest credited", "Salary"),
    ("Rental income", "Salary"),
    ("Refund received", "Salary"),
    
    # Transfer (20 examples)
    ("Money transfer to friend", "Transfer"),
    ("Bank transfer", "Transfer"),
    ("NEFT transfer", "Transfer"),
    ("IMPS transfer", "Transfer"),
    ("RTGS payment", "Transfer"),
    ("Google Pay sent", "Transfer"),
    ("PhonePe transfer", "Transfer"),
    ("Paytm wallet", "Transfer"),
    ("UPI payment sent", "Transfer"),
    ("Cash withdrawal ATM", "Transfer"),
]

def prepare_data():
    """Prepare training and test datasets"""
    descriptions = [item[0] for item in TRAINING_DATA]
    categories = [item[1] for item in TRAINING_DATA]
    
    df = pd.DataFrame({
        'description': descriptions,
        'category': categories
    })
    
    return df

def train_naive_bayes(X_train, y_train):
    """Train Naive Bayes model"""
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=200)),
        ('classifier', MultinomialNB(alpha=0.1))
    ])
    model.fit(X_train, y_train)
    return model

def train_logistic_regression(X_train, y_train):
    """Train Logistic Regression model"""
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=200)),
        ('classifier', LogisticRegression(max_iter=1000, C=1.0))
    ])
    model.fit(X_train, y_train)
    return model

def train_random_forest(X_train, y_train):
    """Train Random Forest model"""
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=200)),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test, model_name):
    """Evaluate model performance"""
    y_pred = model.predict(X_test)
    
    print(f"\n{'='*60}")
    print(f"{model_name} Performance")
    print(f"{'='*60}")
    
    # Accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    
    # Classification Report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    
    return accuracy, y_pred, cm

def plot_confusion_matrix(cm, categories, model_name):
    """Plot confusion matrix"""
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=categories, yticklabels=categories)
    plt.title(f'Confusion Matrix - {model_name}')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(f'confusion_matrix_{model_name.replace(" ", "_").lower()}.png')
    print(f"\nConfusion matrix saved as: confusion_matrix_{model_name.replace(' ', '_').lower()}.png")

def hyperparameter_tuning(X_train, y_train):
    """Perform hyperparameter tuning using GridSearchCV"""
    print("\n" + "="*60)
    print("Hyperparameter Tuning")
    print("="*60)
    
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer()),
        ('classifier', MultinomialNB())
    ])
    
    parameters = {
        'tfidf__ngram_range': [(1, 1), (1, 2), (1, 3)],
        'tfidf__max_features': [100, 200, 300],
        'classifier__alpha': [0.01, 0.1, 1.0]
    }
    
    grid_search = GridSearchCV(pipeline, parameters, cv=5, n_jobs=-1, verbose=1)
    grid_search.fit(X_train, y_train)
    
    print(f"\nBest parameters: {grid_search.best_params_}")
    print(f"Best cross-validation score: {grid_search.best_score_:.4f}")
    
    return grid_search.best_estimator_

def cross_validate(model, X, y):
    """Perform cross-validation"""
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"\nCross-validation scores: {scores}")
    print(f"Mean accuracy: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")

def test_predictions(model, test_cases):
    """Test model with sample cases"""
    print("\n" + "="*60)
    print("Sample Predictions")
    print("="*60)
    
    for description in test_cases:
        prediction = model.predict([description])[0]
        probabilities = model.predict_proba([description])[0]
        confidence = max(probabilities)
        
        print(f"\nDescription: {description}")
        print(f"Predicted Category: {prediction}")
        print(f"Confidence: {confidence:.2%}")

def main():
    """Main training pipeline"""
    print("="*60)
    print("AI Finance Tracker - ML Model Training")
    print("="*60)
    
    # Prepare data
    df = prepare_data()
    print(f"\nTotal training samples: {len(df)}")
    print(f"Categories: {df['category'].nunique()}")
    print(f"\nCategory distribution:")
    print(df['category'].value_counts())
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        df['description'], df['category'], 
        test_size=0.2, random_state=42, stratify=df['category']
    )
    
    print(f"\nTraining samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Train models
    print("\n" + "="*60)
    print("Training Models")
    print("="*60)
    
    models = {
        'Naive Bayes': train_naive_bayes(X_train, y_train),
        'Logistic Regression': train_logistic_regression(X_train, y_train),
        'Random Forest': train_random_forest(X_train, y_train)
    }
    
    # Evaluate models
    results = {}
    for name, model in models.items():
        accuracy, y_pred, cm = evaluate_model(model, X_test, y_test, name)
        results[name] = accuracy
        
        # Plot confusion matrix
        categories = sorted(df['category'].unique())
        plot_confusion_matrix(cm, categories, name)
        
        # Cross-validation
        cross_validate(model, df['description'], df['category'])
    
    # Select best model
    best_model_name = max(results, key=results.get)
    best_model = models[best_model_name]
    
    print("\n" + "="*60)
    print(f"Best Model: {best_model_name}")
    print(f"Accuracy: {results[best_model_name]:.4f}")
    print("="*60)
    
    # Hyperparameter tuning for best model
    if best_model_name == 'Naive Bayes':
        tuned_model = hyperparameter_tuning(X_train, y_train)
        tuned_accuracy, _, _ = evaluate_model(tuned_model, X_test, y_test, "Tuned Naive Bayes")
        
        if tuned_accuracy > results[best_model_name]:
            best_model = tuned_model
            print(f"\nTuned model is better! New accuracy: {tuned_accuracy:.4f}")
    
    # Save best model
    joblib.dump(best_model, 'transaction_classifier.pkl')
    print("\n✅ Model saved as: transaction_classifier.pkl")
    
    # Test with sample cases
    test_cases = [
        "Netflix monthly subscription",
        "Amazon Prime shopping order",
        "Uber cab to airport",
        "Salary deposit from company",
        "Electricity bill BESCOM",
        "Apollo pharmacy medicines",
        "Coursera online course",
        "Zerodha stock trading",
        "Swiggy dinner order",
        "Jio mobile recharge"
    ]
    
    test_predictions(best_model, test_cases)
    
    # Save category list
    categories = sorted(df['category'].unique())
    with open('categories.txt', 'w') as f:
        for cat in categories:
            f.write(f"{cat}\n")
    
    print("\n✅ Categories saved as: categories.txt")
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)

if __name__ == '__main__':
    main()
    