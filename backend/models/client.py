from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, HttpUrl
from datetime import datetime
from bson import ObjectId
from utils.object_id import PyObjectId

class ClientBase(BaseModel):
    name: str
    email: EmailStr
    company: str
    position: str
    role_category: str  # "executive", "technical", "finance", "marketing", "sales", "operations"
    phone: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    position: Optional[str] = None
    role_category: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    notes: Optional[str] = None
    
    def dict(self, *args, **kwargs):
        """Override dict method to convert HttpUrl to string"""
        d = super().dict(*args, **kwargs)
        if d.get('linkedin_url') is not None:
            d['linkedin_url'] = str(d['linkedin_url'])
        return d

class ClientInDB(ClientBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    communication_history: List[Dict[str, Any]] = []
    
    def dict(self, *args, **kwargs):
        """Override dict method to convert HttpUrl to string"""
        d = super().dict(*args, **kwargs)
        if d.get('linkedin_url') is not None:
            d['linkedin_url'] = str(d['linkedin_url'])
        return d
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Client(ClientBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
