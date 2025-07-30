from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from bson import ObjectId
from utils.object_id import PyObjectId

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "sales"  # "admin" or "sales"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    
    def dict(self, *args, **kwargs):
        """Override dict method to convert EmailStr to string"""
        d = super().dict(*args, **kwargs)
        if d.get('email') is not None:
            d['email'] = str(d['email'])
        return d

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def dict(self, *args, **kwargs):
        """Override dict method to convert EmailStr to string"""
        d = super().dict(*args, **kwargs)
        if d.get('email') is not None:
            d['email'] = str(d['email'])
        return d

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
