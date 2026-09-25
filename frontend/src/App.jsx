import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/firebase";

import {
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUserProfile,
} from "./services/authService";

import {
  askLegalQuestion,
  getChatHistory,
} from "./services/chatService";

import { getUserDocuments } from "./services/documentService";

import "./App.css";
import { uploadDocument } from "./services/documentService";

function App() {
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  // Restore Firebase login session after page refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getCurrentUserProfile();

          setUser(profile);

          await loadDocuments();
          await loadChats();
        } catch (error) {
          console.error("Error restoring user session:", error);

          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      if (isSignup) {
        // Check password confirmation
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        // Create Firebase account
        await signupUser(email, password, name);


        setMessage("Account created successfully!");
      } else {
        // Login
        await loginUser(email, password);


        setMessage("Login successful!");
      }
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setMessage("");
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");
    setAnalysis(null);

    try {
      const result = await uploadDocument(selectedFile);

      setAnalysis(result.analysis);
      setMessage(result.message);
    } catch (err) {
      console.error("Document upload error:", err);

      setError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    setError("");

    try {
      const result = await getUserDocuments();

      setDocuments(result.documents);
    } catch (err) {
      console.error("Error loading documents:", err);

      setError(
        err.message || "Failed to load recent documents."
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      setChatHistoryLoading(true);

      const chats = await getChatHistory();

      setChatHistory(chats);

    } catch (error) {
      console.error("Error loading chat history:",error);
    } finally {
      setChatHistoryLoading(false);
    }
  };

  const handleAskQuestion = async (event) => {
    event.preventDefault();

    if (!chatQuestion.trim()) {
      return;
    }

    setChatLoading(true);
    setChatResponse(null);
    setError("");

    try {
      const result = await askLegalQuestion(chatQuestion);

      // Show current AI response
      setChatResponse(result);

      // Clear input
      setChatQuestion("");

      // Refresh chat history after successful question
      await loadChats();

    } catch (err) {
      console.error("Error asking legal question:", err);

      setError(
        err.message || "Failed to get legal rights response."
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleViewAnalysis = (document) => {
    setSelectedDocument(document);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();

      setUser(null);
      setMessage("");
      setError("");
    } catch (err) {
      setError("Logout failed.");
    }
  };

  // Show loading screen while Firebase checks existing session
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading NyayaSetu AI...</p>
      </div>
    );
  }

  // Dashboard
  if (user) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="logo"> NyayaSetu AI</div>

          <div className="user-section">
            <span className="user-name">{user.name}</span>

            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>


        <main className="dashboard">
          <section className="hero">
            <h1>Welcome, {user.name}!</h1>

            <p>
              Your AI-powered assistant for legal documents and rights.
            </p>
          </section>

          <section className="feature-grid">
            <div className="feature-card">
              <h2>📄 Analyze Document</h2>

              <p>
                Upload a legal document and let NyayaSetu AI analyze
                important information, clauses and potential concerns.
              </p>

              <div className="upload-area">
                <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                />

                {selectedFile && (
                  <p>
                    Selected file: <strong>{selectedFile.name}</strong>
                  </p>
                )}

                <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                >
                  {uploading ? "Analyzing..." : "Upload PDF"}
                </button>
              </div>
            </div>

            <div className="feature-card">
              <h2>⚖️ Know Your Rights</h2>

              <p>
                Ask questions about your legal rights and receive
                AI-powered explanations in simple language.
              </p>

              <button
              onClick={() => {
                document
                  .getElementById("rights-chat")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              >
                Ask a Question
              </button>
            
            </div>
          </section>

          {analysis && (
            <section className="documents-section">
              <h2>Document Analysis</h2>

              <p>
                <strong>Document Type:</strong>{" "}
                {analysis.document_type}
              </p>

              <p>
                <strong>Summary:</strong>{" "}
                {analysis.summary}
              </p>

              <h3>Important Clauses</h3>

              <ul>
                {analysis.important_clauses.map((clause, index) => (
                  <li key={index}>{clause}</li>
                ))}
              </ul>

              <h3>Rights</h3>

              <ul>
                {analysis.rights.map((right, index) => (
                  <li key={index}>{right}</li>
                ))}
              </ul>

              <h3>Obligations</h3>

              <ul>
                {analysis.obligations.map((obligation, index) => (
                  <li key={index}>{obligation}</li>
                ))}
              </ul>

              <h3>Risks</h3>

              <ul>
                {analysis.risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>

              <h3>Important Dates</h3>

              <ul>
                {analysis.important_dates.map((date, index) => (
                  <li key={index}>{date}</li>
                ))}
              </ul>

              <p>
                <strong>Disclaimer:</strong>{" "}
                {analysis.disclaimer}
              </p>
            </section>
          )}

          {/* Know Your Rights Chat */}
          <section className="rights-chat-section" id="rights-chat">
            <h2>⚖️ Know Your Rights</h2>

            <p>
              Ask a question about your legal rights and get a
              simple AI-powered explanation.
            </p>

            <form
            onSubmit={handleAskQuestion}
            className="rights-chat-form"
            >
              <textarea
              value={chatQuestion}
              onChange={(event) =>
                setChatQuestion(event.target.value)
              }
              placeholder="Ask your legal rights question..."
              rows="4"
              required
              />

              <button
              type="submit"
              disabled={chatLoading}
              >
                {chatLoading
                ? "Analyzing..."
                : "Ask Question"}
              </button>
            </form>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            {/* Current AI Response */}
            {chatResponse && (
              <div className="rights-response">

                <h3>Answer</h3>

                <p>{chatResponse.answer}</p>

                <h3>Your Rights</h3>

                <ul>
                  {chatResponse.rights.map((right, index) => (
                    <li key={index}>{right}</li>
                  ))}
                </ul>

                <h3>Important Points</h3>

                <ul>
                  {chatResponse.important_points.map(
                    (point, index) => (
                      <li key={index}>{point}</li>
                    )
                  )}
                </ul>

                <div className="disclaimer">
                  <strong>Disclaimer:</strong>

                  <p>{chatResponse.disclaimer}</p>
                </div>

              </div>
            )}

            {/* Chat History */}
            <div className="chat-history">

              <h3>📚 Previous Questions</h3>

              {chatHistoryLoading ? (
                <p>Loading chat history...</p>
              ) : chatHistory.length === 0 ? (
                <p>No previous questions yet.</p>
              ) : (
                <div className="chat-history-list">
                  
                  {chatHistory.map((chat) => (
                    <div
                    className="chat-history-card"
                    key={chat.id}
                    >

                      <p>
                        <strong>Question:</strong>{" "}
                        {chat.question}
                      </p>

                      <button
                      type="button"
                      onClick={() => setChatResponse(chat)}
                      >
                      View Answer
                      </button>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          
          {/* Recent Documents */}
          <section className="documents-section">
            <h2>Recent Documents</h2>

            {documentsLoading ? (
              <div className="empty-documents">
                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="empty-documents">
                <p>No documents analyzed yet.</p>

                <p>
                  Upload your first legal document to get started.
                </p>
              </div>
            ) : (
              <div className="recent-documents-list">
                {documents.map((document) => (
                  <div 
                  className="recent-document-card"
                  key={document.id}
                  >
                    <h3>📄 {document.filename}</h3>

                    <p>
                      <strong>Document Type:</strong>{" "}
                      {document.analysis?.document_type}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {document.status}
                    </p>

                    <button
                    onClick={() => handleViewAnalysis(document)}
                    >
                      View Analysis
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedDocument && (
            <section className="documents-section">
              <h2>Document Analysis</h2>

              <p>
                <strong>Document:</strong>{" "}
                {selectedDocument.filename}
              </p>

              <p>
                <strong>Document Type:</strong>{" "}
                {selectedDocument.analysis?.document_type}
              </p>

              <p>
                <strong>Summary:</strong>{" "}
                {selectedDocument.analysis?.summary}
              </p>

              <h3>Important Clauses</h3>
              <ul>
                {selectedDocument.analysis?.important_clauses?.map(
                  (clause, index) => (
                    <li key={index}>{clause}</li>
                  )
                )}
              </ul>

              <h3>Rights</h3>
              <ul>
                {selectedDocument.analysis?.rights?.map(
                  (right, index) => (
                    <li key={index}>{right}</li>
                  )
                )}
              </ul>

              <h3>Obligations</h3>
              <ul>
                {selectedDocument.analysis?.obligations?.map(
                  (obligation, index) => (
                    <li key={index}>{obligation}</li>
                  )
                )}
              </ul>

              <h3>Risks</h3>
              <ul>
                {selectedDocument.analysis?.risks?.map(
                  (risk, index) => (
                    <li key={index}>{risk}</li>
                  )
                )}
              </ul>

              <h3>Important Dates</h3>
              <ul>
                {selectedDocument.analysis?.important_dates?.map(
                  (date, index) => (
                    <li key={index}>{date}</li>
                  )
                )}
              </ul>

              <p>
                <strong>Disclaimer:</strong>{" "}
                {selectedDocument.analysis?.disclaimer}
              </p>

              <button
                onClick={() => setSelectedDocument(null)}
              >
                Close Analysis
              </button>
            </section>
          )}
          
        </main>
      </div>
    );
  }

  // Login / Signup screen
  return (
    <div className="app">
      <main className="dashboard">
        <section className="hero">
          <h1>NyayaSetu AI</h1>

          <p>
            Smart Legal Documents & Rights Assistant
          </p>
        </section>

        <div className="documents-section">
          <h2>{isSignup ? "Create Account" : "Login"}</h2>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div>
                <label>Name</label>
                <br />

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <br />

            <div>
              <label>Email</label>
              <br />

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <br />

            <div>
              <label>Password</label>
              <br />

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {isSignup && (
              <>
                <br />

                <div>
                  <label>Confirm Password</label>
                  <br />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </>
            )}

            <br />

            <button type="submit">
              {isSignup ? "Create Account" : "Login"}
            </button>
          </form>

          {message && <p>{message}</p>}

          {error && <p>{error}</p>}

          <hr />

          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage("");
              setError("");
            }}
          >
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;