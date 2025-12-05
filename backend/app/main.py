"""FastAPI main application."""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import init_db, get_db
from .models import (
    Library, Template, Report, Paper,
    Folder as FolderModel, Log as LogModel,
    Branch as BranchModel, EntityVersion as EntityVersionModel
)
from .schemas import (
    LibraryCreate, LibraryResponse, LibrarySummary,
    TemplateCreate, TemplateResponse,
    ReportCreate, ReportResponse,
    PaperCreate, PaperResponse,
    Entity, EntityConfig, EntityData, Folder, Log,
    Branch, EntityVersion
)
from .llm_service import generate_report_content

app = FastAPI(title="PipelineCraft API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# =============================================================================
# Helper functions
# =============================================================================

def generate_id() -> str:
    return str(uuid.uuid4())


def library_to_entity(lib: Library) -> Entity:
    """Convert Library model to Entity schema."""
    papers = [PaperResponse(
        id=p.id,
        title=p.title,
        abstract=p.abstract,
        authors=p.authors,
        publish_date=p.publish_date,
        text_markdown=p.text_markdown,
        created_date=p.created_date
    ) for p in lib.papers]
    
    return Entity(
        id=lib.id,
        name=lib.name,
        type="library",
        status="ok",
        folderId="folder-libraries",
        dependencies=[],
        config=EntityConfig(description=lib.description),
        data=EntityData(papers=papers, paper_count=len(papers)),
        created_date=lib.created_date
    )


def template_to_entity(tmpl: Template) -> Entity:
    """Convert Template model to Entity schema."""
    return Entity(
        id=tmpl.id,
        name=tmpl.name,
        type="template",
        status="ok",
        folderId="folder-templates",
        dependencies=[],
        config=EntityConfig(description=tmpl.description),
        data=EntityData(prompt=tmpl.prompt),
        created_date=tmpl.created_date
    )


def report_to_entity(rpt: Report, db: Session) -> Entity:
    """Convert Report model to Entity schema."""
    library_ids = rpt.library_ids.split(",") if rpt.library_ids else []
    
    # Get library names for display
    library_names = []
    if library_ids:
        libs = db.query(Library).filter(Library.id.in_(library_ids)).all()
        library_names = [l.name for l in libs]
    
    # Get template name
    template_name = None
    if rpt.template:
        template_name = rpt.template.name
    
    # Dependencies: template + libraries
    dependencies = library_ids.copy()
    if rpt.template_id:
        dependencies.append(rpt.template_id)
    
    return Entity(
        id=rpt.id,
        name=rpt.name,
        type="report",
        status=rpt.status,
        folderId="folder-reports",
        dependencies=dependencies,
        config=EntityConfig(description=rpt.user_prompt),
        data=EntityData(
            content_markdown=rpt.content_markdown,
            library_names=library_names,
            template_name=template_name
        ),
        created_date=rpt.created_date
    )


# =============================================================================
# Entities API (for frontend compatibility)
# =============================================================================

@app.get("/api/entities", response_model=List[Entity])
def list_entities(db: Session = Depends(get_db)):
    """List all entities (libraries, templates, reports) for the frontend."""
    entities = []
    
    # Libraries
    libraries = db.query(Library).all()
    entities.extend([library_to_entity(lib) for lib in libraries])
    
    # Templates
    templates = db.query(Template).all()
    entities.extend([template_to_entity(tmpl) for tmpl in templates])
    
    # Reports
    reports = db.query(Report).all()
    entities.extend([report_to_entity(rpt, db) for rpt in reports])
    
    return entities


@app.get("/api/entities/{entity_id}", response_model=Entity)
def get_entity(entity_id: str, db: Session = Depends(get_db)):
    """Get a single entity by ID."""
    # Try library
    lib = db.query(Library).filter(Library.id == entity_id).first()
    if lib:
        return library_to_entity(lib)
    
    # Try template
    tmpl = db.query(Template).filter(Template.id == entity_id).first()
    if tmpl:
        return template_to_entity(tmpl)
    
    # Try report
    rpt = db.query(Report).filter(Report.id == entity_id).first()
    if rpt:
        return report_to_entity(rpt, db)
    
    raise HTTPException(status_code=404, detail="Entity not found")


@app.delete("/api/entities/{entity_id}")
def delete_entity(entity_id: str, db: Session = Depends(get_db)):
    """Delete an entity by ID."""
    # Try library
    lib = db.query(Library).filter(Library.id == entity_id).first()
    if lib:
        db.delete(lib)
        db.commit()
        return {"status": "deleted"}
    
    # Try template
    tmpl = db.query(Template).filter(Template.id == entity_id).first()
    if tmpl:
        db.delete(tmpl)
        db.commit()
        return {"status": "deleted"}
    
    # Try report
    rpt = db.query(Report).filter(Report.id == entity_id).first()
    if rpt:
        db.delete(rpt)
        db.commit()
        return {"status": "deleted"}
    
    raise HTTPException(status_code=404, detail="Entity not found")


# =============================================================================
# Folders API
# =============================================================================

@app.get("/api/folders", response_model=List[Folder])
def list_folders(db: Session = Depends(get_db)):
    """Return the folder structure."""
    folders = db.query(FolderModel).all()
    if not folders:
        # Initialize default folders if none exist
        now = datetime.utcnow()
        defaults = [
            FolderModel(id="folder-libraries", name="Libraries", parentId=None, created_date=now),
            FolderModel(id="folder-templates", name="Templates", parentId=None, created_date=now),
            FolderModel(id="folder-reports", name="Reports", parentId=None, created_date=now),
        ]
        for f in defaults:
            db.add(f)
        db.commit()
        folders = defaults
    return folders


# =============================================================================
# Libraries API
# =============================================================================

@app.post("/api/libraries", response_model=Entity)
def create_library(data: LibraryCreate, db: Session = Depends(get_db)):
    """Create a new library."""
    lib = Library(
        id=generate_id(),
        name=data.name,
        description=data.description,
        created_date=datetime.utcnow()
    )
    db.add(lib)
    db.commit()
    db.refresh(lib)
    return library_to_entity(lib)


@app.get("/api/libraries", response_model=List[LibrarySummary])
def list_libraries(db: Session = Depends(get_db)):
    """List all libraries."""
    libraries = db.query(Library).all()
    return [
        LibrarySummary(
            id=lib.id,
            name=lib.name,
            description=lib.description,
            paper_count=len(lib.papers),
            created_date=lib.created_date
        )
        for lib in libraries
    ]


@app.get("/api/libraries/{library_id}", response_model=LibraryResponse)
def get_library(library_id: str, db: Session = Depends(get_db)):
    """Get a library with its papers."""
    lib = db.query(Library).filter(Library.id == library_id).first()
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")
    
    return LibraryResponse(
        id=lib.id,
        name=lib.name,
        description=lib.description,
        created_date=lib.created_date,
        paper_count=len(lib.papers),
        papers=[PaperResponse(
            id=p.id,
            title=p.title,
            abstract=p.abstract,
            authors=p.authors,
            publish_date=p.publish_date,
            text_markdown=p.text_markdown,
            created_date=p.created_date
        ) for p in lib.papers]
    )


# =============================================================================
# Templates API
# =============================================================================

@app.post("/api/templates", response_model=Entity)
def create_template(data: TemplateCreate, db: Session = Depends(get_db)):
    """Create a new template."""
    tmpl = Template(
        id=generate_id(),
        name=data.name,
        prompt=data.prompt,
        description=data.description,
        created_date=datetime.utcnow()
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return template_to_entity(tmpl)


@app.get("/api/templates", response_model=List[TemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    """List all templates."""
    return db.query(Template).all()


@app.get("/api/templates/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get a template."""
    tmpl = db.query(Template).filter(Template.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tmpl


# =============================================================================
# Reports API
# =============================================================================

@app.post("/api/reports", response_model=Entity)
def create_report(data: ReportCreate, db: Session = Depends(get_db)):
    """Create and generate a new report."""
    # Get template
    template = None
    template_prompt = "Generate a summary report."
    if data.template_id:
        template = db.query(Template).filter(Template.id == data.template_id).first()
        if template:
            template_prompt = template.prompt
    
    # Get papers from selected libraries
    papers = []
    if data.library_ids:
        libraries = db.query(Library).filter(Library.id.in_(data.library_ids)).all()
        for lib in libraries:
            papers.extend(lib.papers)
    
    # Generate report content (mocked)
    content = generate_report_content(papers, template_prompt, data.user_prompt)
    
    # Create report
    rpt = Report(
        id=generate_id(),
        name=data.name,
        template_id=data.template_id,
        library_ids=",".join(data.library_ids) if data.library_ids else None,
        user_prompt=data.user_prompt,
        content_markdown=content,
        status="ok",
        created_date=datetime.utcnow()
    )
    db.add(rpt)
    db.commit()
    db.refresh(rpt)
    
    return report_to_entity(rpt, db)


@app.get("/api/reports", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    """List all reports."""
    reports = db.query(Report).all()
    return [
        ReportResponse(
            id=r.id,
            name=r.name,
            template_id=r.template_id,
            library_ids=r.library_ids.split(",") if r.library_ids else [],
            user_prompt=r.user_prompt,
            content_markdown=r.content_markdown,
            status=r.status,
            created_date=r.created_date
        )
        for r in reports
    ]


@app.get("/api/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Get a report."""
    rpt = db.query(Report).filter(Report.id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return ReportResponse(
        id=rpt.id,
        name=rpt.name,
        template_id=rpt.template_id,
        library_ids=rpt.library_ids.split(",") if rpt.library_ids else [],
        user_prompt=rpt.user_prompt,
        content_markdown=rpt.content_markdown,
        status=rpt.status,
        created_date=rpt.created_date
    )


# =============================================================================
# Papers API (for external tool to add papers)
# =============================================================================

@app.post("/api/papers", response_model=PaperResponse)
def create_paper(data: PaperCreate, db: Session = Depends(get_db)):
    """Create a new paper."""
    paper = Paper(
        id=data.id or generate_id(),
        title=data.title,
        abstract=data.abstract,
        authors=data.authors,
        publish_date=data.publish_date,
        text_markdown=data.text_markdown,
        created_date=datetime.utcnow()
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


@app.get("/api/papers", response_model=List[PaperResponse])
def list_papers(db: Session = Depends(get_db)):
    """List all papers."""
    return db.query(Paper).all()


@app.post("/api/libraries/{library_id}/papers/{paper_id}")
def add_paper_to_library(library_id: str, paper_id: str, db: Session = Depends(get_db)):
    """Add a paper to a library."""
    lib = db.query(Library).filter(Library.id == library_id).first()
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")
    
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    if paper not in lib.papers:
        lib.papers.append(paper)
        db.commit()
    
    return {"status": "added"}


@app.delete("/api/libraries/{library_id}/papers/{paper_id}")
def remove_paper_from_library(library_id: str, paper_id: str, db: Session = Depends(get_db)):
    """Remove a paper from a library."""
    lib = db.query(Library).filter(Library.id == library_id).first()
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")
    
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    if paper in lib.papers:
        lib.papers.remove(paper)
        db.commit()
    
    return {"status": "removed"}


# =============================================================================
# Logs API
# =============================================================================

@app.get("/api/logs", response_model=List[Log])
def list_logs(limit: int = 50, db: Session = Depends(get_db)):
    """List recent logs."""
    return db.query(LogModel).order_by(LogModel.created_date.desc()).limit(limit).all()


@app.post("/api/logs", response_model=Log)
def create_log(message: str, level: str = "info", entity_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Create a log entry."""
    log = LogModel(
        id=generate_id(),
        message=message,
        level=level,
        entityId=entity_id,
        created_date=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# =============================================================================
# Version Control API
# =============================================================================

@app.get("/api/branches", response_model=List[Branch])
def list_branches(db: Session = Depends(get_db)):
    return db.query(BranchModel).all()


@app.get("/api/entity-versions", response_model=List[EntityVersion])
def list_entity_versions(entity_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(EntityVersionModel)
    if entity_id:
        query = query.filter(EntityVersionModel.entityId == entity_id)
    return query.all()
