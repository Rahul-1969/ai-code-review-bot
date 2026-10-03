"""
auth_routes.py
--------------
FastAPI router for user authentication and registration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.auth_handler import create_access_token
from auth.security import hash_password, verify_password
from database.database import get_db
from models.user_model import User
from schemas.user_schema import TokenResponse, UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    summary="Register a new user",
    status_code=status.HTTP_201_CREATED,
    response_description="Confirmation of successful registration.",
)
def register_user(
    request: UserRegister,
    db: Session = Depends(get_db)
) -> dict:
    """Register a new user in the system.

    Validates that the email and username are not already in use,
    hashes the provided password, and creates a new User record.

    Args:
        request: The user registration details.
        db:      Injected database session.

    Returns:
        A success message dictionary.

    Raises:
        HTTPException: If the email or username is already registered.
    """
    # Check if the email already exists
    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )

    # Check if the username already exists
    existing_username = db.query(User).filter(User.username == request.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken."
        )

    # Hash the password and create the user
    hashed_pwd = hash_password(request.password)

    new_user = User(
        username=request.username,
        email=request.email,
        hashed_password=hashed_pwd
    )

    db.add(new_user)
    db.commit()

    return {"message": "User registered successfully."}


@router.post(
    "/login",
    summary="Authenticate a user",
    response_model=TokenResponse,
    response_description="JWT Access Token for the user.",
)
def login_user(
    request: UserLogin,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """Authenticate a user and return a JWT access token.

    Args:
        request: The user login credentials.
        db:      Injected database session.

    Returns:
        A dictionary containing the access token and token type.

    Raises:
        HTTPException: If authentication fails (invalid email or password).
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()

    # If user doesn't exist or password doesn't match
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate the access token payload
    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )
