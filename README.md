# NyayaSetu AI – Smart Legal Documents & Rights Assistant

NyayaSetu AI is an AI-powered web application designed to help users understand legal documents and basic legal rights in simple language.

The system allows authenticated users to:
- Ask questions related to their legal rights.
- Receive AI-generated explanations.
- Upload legal PDF documents.
- Extract and analyze document text.
- Identify the document type.
- View important clauses, rights, obligations, risks, and important points.
- View previous questions and document analyses.

> **Disclaimer:** NyayaSetu AI is an educational and informational assistant. It does not replace a qualified lawyer or professional legal advice. Users should consult a qualified legal professional for decisions involving their specific legal situation.

---

## Features

### 1. User Authentication
- Firebase Authentication is used for user login and signup.
- Firebase ID tokens are used to authenticate requests to the FastAPI backend.
- Backend authentication is handled by verifying Firebase ID tokens.

### 2. Know Your Rights
Users can ask questions related to legal rights.

The system provides structured AI responses containing:
- Answer
- Rights
- Important Points
- Disclaimer

### 3. Chat History
Authenticated users can view their previous legal-rights questions and responses.

Chat history is stored using Firebase Firestore.

### 4. Legal Document Analysis
Users can upload a legal PDF document.

NyayaSetu AI:
1. Accepts the uploaded PDF.
2. Extracts text from the document.
3. Sends the extracted content for AI analysis.
4. Generates a structured analysis.
5. Displays the analysis in the frontend.

The analysis can include:
- Document Type
- Summary
- Important Clauses
- Rights
- Obligations
- Risks
- Important Dates
- Disclaimer

### 5. Recent Documents
Previously processed documents can be displayed in the user's document section along with their analysis.

### 6. Error Handling
The application handles common failures such as:
- Authentication errors
- Expired/invalid Firebase ID tokens
- AI service unavailability
- Failed API requests
- Document processing failures

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- HTML
- CSS
- Firebase Web SDK

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- PyPDF

### AI
- Google Gemini API
- Google GenAI Python SDK

### Authentication & Database
- Firebase Authentication
- Firebase Firestore

### Package Management
- UV

---

## Project Architecture

```text
                    ┌─────────────────────┐
                    │     User / Browser  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │
                    Firebase ID Token
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      Firebase Auth       Firestore        Gemini AI
             │                 │                 │
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                       PDF Text Extraction
                            (PyPDF)