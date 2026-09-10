from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class MediaUploadResponse(BaseModel):
    url: str
    mediaType: Literal["image", "audio", "video"]
    fileName: str
    sizeBytes: int
