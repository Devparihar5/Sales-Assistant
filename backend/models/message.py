from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from utils.object_id import PyObjectId

class MessageBase(BaseModel):
    client_id: PyObjectId
    product_id: PyObjectId
    message_type: str  # "email" or "linkedin"
    tone: str  # "professional", "technical", "formal"
    subject: Optional[str] = None  # For email messages
    content: str
    is_follow_up: bool = False
    previous_message_id: Optional[PyObjectId] = None

class MessageCreate(BaseModel):
    client_id: str
    product_id: str
    message_type: str
    tone: str
    subject: Optional[str] = None
    custom_instructions: Optional[str] = None
    is_follow_up: bool = False
    previous_message_id: Optional[str] = None

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    subject: Optional[str] = None
    client_response: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class MessageInDB(MessageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "draft"  # "draft", "sent", "responded"
    client_response: Optional[Dict[str, Any]] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Message(MessageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: str
    created_at: datetime
    updated_at: datetime
    status: str = "draft"
    client_response: Optional[Dict[str, Any]] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        
    @property
    def id_str(self):
        """Return the ID as a string for frontend compatibility"""
        return str(self.id)
    status: str
    client_response: Optional[Dict[str, Any]] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
