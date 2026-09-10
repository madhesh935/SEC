"""Centralized Firebase Admin SDK initialization.

This module is the ONLY place firebase_admin.initialize_app() is called.
Repositories and services must obtain clients via get_firestore_client() /
get_storage_bucket() rather than initializing Firebase themselves.
"""

from __future__ import annotations

import os

import firebase_admin
from firebase_admin import credentials, firestore, storage

from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_app: firebase_admin.App | None = None


def initialize_firebase() -> firebase_admin.App:
    global _app
    if _app is not None:
        return _app

    settings = get_settings()

    if settings.firebase_service_account_path and os.path.exists(
        settings.firebase_service_account_path
    ):
        cred = credentials.Certificate(settings.firebase_service_account_path)
    else:
        # Falls back to Application Default Credentials (e.g. on Cloud Run with
        # a bound service account). Local development requires a service
        # account JSON referenced by FIREBASE_SERVICE_ACCOUNT_PATH.
        logger.warning(
            "firebase_service_account_missing",
            msg="No service account file found; falling back to Application Default Credentials.",
        )
        cred = credentials.ApplicationDefault()

    _app = firebase_admin.initialize_app(
        cred,
        {
            "projectId": settings.firebase_project_id or None,
            "storageBucket": settings.firebase_storage_bucket or None,
        },
    )
    logger.info("firebase_initialized", project_id=settings.firebase_project_id)
    return _app


def get_firestore_client():
    initialize_firebase()
    return firestore.client()


def get_storage_bucket():
    initialize_firebase()
    return storage.bucket()


def server_timestamp():
    return firestore.SERVER_TIMESTAMP
