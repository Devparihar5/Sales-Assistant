from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from db.mongodb import db
from models.user import User, UserUpdate, UserInDB
from services.auth.auth_service import get_current_admin_user, get_current_active_user
from utils.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_admin_user)
):
    """
    Retrieve users. Admin only.
    """
    users = await db.db["users"].find().skip(skip).limit(limit).to_list(limit)
    return users

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str, 
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific user by id.
    """
    # Handle special route parameters
    if user_id == "new" or user_id == "edit":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    try:
        # Only admins can view other users
        if str(current_user.id) != user_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        
        user = await db.db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user ID format: {str(e)}",
        )

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a user.
    """
    # Handle special route parameters
    if user_id == "new" or user_id == "edit":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    try:
        # Only admins can update other users
        if str(current_user.id) != user_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        
        # Get current user data
        user = await db.db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Prepare update data
        update_data = user_update.dict(exclude_unset=True)
        
        # Hash password if it's being updated
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        # Only admins can change roles
        if "role" in update_data and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to change role",
            )
        
        # Update user
        updated_user = await db.db["users"].find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user ID format: {str(e)}",
        )

@router.delete("/{user_id}", response_model=User)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a user. Admin only.
    """
    # Handle special route parameters
    if user_id == "new" or user_id == "edit":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    try:
        # Prevent deleting yourself
        if str(current_user.id) == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own user account",
            )
        
        # Delete user
        deleted_user = await db.db["users"].find_one_and_delete({"_id": ObjectId(user_id)})
        if not deleted_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        return deleted_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user ID format: {str(e)}",
        )
