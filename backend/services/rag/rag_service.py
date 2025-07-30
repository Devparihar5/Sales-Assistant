import os
import tempfile
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_openai import OpenAIEmbeddings
from core.config import settings
from db.mongodb import db
from bson import ObjectId
from pymongo import ReturnDocument
import tiktoken

# Configure OpenAI API
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class RAGService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=self._get_token_length,
        )
    
    def _get_token_length(self, text: str) -> int:
        """Get the number of tokens in a text string."""
        encoding = tiktoken.encoding_for_model("gpt-4o")
        return len(encoding.encode(text))
    
    async def process_document(self, file_path: str, product_id: str, file_type: str) -> List[str]:
        """
        Process a document file, split it into chunks, and store embeddings.
        
        Args:
            file_path: Path to the document file
            product_id: ID of the product this document is associated with
            file_type: Type of file (pdf, docx, txt)
            
        Returns:
            List of IDs for the stored vector embeddings
        """
        # Load the document based on file type
        if file_type == "pdf":
            loader = PyPDFLoader(file_path)
        elif file_type == "docx":
            loader = Docx2txtLoader(file_path)
        elif file_type == "txt":
            loader = TextLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # Load and split the document
        documents = loader.load()
        chunks = self.text_splitter.split_documents(documents)
        
        # Generate embeddings and store in MongoDB
        vector_ids = []
        for i, chunk in enumerate(chunks):
            # Generate embedding
            embedding = await self.embeddings.aembed_query(chunk.page_content)
            
            # Store in MongoDB
            vector_doc = {
                "product_id": ObjectId(product_id),
                "content": chunk.page_content,
                "metadata": chunk.metadata,
                "embedding": embedding,
                "chunk_index": i
            }
            
            result = await db.db["vector_store"].insert_one(vector_doc)
            vector_ids.append(str(result.inserted_id))
            
            # Update product with vector ID
            await db.db["products"].update_one(
                {"_id": ObjectId(product_id)},
                {"$push": {"vector_ids": str(result.inserted_id)}}
            )
        
        return vector_ids
    
    async def search_similar_chunks(
        self, 
        query: str, 
        product_id: str, 
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using vector similarity.
        
        Args:
            query: The search query
            product_id: ID of the product to search within
            top_k: Number of results to return
            
        Returns:
            List of similar chunks with content and metadata
        """
        try:
            # Generate embedding for the query
            query_embedding = await self.embeddings.aembed_query(query)
            
            # Try to use MongoDB's vector search if available
            try:
                # Check if vector search is available
                result = await db.db.command({"listSearchIndexes": "vector_store"})
                has_vector_index = len(result.get("cursor", {}).get("firstBatch", [])) > 0
                
                if has_vector_index:
                    # Use MongoDB vector search
                    pipeline = [
                        {
                            "$search": {
                                "index": "vector_index",
                                "knnBeta": {
                                    "vector": query_embedding,
                                    "path": "embedding",
                                    "k": top_k,
                                    "filter": {
                                        "product_id": ObjectId(product_id)
                                    }
                                }
                            }
                        },
                        {
                            "$project": {
                                "_id": 1,
                                "content": 1,
                                "metadata": 1,
                                "chunk_index": 1,
                                "score": {"$meta": "searchScore"}
                            }
                        }
                    ]
                    
                    cursor = db.db["vector_store"].aggregate(pipeline)
                    results = await cursor.to_list(length=top_k)
                    return results
            except Exception as e:
                print(f"Vector search not available: {e}")
            
            # Fallback to manual similarity search or get product information directly
            try:
                # Get product information directly if vector search is not available
                product = await db.db["products"].find_one({"_id": ObjectId(product_id)})
                if product:
                    # Create a simple context from product information
                    return [{
                        "_id": product["_id"],
                        "content": f"Product: {product['name']}\n\nDescription: {product['description']}\n\n" + 
                                  f"Features: {', '.join([f['name'] for f in product.get('features', [])])}",
                        "metadata": {"source": "product_info"},
                        "chunk_index": 0,
                        "score": 1.0
                    }]
            except Exception as e:
                print(f"Error getting product information: {e}")
            
            # If all else fails, return empty results
            return []
            
        except Exception as e:
            print(f"Error in search_similar_chunks: {e}")
            return []
    
    def _cosine_similarity(self, vec1, vec2):
        """Calculate cosine similarity between two vectors."""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        if magnitude1 * magnitude2 == 0:
            return 0
        return dot_product / (magnitude1 * magnitude2)
    
    async def generate_context_for_message(
        self,
        client_role: str,
        product_id: str,
        message_purpose: str
    ) -> List[Dict[str, Any]]:
        """
        Generate context for a message based on client role and message purpose.
        
        Args:
            client_role: The role category of the client
            product_id: ID of the product
            message_purpose: Purpose of the message (e.g., "introduction", "follow-up")
            
        Returns:
            List of relevant context chunks
        """
        try:
            # Create a query based on client role and message purpose
            query = f"product information for {client_role} role {message_purpose} message"
            
            # Search for similar chunks
            similar_chunks = await self.search_similar_chunks(query, product_id, top_k=3)
            
            # Format the results
            context = []
            for chunk in similar_chunks:
                context.append({
                    "content": chunk["content"],
                    "metadata": chunk.get("metadata", {}),
                    "relevance_score": chunk.get("score", 0)
                })
            
            return context
        except Exception as e:
            print(f"Error generating context: {e}")
            # Return empty context if there's an error
            return []
