"""Lightweight in-memory rate limiting for abuse-prone endpoints (spec
section 63): pairing verification, voice uploads, auth. This is process-local
and intended for a single-instance hackathon deployment; a production
deployment behind multiple instances should back this with Redis instead.

Rate-limits network abuse (repeated pairing/auth attempts), never a patient's
own semantic repetition of questions - that is handled by the repetition
engine, not this module.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from app.core.exceptions import RateLimitError


class SlidingWindowRateLimiter:
    def __init__(self, max_attempts: int, window_seconds: int) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        attempts = self._attempts[key]
        while attempts and now - attempts[0] > self.window_seconds:
            attempts.popleft()
        if len(attempts) >= self.max_attempts:
            raise RateLimitError("Too many attempts. Please wait before trying again.")
        attempts.append(now)


pairing_verify_limiter = SlidingWindowRateLimiter(max_attempts=5, window_seconds=300)
auth_limiter = SlidingWindowRateLimiter(max_attempts=10, window_seconds=300)
voice_upload_limiter = SlidingWindowRateLimiter(max_attempts=30, window_seconds=60)
