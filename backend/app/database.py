"""
Database Configuration and Session Management

This module handles:
- PostgreSQL connection using SQLAlchemy
- Database session management
- Base model for all ORM models
- Environment-based configuration for deployment flexibility
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL from environment variable with fallback to local PostgreSQL
# Format: postgresql://username:password@host:port/database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/hospital_db"
)

# Create SQLAlchemy engine
# echo=True will log all SQL statements (disable in production)
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for debugging SQL queries
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=5,  # Connection pool size (reduced for faster startup)
    max_overflow=10,  # Max connections beyond pool_size
    connect_args={
        "connect_timeout": 5,  # 5 second timeout
        "options": "-c statement_timeout=10000"  # 10 second query timeout
    }
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()

# Dependency to get database session
def get_db():
    """
    Database session dependency for FastAPI routes.
    Ensures proper session lifecycle management:
    - Creates a new session per request
    - Automatically closes session after request
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
