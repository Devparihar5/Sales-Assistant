"""
Utility functions for handling API responses
"""
from typing import Dict, Any, List

def prepare_mongo_document_for_response(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepares a MongoDB document for API response by:
    1. Converting ObjectId fields to strings
    2. Ensuring both _id and id fields are available
    
    Args:
        doc: MongoDB document dictionary
        
    Returns:
        Modified document ready for API response
    """
    # Make a copy to avoid modifying the original
    result = doc.copy()
    
    # Ensure _id is converted to string and also available as id
    if "_id" in result:
        result["id"] = str(result["_id"])
    
    return result

def prepare_mongo_documents_for_response(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Prepares a list of MongoDB documents for API response
    
    Args:
        docs: List of MongoDB document dictionaries
        
    Returns:
        List of modified documents ready for API response
    """
    return [prepare_mongo_document_for_response(doc) for doc in docs]
