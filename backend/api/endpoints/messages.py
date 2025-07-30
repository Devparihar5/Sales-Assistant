from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from bson import ObjectId
import bson
from datetime import datetime
from db.mongodb import db
from models.message import Message, MessageCreate, MessageUpdate, MessageInDB
from models.user import User
from models.client import Client
from models.product import Product
from services.auth.auth_service import get_current_active_user
from services.openai.openai_service import OpenAIService
from services.rag.rag_service import RAGService

router = APIRouter()
openai_service = OpenAIService()
rag_service = RAGService()

@router.post("/generate", response_model=Message)
async def generate_message(
    message_create: MessageCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a new message for a client.
    """
    try:
        # Get client and product information
        try:
            client = await db.db["clients"].find_one({"_id": ObjectId(message_create.client_id)})
        except bson.errors.InvalidId:
            # If the client_id is not a valid ObjectId, try to find by name or other fields
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid client ID format: '{message_create.client_id}'. Please provide a valid MongoDB ObjectID."
            )
            
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found",
            )
        
        try:
            product = await db.db["products"].find_one({"_id": ObjectId(message_create.product_id)})
        except bson.errors.InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid product ID format: '{message_create.product_id}'. Please provide a valid MongoDB ObjectID."
            )
            
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        
        # Convert to Pydantic models
        # Convert ObjectId to string for created_by field
        client_copy = dict(client)
        client_copy["created_by"] = str(client_copy["created_by"])
        client_model = Client(**client_copy)
        
        product_copy = dict(product)
        product_copy["created_by"] = str(product_copy["created_by"])
        product_model = Product(**product_copy)
        
        # Get previous message if this is a follow-up
        previous_message = None
        client_response = None
        if message_create.is_follow_up and message_create.previous_message_id:
            try:
                prev_msg = await db.db["messages"].find_one({"_id": ObjectId(message_create.previous_message_id)})
                if prev_msg:
                    previous_message = {
                        "subject": prev_msg.get("subject"),
                        "content": prev_msg.get("content")
                    }
                    client_response = prev_msg.get("client_response")
            except Exception as e:
                # Log the error but continue without previous message
                print(f"Error fetching previous message: {str(e)}")
        
        # Get context from RAG service
        try:
            message_purpose = "follow-up" if message_create.is_follow_up else "introduction"
            context = await rag_service.generate_context_for_message(
                client_model.role_category,
                message_create.product_id,
                message_purpose
            )
        except Exception as e:
            print(f"Error getting context from RAG service: {e}")
            # Provide empty context if RAG fails
            context = []
        
        # Generate message with OpenAI service
        generated_message = await openai_service.generate_message(
            client=client_model,
            product=product_model,
            message_type=message_create.message_type,
            tone=message_create.tone,
            context=context,
            custom_instructions=message_create.custom_instructions,
            is_follow_up=message_create.is_follow_up,
            previous_message=previous_message,
            client_response=client_response
        )
        
        # Create message object
        message_in_db = MessageInDB(
            client_id=ObjectId(message_create.client_id),
            product_id=ObjectId(message_create.product_id),
            message_type=message_create.message_type,
            tone=message_create.tone,
            subject=generated_message.get("subject"),
            content=generated_message.get("content"),
            is_follow_up=message_create.is_follow_up,
            previous_message_id=ObjectId(message_create.previous_message_id) if message_create.previous_message_id else None,
            created_by=ObjectId(str(current_user.id))
        )
        
        # Insert into database
        result = await db.db["messages"].insert_one(message_in_db.dict(by_alias=True))
        
        # Get the created message
        created_message = await db.db["messages"].find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string
        created_message["created_by"] = str(created_message["created_by"])
        created_message["client_id"] = str(created_message["client_id"])
        created_message["product_id"] = str(created_message["product_id"])
        if created_message.get("previous_message_id"):
            created_message["previous_message_id"] = str(created_message["previous_message_id"])
        
        # Ensure both _id and id are available for frontend
        created_message["id"] = str(created_message["_id"])
        
        return created_message
    except bson.errors.InvalidId as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ID format: {str(e)}. Please make sure you're passing valid MongoDB ObjectIDs."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating message: {str(e)}"
        )

@router.get("/", response_model=List[Message])
async def read_messages(
    client_id: Optional[str] = None,
    product_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve messages with optional filtering.
    """
    # Build query
    query = {}
    if client_id:
        try:
            query["client_id"] = ObjectId(client_id)
        except bson.errors.InvalidId:
            # If client_id is not a valid ObjectId, it might be a name or other identifier
            # In this case, we'll need to look up the client by name first
            client = await db.db["clients"].find_one({"name": client_id})
            if client:
                query["client_id"] = client["_id"]
            else:
                # If we can't find a client with that name, return an empty list
                # rather than raising an error
                return []
                
    if product_id:
        try:
            query["product_id"] = ObjectId(product_id)
        except bson.errors.InvalidId:
            # Similar approach for product_id
            product = await db.db["products"].find_one({"name": product_id})
            if product:
                query["product_id"] = product["_id"]
            else:
                return []
    
    # If not admin, only show messages created by the current user
    if current_user.role != "admin":
        query["created_by"] = ObjectId(str(current_user.id))
    
    messages = await db.db["messages"].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Convert ObjectId to string
    for message in messages:
        message["created_by"] = str(message["created_by"])
        message["client_id"] = str(message["client_id"])
        message["product_id"] = str(message["product_id"])
        if message.get("previous_message_id"):
            message["previous_message_id"] = str(message["previous_message_id"])
        # Ensure both _id and id are available for frontend
        message["id"] = str(message["_id"])
    
    return messages

@router.get("/{message_id}", response_model=Message)
async def read_message(
    message_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific message by id.
    """
    # Handle special route parameters
    if message_id == "new" or message_id == "generate":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
        
    try:
        # Build query based on user role
        query = {"_id": ObjectId(message_id)}
        if current_user.role != "admin":
            query["created_by"] = ObjectId(str(current_user.id))
        
        message = await db.db["messages"].find_one(query)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )
        
        # Convert ObjectId to string
        message["created_by"] = str(message["created_by"])
        message["client_id"] = str(message["client_id"])
        message["product_id"] = str(message["product_id"])
        if message.get("previous_message_id"):
            message["previous_message_id"] = str(message["previous_message_id"])
        
        # Ensure both _id and id are available for frontend
        message["id"] = str(message["_id"])
        
        # Also add client and product IDs in both formats for frontend
        try:
            # Get client and product details to ensure they exist
            client = await db.db["clients"].find_one({"_id": ObjectId(message["client_id"])})
            if client:
                message["client"] = {
                    "_id": str(client["_id"]),
                    "id": str(client["_id"]),
                    "name": client.get("name", "Unknown Client")
                }
                
            product = await db.db["products"].find_one({"_id": ObjectId(message["product_id"])})
            if product:
                message["product"] = {
                    "_id": str(product["_id"]),
                    "id": str(product["_id"]),
                    "name": product.get("name", "Unknown Product")
                }
        except Exception as e:
            print(f"Error fetching client/product details: {str(e)}")
        
        return message
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid message ID format: {str(e)}",
        )

@router.put("/{message_id}", response_model=Message)
async def update_message(
    message_id: str,
    message_update: MessageUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a message.
    """
    # Handle special route parameters
    if message_id == "new" or message_id == "generate":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
        
    try:
        # Build query based on user role
        query = {"_id": ObjectId(message_id)}
        if current_user.role != "admin":
            query["created_by"] = ObjectId(str(current_user.id))
        
        # Check if message exists
        message = await db.db["messages"].find_one(query)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or you don't have permission to update it",
            )
        
        # Prepare update data
        update_data = message_update.dict(exclude_unset=True)
        
        # Update message
        updated_message = await db.db["messages"].find_one_and_update(
            {"_id": ObjectId(message_id)},
            {"$set": update_data},
            return_document=True
        )
        
        # Convert ObjectId to string
        updated_message["created_by"] = str(updated_message["created_by"])
        updated_message["client_id"] = str(updated_message["client_id"])
        updated_message["product_id"] = str(updated_message["product_id"])
        if updated_message.get("previous_message_id"):
            updated_message["previous_message_id"] = str(updated_message["previous_message_id"])
        
        return updated_message
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid message ID format: {str(e)}",
        )

@router.post("/{message_id}/record-response", response_model=Message)
async def record_client_response(
    message_id: str,
    response_content: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user)
):
    """
    Record a client's response to a message and analyze it.
    """
    # Handle special route parameters
    if message_id == "new" or message_id == "generate":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
        
    try:
        # Build query based on user role
        query = {"_id": ObjectId(message_id)}
        if current_user.role != "admin":
            query["created_by"] = ObjectId(str(current_user.id))
        
        # Check if message exists
        message = await db.db["messages"].find_one(query)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or you don't have permission to update it",
            )
        
        # Get client and product information
        client = await db.db["clients"].find_one({"_id": message["client_id"]})
        product = await db.db["products"].find_one({"_id": message["product_id"]})
        
        # Convert to Pydantic models
        # Convert ObjectId to string for created_by field
        client_copy = dict(client)
        client_copy["created_by"] = str(client_copy["created_by"])
        client_model = Client(**client_copy)
        
        product_copy = dict(product)
        product_copy["created_by"] = str(product_copy["created_by"])
        product_model = Product(**product_copy)
        
        # Analyze response with OpenAI service
        analysis = await openai_service.analyze_client_response(
            client_response=response_content,
            client=client_model,
            product=product_model,
            original_message={
                "subject": message.get("subject"),
                "content": message.get("content")
            }
        )
        
        # Update message with client response and analysis
        client_response_data = {
            "content": response_content,
            "timestamp": str(datetime.utcnow()),
            "analysis": analysis
        }
        
        updated_message = await db.db["messages"].find_one_and_update(
            {"_id": ObjectId(message_id)},
            {
                "$set": {
                    "client_response": client_response_data,
                    "status": "responded"
                }
            },
            return_document=True
        )
        
        # Convert ObjectId to string
        updated_message["created_by"] = str(updated_message["created_by"])
        updated_message["client_id"] = str(updated_message["client_id"])
        updated_message["product_id"] = str(updated_message["product_id"])
        if updated_message.get("previous_message_id"):
            updated_message["previous_message_id"] = str(updated_message["previous_message_id"])
        
        return updated_message
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid message ID format or processing error: {str(e)}",
        )
