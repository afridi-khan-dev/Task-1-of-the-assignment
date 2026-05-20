from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.api import auth, hcps, interactions, dashboard

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app_main")

# Auto-create SQLite database tables on startup for instant zero-configuration local runs
try:
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error creating database schemas: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI-First CRM HCP Module backend API suite supporting LangGraph, Groq, and custom pharma CRM tools.",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local running/development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dual Route Binding ---
# 1. Mount API version 1 prefix routes
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(hcps.router, prefix=settings.API_V1_STR)
app.include_router(interactions.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

# 2. Mount Root Level copies to match prompt's exact endpoint specs directly
app.include_router(auth.router)
app.include_router(hcps.router)
app.include_router(interactions.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_v1_docs": "/docs",
        "auth_scaffold": "JWT standard active"
    }
