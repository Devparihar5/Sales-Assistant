from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from bson import ObjectId
import os
import tempfile
import shutil
from db.mongodb import db
from models.product import Product, ProductCreate, ProductUpdate, ProductInDB
from models.user import User
from services.auth.auth_service import get_current_active_user
from services.rag.rag_service import RAGService

router = APIRouter()
rag_service = RAGService()

@router.post("/", response_model=Product)
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new product.
    """
    # Create product object
    product_in_db = ProductInDB(
        **product.dict(),
        created_by=ObjectId(str(current_user.id))
    )
    
    # Insert into database
    result = await db.db["products"].insert_one(product_in_db.dict(by_alias=True))
    
    # Get the created product
    created_product = await db.db["products"].find_one({"_id": result.inserted_id})
    
    # Convert ObjectId to string for created_by field
    created_product["created_by"] = str(created_product["created_by"])
    
    # Ensure both _id and id are available for frontend
    created_product["id"] = str(created_product["_id"])
    
    return created_product

@router.get("/", response_model=List[Product])
async def read_products(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve products.
    """
    products = await db.db["products"].find().skip(skip).limit(limit).to_list(limit)
    
    # Convert ObjectId to string for created_by field
    for product in products:
        product["created_by"] = str(product["created_by"])
        # Ensure both _id and id are available for frontend
        product["id"] = str(product["_id"])
    
    return products

@router.get("/{product_id}", response_model=Product)
async def read_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific product by id.
    """
    # Handle special route parameters
    if product_id == "new":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
        
    try:
        product = await db.db["products"].find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        
        # Convert ObjectId to string for created_by field
        product["created_by"] = str(product["created_by"])
        
        # Ensure both _id and id are available for frontend
        product["id"] = str(product["_id"])
        
        return product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid product ID format: {str(e)}",
        )

@router.put("/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a product.
    """
    # Handle special route parameters
    if product_id == "new":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
        
    try:
        # Check if product exists
        product = await db.db["products"].find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        
        # Prepare update data
        update_data = product_update.dict(exclude_unset=True)
        
        # Update product
        updated_product = await db.db["products"].find_one_and_update(
            {"_id": ObjectId(product_id)},
            {"$set": update_data},
            return_document=True
        )
        
        # Convert ObjectId to string for created_by field
        updated_product["created_by"] = str(updated_product["created_by"])
        
        # Ensure both _id and id are available for frontend
        updated_product["id"] = str(updated_product["_id"])
        
        return updated_product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid product ID format: {str(e)}",
        )

@router.delete("/{product_id}", response_model=Product)
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a product.
    """
    # Handle special route parameters
    if product_id == "new":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
        
    try:
        # Delete product
        deleted_product = await db.db["products"].find_one_and_delete({"_id": ObjectId(product_id)})
        if not deleted_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        
        # Delete associated vector embeddings
        await db.db["vector_store"].delete_many({"product_id": ObjectId(product_id)})
        
        # Convert ObjectId to string for created_by field
        deleted_product["created_by"] = str(deleted_product["created_by"])
        
        # Ensure both _id and id are available for frontend
        deleted_product["id"] = str(deleted_product["_id"])
        
        return deleted_product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid product ID format: {str(e)}",
        )

@router.post("/{product_id}/upload-document", response_model=dict)
async def upload_document(
    product_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a document for a product and process it for RAG.
    """
    # Handle special route parameters
    if product_id == "new":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
        
    try:
        # Check if product exists
        product = await db.db["products"].find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        
        # Determine file type
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension == ".pdf":
            file_type = "pdf"
        elif file_extension == ".docx":
            file_type = "docx"
        elif file_extension == ".txt":
            file_type = "txt"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file type. Only PDF, DOCX, and TXT are supported.",
            )
        
        # Save file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        
        try:
            # Process document with RAG service
            vector_ids = await rag_service.process_document(temp_file_path, product_id, file_type)
            
            # Update product with document URL
            document_url = f"/documents/{product_id}/{file.filename}"
            await db.db["products"].update_one(
                {"_id": ObjectId(product_id)},
                {"$push": {"documentation_urls": document_url}}
            )
            
            return {
                "message": "Document processed successfully",
                "document_url": document_url,
                "vector_count": len(vector_ids)
            }
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid product ID format or processing error: {str(e)}",
        )
