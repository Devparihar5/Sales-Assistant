# Sales Assistant Application

A sophisticated AI-powered sales communication tool that helps sales teams create highly personalized, role-specific communications for potential clients.

## Project Overview

The Sales Assistant application combines advanced natural language processing with structured data management and retrieval-augmented generation to provide sales teams with powerful capabilities for creating personalized communications.

### Key Features

- **Position-Based Personalization**: Automatically tailors messages based on the client's professional role
- **Multiple Message Types**: Support for email and LinkedIn messages with appropriate formatting
- **Tone Customization**: Professional, technical, and formal tone options
- **Follow-up Message Generation**: Context-aware follow-ups based on previous conversation history
- **Retrieval-Augmented Generation (RAG)**: Ensures accurate product information in generated messages
- **Comprehensive Client Management**: Store and manage client information and communication history
- **Product Knowledge Base**: Maintain product documentation and feature/benefit information
- **Authentication & Authorization**: Secure user management with JWT tokens
- **Document Processing**: Support for PDF and DOCX document processing for knowledge base

## Tech Stack

### Backend

- **FastAPI** (v0.104.1): Modern, high-performance web framework for building APIs
- **Uvicorn** (v0.23.2): ASGI server for running FastAPI applications
- **MongoDB** with **Motor** (v3.3.1): Async NoSQL database driver for storing structured data
- **OpenAI** (v1.3.0): Integration with GPT models for message generation and analysis
- **LangChain** (v0.0.335): Framework for building LLM applications with RAG capabilities
- **LangChain-OpenAI** (v0.0.2): OpenAI integration for LangChain
- **PyMongo** (v4.6.0): MongoDB driver for Python
- **Pydantic** (v2.4.2): Data validation and settings management
- **Python-JOSE** (v3.3.0): JWT token handling for authentication
- **Passlib** (v1.7.4): Password hashing utilities
- **Python-Multipart** (v0.0.6): File upload support
- **Python-Dotenv** (v1.0.0): Environment variable management
- **Tiktoken** (v0.5.1): Token counting for OpenAI models
- **Tenacity** (v8.2.3): Retry library for robust API calls
- **Document Processing**: PyPDF (v3.17.0) and python-docx (v1.0.1) for file handling

### Frontend

- **React** (v18.2.0): Modern UI library for building interactive user interfaces
- **TailwindCSS** (v3.3.5): Utility-first CSS framework for rapid UI development
- **React Query** (v3.39.3): Data fetching and state management library
- **React Router DOM** (v6.19.0): Declarative routing for React applications
- **Chart.js** (v4.4.0) with React-ChartJS-2 (v5.2.0): Interactive charts and visualizations
- **Framer Motion** (v10.16.5): Animation library for React
- **Axios** (v1.6.2): HTTP client for API requests
- **React Hook Form** (v7.48.2): Performant forms with easy validation
- **Headless UI** (v1.7.17) & **Heroicons** (v2.0.18): Accessible UI components and icons
- **Emotion** (v11.11.1): CSS-in-JS library for styling components

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- MongoDB (v5+)
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and configure the following variables:
   ```bash
   # MongoDB Configuration
   MONGODB_URL=mongodb://admin:admin@127.0.0.1:27165/sales_assistant?retryWrites=true&w=majority&authSource=admin
   MONGODB_DB_NAME=sales_assistant

   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # JWT Authentication
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=300

   # Application Settings
   DEBUG=True
   ENVIRONMENT=development
   ```

5. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your backend API URL:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```
   npm start
   ```

## Project Structure

### Backend

```
backend/
├── api/
│   ├── endpoints/
│   │   ├── auth.py
│   │   ├── clients.py
│   │   ├── messages.py
│   │   ├── products.py
│   │   └── users.py
│   └── dependencies/
├── core/
│   └── config.py
├── db/
│   └── mongodb.py
├── models/
│   ├── client.py
│   ├── message.py
│   ├── product.py
│   └── user.py
├── services/
│   ├── auth/
│   │   └── auth_service.py
│   ├── openai/
│   │   └── openai_service.py
│   └── rag/
│       └── rag_service.py
├── utils/
│   ├── object_id.py
│   ├── response_utils.py
│   └── security.py
├── main.py
├── requirements.txt
└── .env.example
```

### Frontend

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── clients/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── messages/
│   │   ├── products/
│   │   └── ui/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── .env
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
