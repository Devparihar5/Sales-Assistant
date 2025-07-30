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

## Tech Stack

### Backend

- **FastAPI**: Modern, high-performance web framework for building APIs
- **MongoDB**: NoSQL database for storing structured data and vector embeddings
- **OpenAI Integration**: Leverages GPT-4o for message generation and analysis
- **Retrieval-Augmented Generation**: Advanced document processing and retrieval capabilities

### Frontend

- **React**: Modern UI library for building interactive user interfaces
- **TailwindCSS**: Utility-first CSS framework for rapid UI development
- **React Query**: Data fetching and state management library
- **React Router**: Declarative routing for React applications
- **Chart.js**: Interactive charts and visualizations
- **Framer Motion**: Animation library for React

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- MongoDB (v5+)
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and add your configuration.

5. Run the development server:
   ```
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
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   └── dependencies/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── services/
│   │   ├── openai/
│   │   ├── rag/
│   │   └── auth/
│   └── utils/
├── tests/
└── requirements.txt
```

### Frontend

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── clients/
│   │   ├── products/
│   │   └── messages/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── utils/
└── package.json
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
