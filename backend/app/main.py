"""FastAPI application entrypoint."""

from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import get_settings
from app.core.exceptions import GeriCareError
from app.core.logging import configure_logging, get_logger, request_id_ctx
from app.database.firebase import initialize_firebase
from app.dependencies import get_embedding_engine

configure_logging()
logger = get_logger(__name__)

OPENAPI_TAGS = [
    {"name": "Authentication", "description": "Firebase-authenticated user identity and roles."},
    {"name": "Pairing", "description": "Patient device pairing."},
    {"name": "Patients", "description": "Patient profile CRUD and status."},
    {"name": "Family", "description": "Family member records."},
    {"name": "Memories", "description": "Personal biographical memories."},
    {"name": "Conversation", "description": "Voice/text conversation and help requests."},
    {"name": "Comfort", "description": "Approved comfort content."},
    {"name": "Activities", "description": "Optional cognitive activities and family prompts."},
    {"name": "Analytics", "description": "Caregiver-facing interaction analytics."},
    {"name": "Alerts", "description": "Caregiver alert lifecycle."},
    {"name": "Consent", "description": "AI/data usage consent settings."},
    {"name": "Media", "description": "Secure media uploads."},
    {"name": "Realtime", "description": "Caregiver dashboard live updates."},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    settings.validate_production_secrets()

    initialize_firebase()

    # Load the embedding model once at startup (spec sections 18, 77) - never
    # reloaded per-request.
    get_embedding_engine().load()

    logger.info("application_startup_complete", env=settings.app_env)
    yield
    logger.info("application_shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Voice-first, stage-adaptive AI companion backend for dementia care.",
        version="0.1.0",
        openapi_tags=OPENAPI_TAGS,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = uuid.uuid4().hex[:16]
        token = request_id_ctx.set(request_id)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            request_id_ctx.reset(token)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            latency_ms=latency_ms,
        )
        return response

    @app.exception_handler(GeriCareError)
    async def gericare_error_handler(request: Request, exc: GeriCareError) -> JSONResponse:
        request_id = request_id_ctx.get()
        logger.warning("handled_error", code=exc.code, path=request.url.path, request_id=request_id)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "requestId": request_id,
                }
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = request_id_ctx.get()
        logger.error(
            "unhandled_error", path=request.url.path, request_id=request_id, error=str(exc)
        )
        content = {
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred.",
                "requestId": request_id,
            }
        }
        if not settings.is_production:
            content["error"]["debug"] = str(exc)
        return JSONResponse(status_code=500, content=content)

    @app.get("/health", tags=["Health"])
    async def health() -> dict:
        return {"status": "ok"}

    @app.get("/health/ready", tags=["Health"])
    async def health_ready() -> dict:
        checks = {"firestore": "unknown", "embedding_model": "unknown"}
        try:
            from app.database.firestore import db

            db().collection("_health").limit(1).get()
            checks["firestore"] = "ok"
        except Exception:
            checks["firestore"] = "unavailable"

        checks["embedding_model"] = "ok" if get_embedding_engine()._model is not None else "loading"

        overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
        return {"status": overall, "checks": checks}

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()
