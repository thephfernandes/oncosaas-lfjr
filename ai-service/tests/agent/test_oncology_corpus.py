"""Validação estática do corpus RAG (sem embeddings)."""

import json
from pathlib import Path

import pytest

_CORPUS_PATH = Path(__file__).resolve().parents[2] / "src" / "agent" / "rag" / "oncology_corpus.json"
_REQUIRED_KEYS = frozenset({"id", "category", "cancer_types", "title", "content"})


def _load_corpus():
    with open(_CORPUS_PATH, encoding="utf-8") as f:
        return json.load(f)


def test_oncology_corpus_is_valid_json_array():
    data = _load_corpus()
    assert isinstance(data, list)
    assert len(data) >= 20


def test_oncology_corpus_unique_ids():
    data = _load_corpus()
    ids = [d["id"] for d in data]
    assert len(ids) == len(set(ids))


def test_oncology_corpus_document_schema():
    data = _load_corpus()
    for doc in data:
        assert _REQUIRED_KEYS <= set(doc.keys())
        assert isinstance(doc["cancer_types"], list)
        assert len(doc["cancer_types"]) >= 1
        for ct in doc["cancer_types"]:
            assert ct == ct.upper()
        assert len(doc["content"]) >= 100
        assert len(doc["title"]) >= 5


def test_oncology_corpus_has_bladder_documents():
    data = _load_corpus()
    bladder = [d for d in data if "BLADDER" in d.get("cancer_types", [])]
    assert len(bladder) >= 1


@pytest.mark.parametrize(
    "query",
    [
        "cistoscopia o que esperar",
        "sangue na urina",
    ],
)
def test_rag_queries_return_passages_bladder_optional(query):
    """Regressão com embeddings: opcional (export RUN_RAG_RETRIEVAL_TESTS=1). Pesado para CI padrão."""
    import os

    if os.environ.get("RUN_RAG_RETRIEVAL_TESTS") != "1":
        pytest.skip("Defina RUN_RAG_RETRIEVAL_TESTS=1 para rodar retrieval com FAISS")

    from src.agent.rag.knowledge_base import knowledge_rag

    if not knowledge_rag.initialize():
        pytest.skip("RAG não inicializou")

    passages = knowledge_rag.retrieve(query=query, cancer_type="BLADDER", top_k=4)
    assert len(passages) >= 1
