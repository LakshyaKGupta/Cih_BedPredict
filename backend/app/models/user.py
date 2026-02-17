"""
User Model

Database model for user authentication and role-based access control.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    """User roles for access control"""
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    PATIENT = "PATIENT"


class User(Base):
    """
    User model for authentication
    
    Supports two roles:
    - HOSPITAL_ADMIN: Access to hospital management and EHR data
    - PATIENT: Access to public prediction data only
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PATIENT)
    
    # Hospital admins are linked to a specific hospital
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    
    # Relationship to hospital (for admins only) - commented out to fix circular import
    # hospital = relationship("Hospital", back_populates="users")

    def __repr__(self):
        return f"<User {self.email} - {self.role.value}>"
