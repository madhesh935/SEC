"""Shared test fixtures.

Unit tests exercise pure engine functions directly. Integration-style tests
in this suite inject fake in-memory repositories into services/orchestrator
constructors rather than touching real Firebase - real Whisper/LLM/
Firestore calls must never happen during the normal test run (spec section
70).
"""

from __future__ import annotations

import os

os.environ.setdefault("JWT_SECRET", "test-only-signing-secret-at-least-32-characters")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")

import pytest


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    from app.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
