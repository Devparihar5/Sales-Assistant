from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from db.mongodb import db
from models.client import Client, ClientCreate, ClientUpdate, ClientInDB
from models.user import User
from services.auth.auth_service import get_current_active_user

router = APIRouter()

@router.post("/", response_model=Client)
async def create_client(
    client: ClientCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new client.
    """
    # Create client object
    client_in_db = ClientInDB(
        **client.dict(),
        created_by=ObjectId(str(current_user.id))
    )
    
    # Insert into database
    result = await db.db["clients"].insert_one(client_in_db.dict(by_alias=True))
    
    # Get the created client
    created_client = await db.db["clients"].find_one({"_id": result.inserted_id})
    
    # Convert ObjectId to string for created_by field
    created_client["created_by"] = str(created_client["created_by"])
    
    # Ensure both _id and id are available for frontend
    created_client["id"] = str(created_client["_id"])
    
    return created_client

@router.get("/", response_model=List[Client])
async def read_clients(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve clients.
    """
    # If admin, get all clients, otherwise only get clients created by the current user
    if current_user.role == "admin":
        clients = await db.db["clients"].find().skip(skip).limit(limit).to_list(limit)
    else:
        clients = await db.db["clients"].find(
            {"created_by": ObjectId(str(current_user.id))}
        ).skip(skip).limit(limit).to_list(limit)
    
    # Convert ObjectId to string for created_by field
    for client in clients:
        client["created_by"] = str(client["created_by"])
        # Ensure both _id and id are available for frontend
        client["id"] = str(client["_id"])
    
    return clients

@router.get("/{client_id}", response_model=Client)
async def read_client(
    client_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific client by id.
    """
    # Handle special route parameters
    if client_id == "new":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
        
    try:
        # Build query based on user role
        query = {"_id": ObjectId(client_id)}
        if current_user.role != "admin":
            query["created_by"] = ObjectId(str(current_user.id))
        
        client = await db.db["clients"].find_one(query)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found",
            )
        
        # Convert ObjectId to string for created_by field
        client["created_by"] = str(client["created_by"])
        
        # Ensure both _id and id are available for frontend
        client["id"] = str(client["_id"])
        
        return client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid client ID format: {str(e)}",
        )

@router.put("/{client_id}", response_model=Client)
async def update_client(
    client_id: str,
    client_update: ClientUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a client.
    """
    # Handle special route parameters
    if client_id == "new":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
        
    try:
        # Build query based on user role
        query = {"_id": ObjectId(client_id)}
        if current_user.role != "admin":
            query["created_by"] = ObjectId(str(current_user.id))
        
        # Check if client exists
        client = await db.db["clients"].find_one(query)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found or you don't have permission to update it",
            )
        
        # Prepare update data
        update_data = client_update.dict(exclude_unset=True)
        
        # Convert HttpUrl to string if present
        if 'linkedin_url' in update_data and update_data['linkedin_url'] is not None:
            update_data['linkedin_url'] = str(update_data['linkedin_url'])
        
        # Update client
        updated_client = await db.db["clients"].find_one_and_update(
            {"_id": ObjectId(client_id)},
            {"$set": update_data},
            return_document=True
        )
        
        # Convert ObjectId to string for created_by field
        updated_client["created_by"] = str(updated_client["created_by"])
        
        # Ensure both _id and id are available for frontend
        updated_client["id"] = str(updated_client["_id"])
        
        return updated_client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid client ID format: {str(e)}",
        )

@router.delete("/{client_id}", response_model=Client)
async def delete_client(
    client_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a client.
    """
    # Handle special route parameters
    if client_id == "new":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
        
    try:
        # Build query based on user role
        query = {"_id": ObjectId(client_id)}
        if current_user.role != "admin":
            query["created_by"] = ObjectId(str(current_user.id))
        
        # Delete client
        deleted_client = await db.db["clients"].find_one_and_delete(query)
        if not deleted_client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found or you don't have permission to delete it",
            )
        
        # Convert ObjectId to string for created_by field
        deleted_client["created_by"] = str(deleted_client["created_by"])
        
        # Ensure both _id and id are available for frontend
        deleted_client["id"] = str(deleted_client["_id"])
        
        return deleted_client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid client ID format: {str(e)}",
        )
