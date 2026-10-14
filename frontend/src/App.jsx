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

import {
  getUserDocuments,
  deleteDocument,
} from "./services/documentService";

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

  const handleDeleteDocument = async (document) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.filename}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteDocument(document.id);

      setMessage(
        `"${document.filename}" deleted successfully.`
      );

      // Clear analysis if the deleted document is currently selected
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
      }

      // Refresh the Recent Documents list
      await loadDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);

      setError(err.message || "Failed to delete document.");
    }
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
        <aside className="app-sidebar">
          <a className="sidebar-brand" href="#dashboard-top">
            <span className="brand-mark">N</span>
            <span>
              <strong>NyayaSetu</strong>
              <small>LEGAL INTELLIGENCE</small>
            </span>
          </a>

          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-nav" aria-label="Dashboard navigation">
            <a className="sidebar-link active" href="#dashboard-top">
              <span>▦</span> Dashboard
            </a>
            <a className="sidebar-link" href="#document-upload">
              <span>▤</span> Analyze Document
            </a>
            <a className="sidebar-link" href="#rights-chat">
              <span>⚖</span> Know Your Rights
            </a>
            <a className="sidebar-link" href="#recent-documents">
              <span>◷</span> Recent Documents
            </a>
          </nav>

          <div className="sidebar-note">
            <span className="sidebar-note-icon">✦</span>
            <strong>Legal clarity, made simple.</strong>
            <p>Understand documents and explore your rights with AI assistance.</p>
          </div>

          <div className="sidebar-footer">
            <span className="sidebar-status-dot" />
            AI assistant workspace
          </div>
        </aside>

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
          <section className="hero" id="dashboard-top">
            <h1>Welcome, {user.name}!</h1>

            <p>
              Your AI-powered assistant for legal documents and rights.
            </p>
          </section>

          <section className="feature-grid">
            <div className="feature-card" id="document-upload">
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

              <h3>Contract Completeness Checker</h3>

              {Array.isArray(analysis.completeness_check) &&
              analysis.completeness_check.length > 0 ? (
                <div className="completeness-check-list">
                  {analysis.completeness_check.map((item, index) => (
                    <article
                      className="completeness-check-card"
                      key={`${item.field_name}-${index}`}
                    >
                      <div className="completeness-check-header">
                        <h4>{item.field_name || "Document Field"}</h4>

                        <span
                          className={`completeness-status completeness-status-${String(
                            item.status || "Needs Review"
                          ).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {item.status || "Needs Review"}
                        </span>
                      </div>

                      <p>
                        {item.explanation ||
                          "No explanation was provided for this field."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  Completeness check results are unavailable for this document.
                  Please check the API response if this message persists.
                </p>
              )}

              <p className="completeness-check-note">
                This is a preliminary check of information found in the document.
                A missing field does not automatically mean the document is invalid.
              </p>

              <h3>Clause Risk Radar</h3>

              {Array.isArray(analysis.clause_risks) &&
              analysis.clause_risks.length > 0 ? (
                <div className="clause-risk-list">
                  {analysis.clause_risks.map((risk, index) => (
                    <article
                      className="clause-risk-card"
                      key={`${risk.severity}-${index}`}
                    >
                      <div className="clause-risk-header">
                        <h4>Potential Risk {index + 1}</h4>

                        <span
                          className={`risk-severity risk-severity-${String(
                            risk.severity || "Low"
                          ).toLowerCase()}`}
                        >
                          {risk.severity || "Unclassified"}
                        </span>
                      </div>

                      <p>
                        <strong>Supporting clause:</strong>{" "}
                        {risk.clause_text || "No supporting clause supplied."}
                      </p>

                      <p>
                        <strong>Why it may matter:</strong>{" "}
                        {risk.explanation || "No explanation supplied."}
                      </p>

                      {Array.isArray(risk.verification_questions) &&
                      risk.verification_questions.length > 0 && (
                        <>
                          <strong>Questions to verify</strong>
                          <ul>
                            {risk.verification_questions.map((question, qIndex) => (
                              <li key={qIndex}>{question}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No structured clause-risk findings were returned for this document.
                  Review the general risks above before making important decisions.
                </p>
              )}

              <p className="risk-radar-note">
                AI-generated screening only; this is not a legal opinion or a finding
                that a clause is unlawful.
              </p>

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

                <h3>Situation Summary</h3>
                <p>
                  {chatResponse.situation_summary ||
                    chatResponse.answer ||
                    "No situation summary available."}
                </p>

                <h3>Answer</h3>

                <p>{chatResponse.answer}</p>

                <h3>Your Possible Rights</h3>
                {chatResponse.rights?.length > 0 ? (
                  <ul>
                    {chatResponse.rights.map((right, index) => (
                      <li key={index}>{right}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No rights information available.</p>
                )}

                <h3>Step-by-Step Action Plan</h3>
                {chatResponse.action_plan?.length > 0 ? (
                  <ol>
                    {chatResponse.action_plan.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p>No action plan available.</p>
                )}

                <h3>Evidence Checklist</h3>
                {chatResponse.evidence_checklist?.length > 0 ? (
                  <ul className="evidence-checklist">
                    {chatResponse.evidence_checklist.map((item, index) => (
                      <li key={index}>
                        <label>
                          <input type="checkbox" />
                          <span>{item}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No evidence checklist available.</p>
                )}

                <h3>Questions to Clarify</h3>
                {chatResponse.questions_to_clarify?.length > 0 ? (
                  <ul>
                    {chatResponse.questions_to_clarify.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional questions suggested.</p>
                )}

                <h3>Important Points</h3>
                {chatResponse.important_points?.length > 0 ? (
                  <ul>
                    {chatResponse.important_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional points available.</p>
                )}

                <h3>When to Seek Help</h3>
                {chatResponse.when_to_seek_help?.length > 0 ? (
                  <ul>
                    {chatResponse.when_to_seek_help.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Consider consulting a qualified legal professional for
                    important or uncertain legal matters.</p>
                )}

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
          <section className="documents-section" id="recent-documents">
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

                    <div className="document-actions">
                      <button
                        onClick={() => handleViewAnalysis(document)}
                      >
                        View Analysis
                      </button>

                      <button
                        className="delete-document-button"
                        onClick={() => handleDeleteDocument(document)}
                      >
                        Delete
                      </button>
                    </div>

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

              <h3>Contract Completeness Checker</h3>

              {Array.isArray(selectedDocument.analysis?.completeness_check) &&
              selectedDocument.analysis.completeness_check.length > 0 ? (
                <div className="completeness-check-list">
                  {selectedDocument.analysis.completeness_check.map((item, index) => (
                    <article className="completeness-check-card" key={`${item.field_name}-${index}`}>
                      <div className="completeness-check-header">
                        <h4>{item.field_name || "Document Field"}</h4>
                        <span
                          className={`completeness-status completeness-status-${String(
                            item.status || "Needs Review"
                          ).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {item.status || "Needs Review"}
                        </span>
                      </div>
                      <p>
                        {item.explanation || "No explanation was provided for this field."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  Completeness check results are unavailable for this document.
                  Upload the PDF again to run the updated checker.
                </p>
              )}

              <p className="completeness-check-note">
                This is a preliminary check of information found in the document.
                A missing field does not automatically mean the document is invalid.
              </p>

              <h3>Clause Risk Radar</h3>

              {Array.isArray(selectedDocument.analysis?.clause_risks) &&
              selectedDocument.analysis.clause_risks.length > 0 ? (
                <div className="clause-risk-list">
                  {selectedDocument.analysis.clause_risks.map((risk, index) => (
                    <article
                      className="clause-risk-card"
                      key={`${risk.severity}-${index}`}
                    >
                      <div className="clause-risk-header">
                        <h4>Potential Risk {index + 1}</h4>

                        <span
                          className={`risk-severity risk-severity-${String(
                            risk.severity || "Low"
                          ).toLowerCase()}`}
                        >
                          {risk.severity || "Unclassified"}
                        </span>
                      </div>

                      <p>
                        <strong>Supporting clause:</strong>{" "}
                        {risk.clause_text || "No supporting clause supplied."}
                      </p>

                      <p>
                        <strong>Why it may matter:</strong>{" "}
                        {risk.explanation || "No explanation supplied."}
                      </p>

                      {Array.isArray(risk.verification_questions) &&
                      risk.verification_questions.length > 0 && (
                        <>
                          <strong>Questions to verify</strong>
                          <ul>
                            {risk.verification_questions.map((question, qIndex) => (
                              <li key={qIndex}>{question}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No structured clause-risk findings were returned for this document.
                  Review the general risks above before making important decisions.
                </p>
              )}

              <p className="risk-radar-note">
                AI-generated screening only; this is not a legal opinion or a finding
                that a clause is unlawful.
              </p>

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