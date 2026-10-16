import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/firebase";
import {
  getCurrentUserProfile,
  loginUser,
  logoutUser,
  signupUser,
} from "./services/authService";
import { askLegalQuestion, getChatHistory } from "./services/chatService";
import {
  deleteDocument,
  getUserDocuments,
  uploadDocument,
} from "./services/documentService";
import {
  AppShell,
  AssistantPage,
  AuthPage,
  ConversationPage,
  DashboardPage,
  DocumentAnalysisView,
  DocumentsPage,
  HistoryPage,
  InformationPage,
  LandingPage,
  NotFoundPage,
  Notice,
  PageHeading,
  ProfilePage,
  UploadPage,
} from "./AppViews";
import "./App.css";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

function currentHashPath() {
  const path = window.location.hash.slice(1).split("?")[0];
  return path || "/";
}

function LoadingScreen({ label = "Loading NyayaSetu AI" }) {
  return (
    <main className="app-loading" role="status" aria-live="polite">
      <span className="loading-mark">N</span>
      <span className="spinner" />
      <p>{label}</p>
    </main>
  );
}

function authErrorMessage(error, signup) {
  if (error?.code === "auth/email-already-in-use") return "An account already exists for this email.";
  if (error?.code === "auth/invalid-email") return "Enter a valid email address.";
  if (error?.code === "auth/weak-password") return "Use a stronger password with at least 6 characters.";
  if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") return "Email or password is incorrect.";
  return signup ? "Account setup could not be completed. Please try again." : "Sign-in could not be completed. Please try again.";
}

function App() {
  const [path, setPath] = useState(currentHashPath);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const navigate = (target) => {
    window.location.hash = target;
  };

  useEffect(() => {
    const syncPath = () => setPath(currentHashPath());
    window.addEventListener("hashchange", syncPath);
    return () => window.removeEventListener("hashchange", syncPath);
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (active) {
          setProfile(null);
          setDocuments([]);
          setChats([]);
          setDocumentsLoading(false);
          setChatsLoading(false);
          setSessionError("");
          setAuthReady(true);
        }
        return;
      }

      try {
        if (active) {
          setDocuments([]);
          setChats([]);
          setDocumentsLoading(true);
          setChatsLoading(true);
          setDocumentsError("");
          setChatsError("");
        }
        const currentProfile = await getCurrentUserProfile();
        if (active) {
          setProfile(currentProfile);
          setSessionError("");
        }
      } catch {
        if (active) {
          setProfile(null);
          setSessionError("Your account profile could not be loaded. Please sign in again.");
        }
      } finally {
        if (active) setAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (path.startsWith("/app/") && !profile) {
      navigate("/login");
      return;
    }
    if ((path === "/login" || path === "/signup") && profile) {
      navigate("/app/dashboard");
    }
  }, [authReady, path, profile]);

  useEffect(() => {
    if (path === "/features") {
      window.requestAnimationFrame(() => {
        document.getElementById("features")?.scrollIntoView();
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [path]);

  useEffect(() => {
    if (!profile) return undefined;

    let active = true;
    getUserDocuments()
      .then((result) => {
        if (active) setDocuments(Array.isArray(result.documents) ? result.documents : []);
      })
      .catch(() => {
        if (active) setDocumentsError("Saved documents could not be loaded. Try again.");
      })
      .finally(() => {
        if (active) setDocumentsLoading(false);
      });

    getChatHistory()
      .then((history) => {
        if (active) setChats(Array.isArray(history) ? history : []);
      })
      .catch(() => {
        if (active) setChatsError("Chat history could not be loaded. Try again.");
      })
      .finally(() => {
        if (active) setChatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profile]);

  const refreshDocuments = async () => {
    setDocumentsLoading(true);
    setDocumentsError("");
    try {
      const result = await getUserDocuments();
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
    } catch {
      setDocumentsError("Saved documents could not be refreshed. Try again.");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const refreshChats = async () => {
    setChatsLoading(true);
    setChatsError("");
    try {
      const result = await getChatHistory();
      setChats(Array.isArray(result) ? result : []);
    } catch {
      setChatsError("Chat history could not be refreshed. Try again.");
    } finally {
      setChatsLoading(false);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const signup = path === "/signup";
    setAuthError("");
    setAuthMessage("");
    if (signup && password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthBusy(true);
    try {
      if (signup) {
        const result = await signupUser(email.trim(), password, name.trim());
        setProfile(result.profile);
      } else {
        await loginUser(email.trim(), password);
        setProfile(await getCurrentUserProfile());
      }
      setPassword("");
      setConfirmPassword("");
      navigate("/app/dashboard");
    } catch (error) {
      setAuthError(authErrorMessage(error, signup));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setProfile(null);
      setDocuments([]);
      setChats([]);
      setAnswer(null);
      setAnalysis(null);
      navigate("/");
    } catch {
      setNotice({ kind: "error", text: "Sign-out failed. Please try again." });
    }
  };

  const acceptFile = (file) => {
    setNotice(null);
    if (!file) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice({ kind: "error", text: "Only PDF files are allowed." });
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice({ kind: "error", text: "PDF file size must not exceed 10 MiB." });
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setAnalysis(null);
    setNotice(null);
    try {
      const result = await uploadDocument(selectedFile);
      setAnalysis(result.analysis || null);
      setNotice({ kind: "success", text: result.message || "Document analysis completed." });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshDocuments();
    } catch {
      setNotice({ kind: "error", text: "The document could not be analyzed. Check the file and connection, then try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document) => {
    if (deletingId) return;
    const confirmed = window.confirm(`Delete the saved analysis for "${document.filename || "this document"}"? The original PDF is not stored as a retrievable document by this application.`);
    if (!confirmed) return;
    setDeletingId(document.id);
    setNotice(null);
    try {
      await deleteDocument(document.id);
      setDocuments((items) => items.filter((item) => item.id !== document.id));
      setNotice({ kind: "success", text: "Saved document analysis deleted." });
      if (path === `/app/documents/${encodeURIComponent(document.id)}`) {
        navigate("/app/documents");
      }
    } catch {
      setNotice({ kind: "error", text: "The saved analysis could not be deleted. Please try again." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAskQuestion = async (event) => {
    event.preventDefault();
    if (asking || !question.trim()) return;
    setAsking(true);
    setNotice(null);
    setAnswer(null);
    try {
      const result = await askLegalQuestion(question.trim());
      setAnswer(result);
      setQuestion("");
      await refreshChats();
    } catch {
      setNotice({ kind: "error", text: "The question could not be answered. Check your connection and try again." });
    } finally {
      setAsking(false);
    }
  };

  if (!authReady) return <LoadingScreen />;

  const isAuthenticatedPage = path.startsWith("/app/");
  if (isAuthenticatedPage && !profile) return <LoadingScreen label="Opening sign-in" />;

  if (path === "/login" || path === "/signup") {
    return (
      <AuthPage
        mode={path === "/signup" ? "signup" : "login"}
        name={name}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleAuthSubmit}
        error={authError || sessionError}
        message={authMessage}
        busy={authBusy}
      />
    );
  }

  if (path === "/" || path === "/features" || path === "/about" || path === "/faq" || path === "/privacy") {
    if (path === "/" || path === "/features") {
      return <LandingPage authenticated={Boolean(profile)} />;
    }
    return <InformationPage page={path.slice(1)} authenticated={Boolean(profile)} />;
  }

  if (!isAuthenticatedPage) return <NotFoundPage authenticated={Boolean(profile)} />;

  const detailMatch = path.match(/^\/app\/documents\/(.+)$/);
  const conversationMatch = path.match(/^\/app\/history\/(.+)$/);
  let page = path;
  if (detailMatch) page = "/app/documents";
  if (conversationMatch) page = "/app/history";

  const pageTitles = {
    "/app/dashboard": "Overview",
    "/app/analyze": "Analyze a document",
    "/app/documents": "Document library",
    "/app/assistant": "Rights assistant",
    "/app/history": "Chat history",
    "/app/profile": "Account",
  };
  const title = pageTitles[page];
  if (!title) return <NotFoundPage authenticated />;

  let content;
  if (page === "/app/dashboard") {
    content = <DashboardPage profile={profile} documents={documents} chats={chats} documentsLoading={documentsLoading} chatsLoading={chatsLoading} navigate={navigate} />;
  } else if (page === "/app/analyze") {
    content = <UploadPage file={selectedFile} fileInputRef={fileInputRef} onChooseFile={acceptFile} onDropFile={acceptFile} onUpload={handleUpload} uploading={uploading} analysis={analysis} notice={notice} clearNotice={() => setNotice(null)} />;
  } else if (page === "/app/documents" && detailMatch) {
    let documentId;
    try {
      documentId = decodeURIComponent(detailMatch[1]);
    } catch {
      documentId = "";
    }
    const document = documents.find((item) => item.id === documentId);
    content = documentsLoading ? <div className="loading-state" role="status"><span className="spinner" />Loading document…</div> : document ? <div className="page-stack"><PageHeading eyebrow="SAVED ANALYSIS" title={document.filename || "Document details"} action={<button type="button" className="button button-danger-outline" onClick={() => handleDeleteDocument(document)} disabled={deletingId === document.id}>{deletingId === document.id ? "Deleting…" : "Delete analysis"}</button>} />{notice && <Notice kind={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}<section className="content-panel"><DocumentAnalysisView analysis={document.analysis} filename={document.filename} /></section></div> : <NotFoundPage authenticated />;
  } else if (page === "/app/documents") {
    content = <DocumentsPage documents={documents} loading={documentsLoading} error={documentsError} onDelete={handleDeleteDocument} navigate={navigate} />;
  } else if (page === "/app/assistant") {
    content = <AssistantPage question={question} setQuestion={setQuestion} onSubmit={handleAskQuestion} loading={asking} answer={answer} notice={notice} clearNotice={() => setNotice(null)} />;
  } else if (page === "/app/history" && conversationMatch) {
    let conversationId;
    try {
      conversationId = decodeURIComponent(conversationMatch[1]);
    } catch {
      conversationId = "";
    }
    const chat = chats.find((item) => item.id === conversationId);
    content = chatsLoading ? <div className="loading-state" role="status"><span className="spinner" />Loading conversation…</div> : <ConversationPage chat={chat} />;
  } else if (page === "/app/history") {
    content = <HistoryPage chats={chats} loading={chatsLoading} error={chatsError} />;
  } else {
    content = <ProfilePage profile={profile} onLogout={handleLogout} />;
  }

  return (
    <AppShell page={page} title={title} profile={profile} onLogout={handleLogout}>
      {notice && page !== "/app/analyze" && page !== "/app/assistant" && !(page === "/app/documents" && detailMatch) && <Notice kind={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}
      {content}
    </AppShell>
  );
}

export default App;
