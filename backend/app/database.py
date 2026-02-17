"""
Database Configuration and Session Management

Handles:
- PostgreSQL connection
- SQLAlchemy session lifecycle
- Safe production startup for Railway
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/hospital_db"
)

# Base model
Base = declarative_base()

# Global engine (initialized lazily)
engine = None

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False
)


def init_db():
    """
    Initializes database connection safely.
    Called once on FastAPI startup.
    """
    global engine

    if engine is None:
        engine = create_engine(
            DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            connect_args={
                "connect_timeout": 5,
                "options": "-c statement_timeout=10000"
            }
        )

        SessionLocal.configure(bind=engine)

        # Create tables
        Base.metadata.create_all(bind=engine)
    
    return engine


def get_db():
    """
    Database session dependency for FastAPI routes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
