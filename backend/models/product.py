from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from utils.object_id import PyObjectId

class Feature(BaseModel):
    name: str
    description: str
    benefits: Dict[str, List[str]] = Field(
        default_factory=lambda: {
            "executive": [],
            "technical": [],
            "finance": [],
            "marketing": [],
            "sales": [],
            "operations": []
        }
    )

class ProductBase(BaseModel):
    name: str
    description: str
    features: List[Feature] = []
    documentation_urls: List[str] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[Feature]] = None
    documentation_urls: Optional[List[str]] = None

class ProductInDB(ProductBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    vector_ids: List[str] = []  # IDs of vector embeddings for RAG
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Product(ProductBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        
    @property
    def id_str(self):
        """Return the ID as a string for frontend compatibility"""
        return str(self.id)
