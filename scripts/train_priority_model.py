"""
Script para treinar modelo de priorização
"""

import pandas as pd
import numpy as np
from pathlib import Path
import sys
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

# Adicionar path do ai-service
sys.path.insert(0, str(Path(__file__).parent.parent / "ai-service"))

from src.models.priority_model import PriorityModel


def train_model():
    """Treina modelo de priorização"""
    
    # Carregar dados
    data_file = Path("data/synthetic_patients.csv")
    if not data_file.exists():
        print(f"Arquivo não encontrado: {data_file}")
        print("Execute primeiro: python scripts/generate_synthetic_data.py")
        return
    
    print("Carregando dataset...")
    df = pd.read_csv(data_file)
    
    # Preparar features
    X = df[[
        'cancer_type', 'stage', 'performance_status', 'age',
        'pain_score', 'nausea_score', 'fatigue_score',
        'days_since_last_visit', 'treatment_cycle'
    ]].copy()
    
    y = df['priority_score']
    
    # Encoding categórico
    le_cancer = LabelEncoder()
    le_stage = LabelEncoder()
    
    X['cancer_type_encoded'] = le_cancer.fit_transform(X['cancer_type'])
    X['stage_encoded'] = le_stage.fit_transform(X['stage'])
    X = X.drop(['cancer_type', 'stage'], axis=1)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Treinando modelo...")
    print(f"  Treino: {len(X_train)} amostras")
    print(f"  Teste: {len(X_test)} amostras")
    
    # Treinar modelo
    model = PriorityModel()
    model.train(X_train, y_train)
    
    # Avaliar
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\nMétricas:")
    print(f"  MAE: {mae:.2f}")
    print(f"  R²: {r2:.2f}")
    
    # Salvar modelo
    model_dir = Path("ai-service/models")
    model_dir.mkdir(exist_ok=True)
    model_file = model_dir / "priority_model.pkl"
    
    model.save(str(model_file))
    print(f"\nModelo salvo: {model_file}")
    
    # Salvar encoders
    import joblib
    encoders_file = model_dir / "label_encoders.pkl"
    joblib.dump({
        'cancer_type': le_cancer,
        'stage': le_stage,
    }, encoders_file)
    print(f"Encoders salvos: {encoders_file}")


if __name__ == "__main__":
    train_model()


