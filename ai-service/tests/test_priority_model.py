"""
Tests for OncologyPriorityModel and extract_features().
"""
import sys
import os

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.models.priority_model import (
    DISPOSITION_CLASSES,
    FEATURE_COLUMNS,
    OncologyPriorityModel,
    extract_features,
)


def _make_feature_row(**overrides) -> dict:
    """Return a valid 32-feature dict with sensible defaults, overridable per test."""
    row = {col: 0 for col in FEATURE_COLUMNS}
    row.update({"age": 60, "stage_num": 2, "days_since_last_chemo": 999, "mascc_score": 26})
    row.update(overrides)
    return row


def _make_training_data(n_per_class: int = 25) -> tuple[pd.DataFrame, pd.Series]:
    """
    Build a synthetic DataFrame with all 32 features and balanced labels (0–4).
    Uses n_per_class >= min_child_samples=20 so LightGBM can learn all classes.
    """
    rng = np.random.default_rng(42)
    rows = []
    labels = []

    scenarios = {
        0: {"pain_score": 1, "ecog_score": 0, "has_fever": 0, "in_nadir_window": 0},   # REMOTE_NURSING
        1: {"pain_score": 3, "ecog_score": 1, "has_fever": 0, "in_nadir_window": 0},   # SCHEDULED_CONSULT
        2: {"pain_score": 5, "ecog_score": 2, "has_fever": 0, "in_nadir_window": 0},   # ADVANCE_CONSULT
        3: {"pain_score": 7, "ecog_score": 2, "has_fever": 1, "in_risk_window": 1},    # ER_DAYS
        4: {"pain_score": 9, "ecog_score": 3, "has_fever": 1, "in_nadir_window": 1},   # ER_IMMEDIATE
    }

    for label, overrides in scenarios.items():
        for _ in range(n_per_class):
            row = _make_feature_row(**overrides)
            # Add small random jitter so LightGBM sees variation
            row["age"] = int(rng.integers(30, 80))
            row["stage_num"] = int(rng.integers(1, 5))
            rows.append(row)
            labels.append(label)

    X = pd.DataFrame(rows)[FEATURE_COLUMNS]
    y = pd.Series(labels, dtype=int)
    return X, y


@pytest.fixture(scope="module")
def trained_model():
    """Provide an OncologyPriorityModel trained with balanced synthetic data."""
    model = OncologyPriorityModel()
    X, y = _make_training_data()
    model.train(X, y)
    return model


class TestOncologyPriorityModelInitialState:

    def test_initial_state_not_trained(self):
        model = OncologyPriorityModel()
        assert model.is_trained is False

    def test_predict_single_returns_fallback_when_not_trained(self):
        model = OncologyPriorityModel()
        features = _make_feature_row()
        result = model.predict_single(features)
        assert result["source"] == "fallback_rules"
        assert "disposition" in result
        assert "predicted_class" in result
        assert "confidence" in result

    def test_legacy_predict_returns_array_of_50_when_not_trained(self):
        model = OncologyPriorityModel()
        X = pd.DataFrame([_make_feature_row(), _make_feature_row()])[FEATURE_COLUMNS]
        result = model.predict(X)
        assert isinstance(result, np.ndarray)
        assert len(result) == 2
        assert np.all(result == 50.0)


class TestOncologyPriorityModelTraining:

    def test_train_sets_is_trained(self, trained_model):
        assert trained_model.is_trained is True

    def test_train_returns_classification_report(self):
        model = OncologyPriorityModel()
        X, y = _make_training_data(n_per_class=22)
        report = model.train(X, y)
        assert "classification_report" in report
        assert "macro avg" in report["classification_report"]


class TestOncologyPriorityModelPrediction:

    def test_predict_single_returns_required_keys(self, trained_model):
        features = _make_feature_row(pain_score=5, ecog_score=1)
        result = trained_model.predict_single(features)
        assert set(result.keys()) >= {"disposition", "predicted_class", "probabilities", "confidence", "source"}

    def test_predict_single_disposition_in_valid_set(self, trained_model):
        features = _make_feature_row(pain_score=5)
        result = trained_model.predict_single(features)
        assert result["disposition"] in DISPOSITION_CLASSES

    def test_predict_single_confidence_in_range(self, trained_model):
        features = _make_feature_row()
        result = trained_model.predict_single(features)
        assert 0.0 <= result["confidence"] <= 1.0

    def test_predict_single_source_is_ml_model(self, trained_model):
        features = _make_feature_row()
        result = trained_model.predict_single(features)
        assert result["source"] == "ml_model"

    def test_legacy_predict_returns_array_correct_length(self, trained_model):
        rows = [_make_feature_row(pain_score=i) for i in range(4)]
        X = pd.DataFrame(rows)[FEATURE_COLUMNS]
        result = trained_model.predict(X)
        assert isinstance(result, np.ndarray)
        assert len(result) == 4

    def test_legacy_predict_scores_clipped_to_0_100(self, trained_model):
        rows = [_make_feature_row(), _make_feature_row(pain_score=10, has_fever=1, in_nadir_window=1)]
        X = pd.DataFrame(rows)[FEATURE_COLUMNS]
        result = trained_model.predict(X)
        assert np.all(result >= 0)
        assert np.all(result <= 100)


class TestOncologyPriorityModelFallback:

    def test_fallback_predicts_er_immediate_on_fever_plus_nadir(self):
        model = OncologyPriorityModel()
        features = _make_feature_row(has_fever=1, in_nadir_window=1, in_risk_window=1)
        result = model._fallback_predict(features)
        assert result["disposition"] == "ER_IMMEDIATE"
        assert result["source"] == "fallback_rules"

    def test_fallback_predicts_remote_nursing_on_no_risk_factors(self):
        model = OncologyPriorityModel()
        features = _make_feature_row()
        result = model._fallback_predict(features)
        assert result["disposition"] == "REMOTE_NURSING"


class TestCategorizePriority:

    def test_critical_threshold(self, trained_model):
        assert trained_model.categorize_priority(100.0) == "CRITICAL"
        assert trained_model.categorize_priority(75.0) == "CRITICAL"

    def test_high_threshold(self, trained_model):
        assert trained_model.categorize_priority(74.9) == "HIGH"
        assert trained_model.categorize_priority(50.0) == "HIGH"

    def test_medium_threshold(self, trained_model):
        assert trained_model.categorize_priority(49.9) == "MEDIUM"
        assert trained_model.categorize_priority(25.0) == "MEDIUM"

    def test_low_threshold(self, trained_model):
        assert trained_model.categorize_priority(24.9) == "LOW"
        assert trained_model.categorize_priority(0.0) == "LOW"


class TestSaveLoad:

    def test_save_raises_when_not_trained(self, tmp_path):
        model = OncologyPriorityModel()
        with pytest.raises(ValueError, match="not trained"):
            model.save(str(tmp_path / "model.joblib"))

    def test_save_and_load_roundtrip(self, trained_model, tmp_path):
        filepath = str(tmp_path / "test_model.joblib")
        trained_model.save(filepath)

        loaded = OncologyPriorityModel()
        loaded.load(filepath)
        assert loaded.is_trained is True

        features = _make_feature_row(pain_score=5, ecog_score=1)
        result = loaded.predict_single(features)
        assert result["disposition"] in DISPOSITION_CLASSES

    def test_load_raises_when_file_not_found(self):
        model = OncologyPriorityModel()
        with pytest.raises(FileNotFoundError):
            model.load("/nonexistent/path/model.joblib")


class TestExtractFeatures:

    def test_extract_features_returns_all_columns(self):
        clinical_context = {
            "patient": {"age": 65, "cancerType": "breast", "stage": "III"},
            "treatments": [],
            "medications": [],
            "comorbidities": [],
            "performanceStatusHistory": [],
        }
        symptom_analysis = {"detectedSymptoms": [], "structuredData": {"scales": {}}}
        features = extract_features(clinical_context, symptom_analysis)
        for col in FEATURE_COLUMNS:
            assert col in features, f"Missing feature: {col}"

    def test_extract_features_fever_keyword_sets_has_fever(self):
        clinical_context = {
            "patient": {},
            "treatments": [],
            "medications": [],
            "comorbidities": [],
            "performanceStatusHistory": [],
        }
        symptom_analysis = {
            "detectedSymptoms": [{"name": "febre", "severity": "HIGH"}],
            "structuredData": {"scales": {}},
        }
        features = extract_features(clinical_context, symptom_analysis)
        assert features["has_fever"] == 1
