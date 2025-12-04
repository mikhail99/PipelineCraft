"""SQLAlchemy models for the PipelineCraft database."""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Table, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# Association table for many-to-many relationship between libraries and papers
library_papers = Table(
    "library_papers",
    Base.metadata,
    Column("library_id", String, ForeignKey("libraries.id"), primary_key=True),
    Column("paper_id", String, ForeignKey("papers.id"), primary_key=True),
)


class Paper(Base):
    """A research paper."""
    __tablename__ = "papers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    authors: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Comma-separated
    publish_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    text_markdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    libraries: Mapped[List["Library"]] = relationship(
        secondary=library_papers, back_populates="papers"
    )


class Library(Base):
    """A named collection of papers."""
    __tablename__ = "libraries"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    papers: Mapped[List["Paper"]] = relationship(
        secondary=library_papers, back_populates="libraries"
    )


class Template(Base):
    """A report template entity."""
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Report(Base):
    """A generated report."""
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    template_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("templates.id"), nullable=True)
    library_ids: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Comma-separated
    user_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_markdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending, ok, error
    created_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    template: Mapped[Optional["Template"]] = relationship()
