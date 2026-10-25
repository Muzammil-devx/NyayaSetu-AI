# NyayaSetu AI – Smart Legal Documents & Rights Assistant

NyayaSetu AI is an AI-powered web application developed as a TYCS Computer Science mini project. It is designed to help users understand legal documents and obtain general information about legal rights in simple language.

Authenticated users can ask legal-rights questions, receive structured AI-generated guidance, upload PDF documents for analysis, and review their previous chats and document analyses.

> **Disclaimer:** NyayaSetu AI provides educational and informational content only. AI-generated responses may be incomplete or incorrect and are not a substitute for advice from a qualified lawyer. Verify important findings against the original document and consult a qualified legal professional before making decisions about a specific legal matter.

---

## Features

### 1. User Authentication
- Firebase Authentication supports user sign-in and sign-up in the frontend.
- The frontend obtains a Firebase ID token for protected API requests.
- The FastAPI backend verifies ID tokens on protected routes.
- User profile information can be created or updated in Firestore.

### 2. Know Your Rights
Users can submit questions about legal rights. The Gemini-powered assistant returns a structured response that may include:
- Answer
- Potentially relevant rights
- Important legal points
- Situation summary
- Suggested action plan
- Evidence checklist
- Questions that may need clarification
- When to seek qualified help
- Disclaimer

The response is general information, not a determination of a user's legal position.

### 3. Chat History
- Authenticated users can view previous legal-rights questions and responses.
- Chat records are stored in Firebase Firestore.
- The backend filters chat history by the authenticated user's ID.

### 4. Legal Document Analysis
Users can upload a PDF document for analysis. The backend:
1. Verifies the Firebase ID token.
2. Checks the filename extension and PDF signature.
3. Enforces a maximum upload size of 10 MB.
4. Temporarily saves the PDF and extracts selectable text using `pypdf`.
5. Sends the extracted text to the configured Google Gemini model.
6. Validates the response using Pydantic models and checks supplied evidence excerpts against extracted text.
7. Saves the analysis record to Firestore and returns the result to the frontend.
8. Attempts to remove the temporary local PDF after processing.

The structured analysis may include:
- Document type and summary
- Important clauses
- Rights and obligations
- Potential risks and clause-risk screening
- Important dates
- Evidence findings and evidence-verification status
- Completeness checks for important document fields
- Disclaimer

Evidence verification checks whether a short quoted excerpt exactly appears in the extracted PDF text. It does **not** prove that an AI interpretation is legally correct.

### 5. Recent Documents
Authenticated users can retrieve their previous document-analysis records. The backend scopes document queries to the authenticated user's ID. A document record can be deleted through the document API if it belongs to that user.

### 6. API Error Handling
The backend handles common conditions such as invalid or expired authentication tokens, invalid PDF uploads, files larger than 10 MB, PDFs with no extractable text, and temporary AI service or usage-limit errors.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, HTML, CSS |
| Frontend authentication | Firebase Web SDK / Firebase Authentication |
| Backend API | Python, FastAPI, Uvicorn |
| Data validation | Pydantic |
| PDF text extraction | `pypdf` |
| Generative AI | Google Gemini API, Google GenAI Python SDK |
| Authentication verification | Firebase Admin SDK |
| Database | Firebase Cloud Firestore |
| Python dependencies | `uv` with `pyproject.toml` and `uv.lock` |
| Frontend checks | ESLint and Vite production build |
| Backend tests | Python `unittest` and FastAPI `TestClient` |

---

## Project Architecture

```text
                         User / Browser
                               |
                               v
                      React + Vite Frontend
                               |
                   Firebase Authentication
                               |
                    Firebase ID token
                               |
                               v
                         FastAPI Backend
                               |
             +-----------------+------------------+
             |                 |                  |
             v                 v                  v
      Firebase Admin       Firestore          Gemini API
      token verification   profiles, chats,   rights and
                           document analyses  document analysis
             |
             v
       Protected API routes

 PDF upload --> size/signature validation --> temporary local file
                                           --> pypdf text extraction
                                           --> Gemini analysis
                                           --> evidence checks
                                           --> Firestore analysis record
                                           --> temporary-file cleanup
```

### Storage clarification
- **Firestore** stores user profiles, chat records, and document-analysis records where implemented.
- Uploaded PDF files are handled through the backend's local `uploads/` directory temporarily and the upload route attempts to delete the temporary file after processing.
- **Firebase Storage is not integrated** in the current implementation.
- The `uploads/` directory is not a permanent cloud document archive.

---

## Project Structure

```text
NyayaSetu-AI/
├── backend/
│   ├── api/
│   │   ├── auth.py             # Authentication and profile routes
│   │   ├── chat.py             # Rights assistant and chat history
│   │   ├── documents.py        # PDF upload, analysis records, deletion
│   │   └── rights.py           # Rights-analysis API route
│   ├── models/
│   │   ├── document.py         # Document analysis and evidence models
│   │   ├── rights.py           # Rights-analysis response model
│   │   └── user.py             # User-related model(s), if used
│   ├── prompts/                # AI prompts for document and rights analysis
│   ├── services/
│   │   ├── ai_service.py       # Gemini integration
│   │   ├── firebase_service.py# Firebase Admin and Firestore setup
│   │   └── pdf_service.py      # PDF text extraction
│   └── main.py                 # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── firebase/           # Firebase client configuration
│   │   ├── services/           # API, auth, chat and document services
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── .env.example            # Frontend environment variable template
│   └── package.json
├── tests/
│   └── test_api_security.py    # Backend API/security tests
├── uploads/
│   └── .gitkeep
├── .env                        # Private backend configuration (create locally)
├── firebase-service-account.json # Private Firebase Admin credentials (create locally)
├── pyproject.toml
├── uv.lock
└── README.md
```

> Some source files or folders may be added or removed as the project evolves. The actual repository is the source of truth for the current structure.

---

## Prerequisites

- Git
- Python **3.14 or newer**, as specified in the current `pyproject.toml`
- Node.js and npm compatible with the Vite version installed by the project
- `uv` for Python dependency management
- A Google Gemini API key and a supported model available to that API account
- A Firebase project with Firebase Authentication and Cloud Firestore configured

---

## Setup and Configuration

Run the commands below in PowerShell from the project root unless stated otherwise.

### 1. Clone the repository

```powershell
git clone https://github.com/Muzammil-devx/NyayaSetu-AI.git
cd NyayaSetu-AI
```

### 2. Set up the Python environment

Install `uv` if it is not already installed, then sync the environment from the project lock file:

```powershell
uv sync
```

This creates/synchronizes the project environment using `pyproject.toml` and `uv.lock`.

### 3. Configure backend environment variables

Create a `.env` file in the repository root. Configure the Gemini API key and a model name supported by your Google Gemini API account:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
```

The backend currently loads these values from the root `.env` file. The model value above is a placeholder; replace it with a model identifier that is available to your account.

### 4. Configure Firebase Admin credentials

Place your Firebase service-account JSON file in the repository root with this exact filename:

```text
firebase-service-account.json
```

The current backend code reads this path in `backend/services/firebase_service.py`.

**Never commit the service-account JSON, private keys, ID tokens, or real secrets to GitHub.** The repository `.gitignore` excludes `firebase-service-account.json` and `.env`.

### 5. Configure frontend Firebase

Copy `frontend/.env.example` to `frontend/.env` and fill in the Firebase web-app configuration from your Firebase project:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Optional: keep blank to use the Vite /api proxy in local development.
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
```

These are browser-side Firebase configuration values, not the Firebase Admin service-account credentials. Follow Firebase's security guidance and configure appropriate Firebase Authentication and Firestore rules.

### 6. Install frontend dependencies

```powershell
npm.cmd --prefix frontend install
```

---

## Run the Application

Start the backend and frontend in **two separate PowerShell terminals** from the project root.

### Terminal 1 — FastAPI backend

```powershell
uv run uvicorn backend.main:app --reload
```

The backend normally runs at:

- API base: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`

### Terminal 2 — React frontend

```powershell
npm.cmd --prefix frontend run dev
```

Open the local address printed by Vite, usually `http://localhost:5173/`.

During local development, Vite proxies `/api` requests to `http://127.0.0.1:8000` by default. If the backend runs at a different address, set `VITE_API_PROXY_TARGET` in `frontend/.env`.

---

## API Endpoints

These endpoints are registered by the current backend. Protected endpoints require a valid Firebase ID token in the `Authorization: Bearer <token>` header unless otherwise stated.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Welcome response |
| `GET` | `/health` | Backend health check |
| `GET` | `/api/auth/me` | Get the current user's profile |
| `POST` | `/api/auth/profile` | Create or update the current user's profile |
| `POST` | `/api/chat` | Submit a legal-rights question and save its analysis |
| `GET` | `/api/chats` | Retrieve the current user's chat history |
| `POST` | `/api/documents/upload` | Upload and analyze a PDF (maximum 10 MB) |
| `GET` | `/api/documents` | List the current user's document-analysis records |
| `DELETE` | `/api/documents/{document_id}` | Delete a document-analysis record belonging to the current user |
| `POST` | `/api/rights` | Submit a rights-analysis question |

For exact request fields, response schemas, status codes, and current authentication behavior, run the backend and inspect the interactive `/docs` page. The API can change as the project evolves.

---

## Automated Checks

Run these from the project root.

### Backend tests

```powershell
uv run python -B -m unittest discover -s tests -v
```

### Frontend lint

```powershell
npm.cmd --prefix frontend run lint
```

### Frontend production build

```powershell
npm.cmd --prefix frontend run build
```

### Check pending Git changes for whitespace errors

```powershell
git diff --check
```

Run these commands on the final checkout before submitting the project. A passing unit-test suite, lint check, or production build does not by itself guarantee that every live Firebase/Gemini integration scenario works.

---

## Current Limitations

- AI-generated content may be inaccurate, incomplete, or missing context.
- Exact-text evidence checks only establish whether a supplied excerpt appears in extracted text; they do not establish legal correctness.
- Scanned or image-only PDFs may not produce extractable text; OCR is not confirmed as integrated.
- PDF files are processed through temporary local storage; Firebase Storage is not configured.
- Live functionality depends on valid Firebase credentials, Firestore setup, internet connectivity, Gemini model availability, and API quotas.
- The project is an academic prototype and should not be treated as a replacement for a qualified lawyer.

## Future Scope

- Add OCR support for scanned and image-only PDFs.
- Consider cloud file storage if persistent PDF storage is required.
- Improve upload cleanup, monitoring, logging, and deployment configuration.
- Add more integration tests and frontend component tests.
- Add export options for analysis results and improve accessibility and multilingual support.
- Continue improving transparency around evidence, uncertainty, and when to seek professional legal help.

---

## Academic Project

- **Project title:** NyayaSetu AI – Smart Legal Documents & Rights Assistant
- **Programme:** B.Sc. Computer Science — Third Year (TYCS)
- **Project type:** Academic mini project

---

## License

No license has been specified in the current project files. Do not assume the project is open-source or add a license unless you choose one.
