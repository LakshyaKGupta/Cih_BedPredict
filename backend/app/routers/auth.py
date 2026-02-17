"""
Authentication Router

Handles user registration and login.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **PATIENT**: No hospital_id required
    - **HOSPITAL_ADMIN**: Must provide valid hospital_id
    
    Returns JWT token on successful registration.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate hospital admin requirements
    if user_data.role == UserRole.HOSPITAL_ADMIN:
        if not user_data.hospital_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hospital admins must be linked to a hospital"
            )
        
        # Verify hospital exists
        from app.models.hospital import Hospital
        hospital = db.query(Hospital).filter(Hospital.id == user_data.hospital_id).first()
        if not hospital:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hospital with ID {user_data.hospital_id} not found"
            )
    
    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        hospital_id=user_data.hospital_id if user_data.role == UserRole.HOSPITAL_ADMIN else None
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value,
        "hospital_id": new_user.hospital_id
    })
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        name=new_user.name,
        hospital_id=new_user.hospital_id
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token
    
    Validates email and password, then returns token with user role.
    """
    try:
        # Find user
        user = db.query(User).filter(User.email == credentials.email).first()
        
        if not user:
            print(f"User not found: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        print(f"User found: {user.email}, role: {user.role}")
        
        # Verify password
        from app.services.auth_service import verify_password
        if not verify_password(credentials.password, user.hashed_password):
            print("Password verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        print("Password verification successful")
        
        # Create access token
        access_token = create_access_token(data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value,
            "hospital_id": user.hospital_id
        })
        
        print("Token created successfully")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=user.role,
            user_id=user.id,
            name=user.name,
            hospital_id=user.hospital_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    
    Requires valid JWT token.
    """
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        hospital_id=current_user.hospital_id
    )
