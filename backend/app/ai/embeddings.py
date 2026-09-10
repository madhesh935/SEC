"""Sentence-embedding engine.

The model is loaded exactly once (see app.main lifespan) and reused across
requests - it must never be reloaded per-request (spec sections 18, 77).
"""

from __future__ import annotations

import os
from typing import TYPE_CHECKING, Any

import numpy as np

# huggingface_hub's optional Rust-based "hf_xet" fast-download backend has a
# reproducible memory-allocation crash pulling model.safetensors on some
# Windows/Python builds. Force the plain HTTP downloader instead - it's
# slightly slower on first run (weights are cached afterwards) but reliable
# everywhere. Must be set before `sentence_transformers`/`huggingface_hub`
# is imported, and only if the environment hasn't already made a choice.
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

from app.config import get_settings
from app.core.logging import get_logger
from app.utils.similarity import cosine_similarity

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

logger = get_logger(__name__)


class EmbeddingEngine:
    def __init__(self) -> None:
        self._model: Any | None = None

    def load(self) -> None:
        # Imported lazily so importing this module (e.g. via orchestrator's
        # type hints) never forces a torch/sentence-transformers install for
        # code paths - like the unit test suite - that never call load().
        if self._model is not None:
            return
        from sentence_transformers import SentenceTransformer

        settings = get_settings()
        logger.info("embedding_model_loading", model=settings.embedding_model)
        self._model = SentenceTransformer(settings.embedding_model)
        logger.info("embedding_model_loaded", model=settings.embedding_model)

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self.load()
        assert self._model is not None
        return self._model

    def embed_text(self, text: str) -> np.ndarray:
        return self.model.encode(text, normalize_embeddings=True)

    def embed_texts(self, texts: list[str]) -> list[np.ndarray]:
        if not texts:
            return []
        vectors = self.model.encode(texts, normalize_embeddings=True)
        return list(vectors)

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        return cosine_similarity(a, b)
