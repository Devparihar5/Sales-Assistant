import openai
from openai import AsyncOpenAI
from typing import Dict, List, Any, Optional
from core.config import settings
from models.client import Client
from models.product import Product
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure OpenAI API
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class OpenAIService:
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_message(
        self,
        client: Client,
        product: Product,
        message_type: str,
        tone: str,
        context: Optional[List[Dict[str, Any]]] = None,
        custom_instructions: Optional[str] = None,
        is_follow_up: bool = False,
        previous_message: Optional[Dict[str, Any]] = None,
        client_response: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        """
        Generate a personalized message for a client based on their role and product information.
        
        Args:
            client: Client information
            product: Product information
            message_type: "email" or "linkedin"
            tone: "professional", "technical", or "formal"
            context: Additional context from RAG
            custom_instructions: Any custom instructions for the message
            is_follow_up: Whether this is a follow-up message
            previous_message: Previous message content if this is a follow-up
            client_response: Client's response to previous message if available
            
        Returns:
            Dict containing generated message with subject (for email) and content
        """
        try:
            # Build the system prompt based on client role and message requirements
            system_prompt = self._build_system_prompt(
                client.role_category, message_type, tone, is_follow_up
            )
            
            # Build the user prompt with product and client information
            user_prompt = self._build_user_prompt(
                client, 
                product, 
                message_type, 
                context, 
                custom_instructions,
                is_follow_up,
                previous_message,
                client_response
            )
            
            # Call OpenAI API using the new client
            response = await AsyncOpenAI(api_key=settings.OPENAI_API_KEY).chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1500,
            )
            
            # Parse the response
            message_content = response.choices[0].message.content
            
            # For email messages, extract subject and content
            if message_type == "email":
                # Simple parsing - assuming format "Subject: <subject>\n\n<content>"
                parts = message_content.split("\n\n", 1)
                if len(parts) > 1 and parts[0].startswith("Subject:"):
                    subject = parts[0].replace("Subject:", "").strip()
                    content = parts[1]
                    return {"subject": subject, "content": content}
            
            # For LinkedIn or if parsing fails, return the full content
            return {"content": message_content, "subject": None if message_type == "linkedin" else ""}
        except Exception as e:
            print(f"Error generating message: {str(e)}")
            # Return a simple message if OpenAI API fails
            if message_type == "email":
                return {
                    "subject": "Introduction to our product",
                    "content": f"Dear {client.name},\n\nI wanted to introduce you to {product.name}, which I believe could benefit your work at {client.company}.\n\nPlease let me know if you'd like to discuss this further.\n\nBest regards,\nSales Team"
                }
            else:
                return {
                    "content": f"Hi {client.name}, I wanted to introduce you to {product.name}, which I believe could benefit your work at {client.company}. Would you be interested in learning more?",
                    "subject": None
                }
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def analyze_client_response(
        self,
        client_response: str,
        client: Client,
        product: Product,
        original_message: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze a client's response to a message.
        
        Args:
            client_response: The client's response text
            client: Client information
            product: Product information
            original_message: The original message sent to the client
            
        Returns:
            Dict containing analysis of the response
        """
        try:
            system_prompt = """
            You are an expert sales assistant analyzing a client's response to a sales message.
            Provide a detailed analysis of the client's response, including:
            1. Sentiment (positive, neutral, negative)
            2. Key questions or concerns raised
            3. Level of interest in the product
            4. Suggested next steps
            Format your response as JSON with the following keys: sentiment, questions, interest_level, next_steps
            """
            
            user_prompt = f"""
            Original message sent to client:
            {original_message.get('subject', '')}
            {original_message.get('content', '')}
            
            Client information:
            Name: {client.name}
            Position: {client.position}
            Company: {client.company}
            Role category: {client.role_category}
            
            Product information:
            Name: {product.name}
            Description: {product.description}
            
            Client's response:
            {client_response}
            
            Please analyze this response.
            """
            
            response = await AsyncOpenAI(api_key=settings.OPENAI_API_KEY).chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            # Parse the JSON response
            analysis = response.choices[0].message.content
            return analysis
        except Exception as e:
            print(f"Error analyzing client response: {str(e)}")
            # Return a simple analysis if OpenAI API fails
            return {
                "sentiment": "neutral",
                "questions": [],
                "interest_level": "moderate",
                "next_steps": "Follow up with more information"
            }
    
    def _build_system_prompt(
        self, 
        role_category: str, 
        message_type: str, 
        tone: str,
        is_follow_up: bool
    ) -> str:
        """Build the system prompt based on client role and message requirements."""
        base_prompt = f"""
        You are an expert sales assistant specializing in creating highly personalized {message_type} messages for potential clients.
        """
        
        # Add role-specific instructions
        role_instructions = {
            "executive": "Focus on strategic value, ROI, and high-level business impact. Executives care about bottom-line results and competitive advantage.",
            "technical": "Focus on technical specifications, integration details, and technical capabilities. Technical roles care about implementation details and compatibility.",
            "finance": "Focus on cost savings, financial benefits, and ROI calculations. Finance roles care about budget impact and financial justification.",
            "marketing": "Focus on customer engagement, brand visibility, and marketing capabilities. Marketing roles care about reaching customers and analytics.",
            "sales": "Focus on sales process improvements, conversion rates, and customer acquisition. Sales roles care about closing deals faster and more efficiently.",
            "operations": "Focus on efficiency gains, process improvements, and operational benefits. Operations roles care about streamlining workflows and reducing overhead."
        }
        
        base_prompt += f"\n{role_instructions.get(role_category, '')}"
        
        # Add tone-specific instructions
        tone_instructions = {
            "professional": "Use a professional, business-appropriate tone that is clear and direct.",
            "technical": "Use a technical tone with appropriate terminology and detailed explanations.",
            "formal": "Use a formal tone appropriate for official business communications."
        }
        
        base_prompt += f"\n{tone_instructions.get(tone, '')}"
        
        # Add message type-specific instructions
        if message_type == "email":
            base_prompt += """
            Format your response as an email with a subject line and body.
            Start with "Subject: [Your subject line]" followed by two line breaks and then the email body.
            Include an appropriate greeting and closing.
            """
        elif message_type == "linkedin":
            base_prompt += """
            Format your response as a LinkedIn message.
            Keep it concise (under 300 words) as LinkedIn has message length limitations.
            Be professional but conversational, as appropriate for the platform.
            """
        
        # Add follow-up specific instructions if applicable
        if is_follow_up:
            base_prompt += """
            This is a follow-up message. Reference the previous conversation appropriately.
            Address any questions or concerns raised in the client's response.
            Move the conversation forward toward a meeting or demo.
            """
        
        return base_prompt
    
    def _build_user_prompt(
        self,
        client: Client,
        product: Product,
        message_type: str,
        context: Optional[List[Dict[str, Any]]] = None,
        custom_instructions: Optional[str] = None,
        is_follow_up: bool = False,
        previous_message: Optional[Dict[str, Any]] = None,
        client_response: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build the user prompt with product and client information."""
        prompt = f"""
        Please create a personalized {message_type} for the following client:
        
        CLIENT INFORMATION:
        Name: {client.name}
        Position: {client.position}
        Company: {client.company}
        Role category: {client.role_category}
        
        PRODUCT INFORMATION:
        Name: {product.name}
        Description: {product.description}
        """
        
        # Add product features with role-specific benefits
        prompt += "\nKey features and benefits relevant to this client's role:"
        for feature in product.features:
            prompt += f"\n- {feature.name}: {feature.description}"
            if client.role_category in feature.benefits and feature.benefits[client.role_category]:
                for benefit in feature.benefits[client.role_category]:
                    prompt += f"\n  * {benefit}"
        
        # Add context from RAG if available
        if context:
            prompt += "\n\nADDITIONAL PRODUCT CONTEXT:"
            for ctx in context:
                prompt += f"\n{ctx.get('content', '')}"
        
        # Add previous message and client response for follow-ups
        if is_follow_up and previous_message:
            prompt += "\n\nPREVIOUS MESSAGE SENT:"
            if previous_message.get("subject"):
                prompt += f"\nSubject: {previous_message.get('subject')}"
            prompt += f"\n{previous_message.get('content', '')}"
            
            if client_response:
                prompt += f"\n\nCLIENT'S RESPONSE:\n{client_response.get('content', '')}"
        
        # Add custom instructions if provided
        if custom_instructions:
            prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{custom_instructions}"
        
        return prompt
    def _build_system_prompt(
        self, 
        role_category: str, 
        message_type: str, 
        tone: str,
        is_follow_up: bool
    ) -> str:
        """Build the system prompt based on client role and message requirements."""
        base_prompt = f"""
        You are an expert sales assistant specializing in creating highly personalized {message_type} messages for potential clients.
        """
        
        # Add role-specific instructions
        role_instructions = {
            "executive": "Focus on strategic value, ROI, and high-level business impact. Executives care about bottom-line results and competitive advantage.",
            "technical": "Focus on technical specifications, integration details, and technical capabilities. Technical roles care about implementation details and compatibility.",
            "finance": "Focus on cost savings, financial benefits, and ROI calculations. Finance roles care about budget impact and financial justification.",
            "marketing": "Focus on customer engagement, brand visibility, and marketing capabilities. Marketing roles care about reaching customers and analytics.",
            "sales": "Focus on sales process improvements, conversion rates, and customer acquisition. Sales roles care about closing deals faster and more efficiently.",
            "operations": "Focus on efficiency gains, process improvements, and operational benefits. Operations roles care about streamlining workflows and reducing overhead."
        }
        
        base_prompt += f"\n{role_instructions.get(role_category, '')}"
        
        # Add tone-specific instructions
        tone_instructions = {
            "professional": "Use a professional, business-appropriate tone that is clear and direct.",
            "technical": "Use a technical tone with appropriate terminology and detailed explanations.",
            "formal": "Use a formal tone appropriate for official business communications."
        }
        
        base_prompt += f"\n{tone_instructions.get(tone, '')}"
        
        # Add message type-specific instructions
        if message_type == "email":
            base_prompt += """
            Format your response as an email with a subject line and body.
            Start with "Subject: [Your subject line]" followed by two line breaks and then the email body.
            Include an appropriate greeting and closing.
            """
        elif message_type == "linkedin":
            base_prompt += """
            Format your response as a LinkedIn message.
            Keep it concise (under 300 words) as LinkedIn has message length limitations.
            Be professional but conversational, as appropriate for the platform.
            """
        
        # Add follow-up specific instructions if applicable
        if is_follow_up:
            base_prompt += """
            This is a follow-up message. Reference the previous conversation appropriately.
            Address any questions or concerns raised in the client's response.
            Move the conversation forward toward a meeting or demo.
            """
        
        return base_prompt
    
    def _build_user_prompt(
        self,
        client: Client,
        product: Product,
        message_type: str,
        context: Optional[List[Dict[str, Any]]] = None,
        custom_instructions: Optional[str] = None,
        is_follow_up: bool = False,
        previous_message: Optional[Dict[str, Any]] = None,
        client_response: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build the user prompt with product and client information."""
        prompt = f"""
        Please create a personalized {message_type} for the following client:
        
        CLIENT INFORMATION:
        Name: {client.name}
        Position: {client.position}
        Company: {client.company}
        Role category: {client.role_category}
        
        PRODUCT INFORMATION:
        Name: {product.name}
        Description: {product.description}
        """
        
        # Add product features with role-specific benefits
        prompt += "\nKey features and benefits relevant to this client's role:"
        for feature in product.features:
            prompt += f"\n- {feature.name}: {feature.description}"
            if client.role_category in feature.benefits and feature.benefits[client.role_category]:
                for benefit in feature.benefits[client.role_category]:
                    prompt += f"\n  * {benefit}"
        
        # Add context from RAG if available
        if context:
            prompt += "\n\nADDITIONAL PRODUCT CONTEXT:"
            for ctx in context:
                prompt += f"\n{ctx.get('content', '')}"
        
        # Add previous message and client response for follow-ups
        if is_follow_up and previous_message:
            prompt += "\n\nPREVIOUS MESSAGE SENT:"
            if previous_message.get("subject"):
                prompt += f"\nSubject: {previous_message.get('subject')}"
            prompt += f"\n{previous_message.get('content', '')}"
            
            if client_response:
                prompt += f"\n\nCLIENT'S RESPONSE:\n{client_response.get('content', '')}"
        
        # Add custom instructions if provided
        if custom_instructions:
            prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{custom_instructions}"
        
        return prompt
