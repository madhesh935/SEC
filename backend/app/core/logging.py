"""Structured logging configuration.

Conversation text and other sensitive patient content must never be logged here -
it belongs in controlled Firestore records only (see conversation_repository).
"""

from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar

import structlog

from app.config import get_settings

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

_SENSITIVE_KEYS = {
    "password",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "authorization",
    "transcript",
    "response_text",
    "pairing_code",
}


def _scrub_sensitive(_logger, _method_name, event_dict):
    for key in list(event_dict.keys()):
        if key.lower() in _SENSITIVE_KEYS:
            event_dict[key] = "***redacted***"
    return event_dict


def _inject_request_id(_logger, _method_name, event_dict):
    event_dict["request_id"] = request_id_ctx.get()
    return event_dict


def configure_logging() -> None:
    settings = get_settings()
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            _inject_request_id,
            _scrub_sensitive,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str):
    return structlog.get_logger(name)


def new_request_id() -> str:
    return uuid.uuid4().hex[:16]
