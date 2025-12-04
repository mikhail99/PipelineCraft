"""Pydantic schemas for API request/response."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# =============================================================================
# Paper Schemas
# =============================================================================

class PaperBase(BaseModel):
    title: str
    abstract: Optional[str] = None
    authors: Optional[str] = None
    publish_date: Optional[datetime] = None
    text_markdown: Optional[str] = None


class PaperCreate(PaperBase):
    id: Optional[str] = None


class PaperResponse(PaperBase):
    id: str
    created_date: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Library Schemas
# =============================================================================

class LibraryBase(BaseModel):
    name: str
    description: Optional[str] = None


class LibraryCreate(LibraryBase):
    pass


class LibraryResponse(LibraryBase):
    id: str
    created_date: datetime
    paper_count: int = 0
    papers: List[PaperResponse] = []

    class Config:
        from_attributes = True


class LibrarySummary(BaseModel):
    """Minimal library info for listings."""
    id: str
    name: str
    description: Optional[str] = None
    paper_count: int = 0
    created_date: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Template Schemas
# =============================================================================

class TemplateBase(BaseModel):
    name: str
    prompt: str
    description: Optional[str] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateResponse(TemplateBase):
    id: str
    created_date: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Report Schemas
# =============================================================================

class ReportBase(BaseModel):
    name: str
    template_id: Optional[str] = None
    library_ids: Optional[List[str]] = None
    user_prompt: Optional[str] = None


class ReportCreate(ReportBase):
    pass


class ReportResponse(BaseModel):
    id: str
    name: str
    template_id: Optional[str] = None
    library_ids: Optional[List[str]] = None
    user_prompt: Optional[str] = None
    content_markdown: Optional[str] = None
    status: str
    created_date: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Entity Schemas (for frontend compatibility)
# =============================================================================

class EntityConfig(BaseModel):
    description: Optional[str] = None
    operationName: Optional[str] = None
    inputParams: Optional[dict] = None


class EntityData(BaseModel):
    """Flexible data container for entity preview."""
    papers: Optional[List[PaperResponse]] = None
    paper_count: Optional[int] = None
    prompt: Optional[str] = None
    content_markdown: Optional[str] = None
    library_names: Optional[List[str]] = None
    template_name: Optional[str] = None


class Entity(BaseModel):
    """Generic entity matching frontend Entity interface."""
    id: str
    name: str
    type: str  # 'library', 'template', 'report'
    status: str = "ok"  # 'ok', 'stale', 'error', 'pending'
    folderId: Optional[str] = None
    dependencies: List[str] = []
    config: Optional[EntityConfig] = None
    data: Optional[EntityData] = None
    created_date: datetime

    class Config:
        from_attributes = True


class Folder(BaseModel):
    """Folder for organizing entities."""
    id: str
    name: str
    parentId: Optional[str] = None
    created_date: datetime


class Log(BaseModel):
    """Log entry."""
    id: str
    message: str
    level: str  # 'info', 'success', 'error', 'warning'
    entityId: Optional[str] = None
    created_date: datetime
