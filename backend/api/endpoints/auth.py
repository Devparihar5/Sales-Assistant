from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.config import settings
from db.mongodb import db
from models.user import User, UserCreate, UserInDB
from services.auth.auth_service import authenticate_user, get_current_active_user
from utils.security import create_access_token, get_password_hash

router = APIRouter()

@router.post("/token", response_model=dict)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=User)
async def register_user(user_create: UserCreate):
    """
    Register a new user.
    """
    # Check if user already exists
    existing_user = await db.db["users"].find_one({"email": str(user_create.email)})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_create.password)
    user_in_db = UserInDB(
        **user_create.dict(exclude={"password"}),
        hashed_password=hashed_password,
    )
    
    # Insert into database
    result = await db.db["users"].insert_one(user_in_db.dict(by_alias=True))
    
    # Get the created user
    created_user = await db.db["users"].find_one({"_id": result.inserted_id})
    
    return User(**created_user)

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user.
    """
    return current_user
