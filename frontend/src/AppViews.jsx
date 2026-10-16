import { useState } from "react";

const asList = (value) => (Array.isArray(value) ? value : []);

function isLegacyAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(analysis, "evidence_findings")) {
    return false;
  }
  const findings = [
    ...asList(analysis.clause_risks),
    ...asList(analysis.completeness_check),
  ];
  return !findings.some(
    (item) => item && Object.prototype.hasOwnProperty.call(item, "evidence_verified")
  );
}

function Brand({ light = false }) {
  return (
    <a className={`brand${light ? " brand-light" : ""}`} href="#/" aria-label="NyayaSetu AI home">
      <span className="brand-mark" aria-hidden="true">N</span>
      <span className="brand-copy">
        <strong>NyayaSetu</strong>
        <small>LEGAL DOCUMENTS & RIGHTS</small>
      </span>
    </a>
  );
}

function PublicHeader({ authenticated }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Brand />
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <nav className={`public-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          <a href="#/features" onClick={() => setMenuOpen(false)}>What it does</a>
          <a href="#/about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#/faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <a href="#/privacy" onClick={() => setMenuOpen(false)}>Privacy</a>
          <a className="button button-small" href={authenticated ? "#/app/dashboard" : "#/login"} onClick={() => setMenuOpen(false)}>
            {authenticated ? "Open workspace" : "Sign in"}
          </a>
        </nav>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-inner">
        <Brand light />
        <p>General information only. Not a substitute for advice from a qualified legal professional.</p>
        <nav aria-label="Footer navigation">
          <a href="#/about">About</a>
          <a href="#/faq">FAQ</a>
          <a href="#/privacy">Privacy</a>
        </nav>
        <small>NyayaSetu AI</small>
      </div>
    </footer>
  );
}

export function PublicLayout({ children, authenticated }) {
  return (
    <div className="public-site">
      <PublicHeader authenticated={authenticated} />
      {children}
      <PublicFooter />
    </div>
  );
}

export function LandingPage({ authenticated }) {
  return (
    <PublicLayout authenticated={authenticated}>
      <main>
        <section className="landing-hero page-width">
          <div className="hero-copy">
            <p className="eyebrow">A clearer first read of legal documents</p>
            <h1>NyayaSetu AI</h1>
            <p className="hero-lede">
              Understand what a document says, see which extracted wording supports an AI finding, and explore practical questions to review.
            </p>
            <div className="hero-actions">
              <a className="button" href={authenticated ? "#/app/dashboard" : "#/signup"}>
                {authenticated ? "Go to your workspace" : "Create an account"}
              </a>
              <a className="text-link" href="#/features">Explore the workflow <span aria-hidden="true">↓</span></a>
            </div>
            <p className="hero-caveat">Informational assistance, not a legal opinion or a guarantee of correctness.</p>
          </div>
          <div className="workflow-visual" aria-label="Document analysis workflow">
            <div className="workflow-heading">
              <span>DOCUMENT REVIEW</span>
              <span className="workflow-status"><i /> evidence checked</span>
            </div>
            <div className="workflow-step">
              <span className="step-number">01</span>
              <div><strong>PDF received</strong><small>File type and size checked</small></div>
              <span className="step-mark">✓</span>
            </div>
            <div className="workflow-connector" />
            <div className="workflow-step">
              <span className="step-number">02</span>
              <div><strong>Text extracted</strong><small>PDF text sent for AI analysis</small></div>
              <span className="step-mark">✓</span>
            </div>
            <div className="workflow-connector" />
            <div className="workflow-step workflow-step-current">
              <span className="step-number">03</span>
              <div><strong>Findings reviewed</strong><small>Short excerpts matched to extracted text</small></div>
              <span className="step-mark">03</span>
            </div>
            <p className="workflow-footnote">A text match does not prove that an interpretation is legally correct.</p>
          </div>
        </section>

        <section className="public-section features-section" id="features">
          <div className="page-width">
            <div className="section-heading">
              <p className="eyebrow">Built around practical review</p>
              <h2>Read the document. Check the evidence. Decide what needs attention.</h2>
            </div>
            <div className="feature-grid-public">
              <article className="feature-item">
                <span className="feature-index">01 / DOCUMENTS</span>
                <h3>Structured summaries</h3>
                <p>Review document type, summary, clauses, rights, obligations, and dates in one place.</p>
              </article>
              <article className="feature-item">
                <span className="feature-index">02 / EVIDENCE</span>
                <h3>Excerpt-aware findings</h3>
                <p>New analysis excerpts are checked against extracted text. Unmatched findings are marked unverified.</p>
              </article>
              <article className="feature-item">
                <span className="feature-index">03 / REVIEW</span>
                <h3>Potential risks and gaps</h3>
                <p>Review preliminary risk signals and information not found in extracted text. Neither determines legal validity.</p>
              </article>
              <article className="feature-item">
                <span className="feature-index">04 / RIGHTS</span>
                <h3>General rights guidance</h3>
                <p>Ask a question and receive general information, possible next steps, and questions to clarify.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="public-section process-section">
          <div className="page-width process-layout">
            <div>
              <p className="eyebrow">How it works</p>
              <h2>From upload to a more informed review</h2>
              <p className="section-intro">The application processes the PDF for analysis and saves the filename and resulting analysis to your account history.</p>
            </div>
            <ol className="process-list">
              <li><span>1</span><div><strong>Choose a text-based PDF</strong><p>Uploads are limited to 10 MiB. Scanned documents without extractable text may not work.</p></div></li>
              <li><span>2</span><div><strong>Review the structured output</strong><p>Extracted text is sent to the configured Google Gemini service; the app checks quoted excerpts against that text.</p></div></li>
              <li><span>3</span><div><strong>Verify before acting</strong><p>Read the source document and ask a qualified professional about important or uncertain decisions.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="responsible-band">
          <div className="page-width responsible-inner">
            <div><p className="eyebrow">Responsible use</p><h2>Useful context, not a legal conclusion.</h2></div>
            <p>AI can miss context, misread extracted text, or produce an incorrect interpretation. Evidence matching confirms text presence only. This service does not replace a lawyer.</p>
            <a className="button button-outline" href="#/privacy">Read privacy details</a>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

const INFO_CONTENT = {
  about: {
    eyebrow: "About NyayaSetu AI",
    title: "A practical reading aid for legal documents and general rights questions.",
    paragraphs: [
      "NyayaSetu AI combines PDF text extraction and Gemini-generated analysis to help users review document structure, potential issues, and follow-up questions.",
      "It also provides general rights information through a separate question-and-answer workflow. The output is informational and can be incomplete or wrong.",
      "The application does not determine whether a document is legally valid, provide representation, or guarantee legal outcomes.",
    ],
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "What the application does and does not do.",
    items: [
      ["What files can I upload?", "The backend accepts files with a .pdf filename up to 10 MiB and checks the PDF signature. It extracts selectable text; image-only scans may not produce usable text."],
      ["What is stored?", "The PDF is temporarily written to the backend's local uploads directory during processing, and cleanup is attempted afterward. Firestore stores the filename and generated analysis. Cleanup is best-effort."],
      ["Does deleting a document erase every copy?", "The delete action removes the Firestore document record, including its saved analysis. It does not control copies already sent to the configured AI provider or guarantee removal of local remnants if cleanup failed."],
      ["Are the results legal advice?", "No. Results are AI-generated general information and preliminary review signals. Verify the source document and consult a qualified legal professional for decisions."],
      ["Do evidence excerpts prove a finding?", "The backend checks whether a short excerpt occurs exactly in extracted text. That confirms text presence only, not that the AI interpretation is legally correct."],
    ],
  },
  privacy: {
    eyebrow: "Privacy and processing",
    title: "Know what happens to a document before you upload it.",
    paragraphs: [
      "When you upload a PDF, the backend temporarily writes it to its local uploads directory, extracts text, and sends that text to the configured Google Gemini service for analysis. Cleanup of the local file is attempted when processing finishes; the code does not guarantee cleanup after a process crash or filesystem error.",
      "The application stores your filename and AI-generated analysis in Firestore under your user ID. The document delete action removes that Firestore record. The current application has no chat-history or account deletion route.",
      "The application does not control or verify the AI provider's retention practices. Do not submit a document unless you are authorized to share it. Avoid uploading highly sensitive documents unless you understand the relevant provider and deployment policies.",
    ],
  },
};

export function InformationPage({ page, authenticated }) {
  const content = INFO_CONTENT[page] || INFO_CONTENT.about;
  return (
    <PublicLayout authenticated={authenticated}>
      <main className="page-width info-page">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        {content.paragraphs?.map((paragraph) => <p className="info-lede" key={paragraph}>{paragraph}</p>)}
        {content.items && (
          <div className="faq-list">
            {content.items.map(([question, answer]) => (
              <details key={question}><summary>{question}</summary><p>{answer}</p></details>
            ))}
          </div>
        )}
        <a className="button" href={authenticated ? "#/app/dashboard" : "#/signup"}>{authenticated ? "Open workspace" : "Get started"}</a>
      </main>
    </PublicLayout>
  );
}

export function AuthPage({
  mode,
  name,
  email,
  password,
  confirmPassword,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  error,
  message,
  busy,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  return (
    <PublicLayout authenticated={false}>
      <main className="auth-layout page-width">
        <section className="auth-aside">
          <p className="eyebrow">Your review workspace</p>
          <h1>{isSignup ? "Create your account." : "Welcome back."}</h1>
          <p>Save document analysis and rights-assistant history to your account. AI output remains informational and should be verified.</p>
          <div className="auth-aside-note"><strong>Before uploading</strong><p>PDF text is processed by the configured AI service. See the <a href="#/privacy">privacy details</a>.</p></div>
        </section>
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <p className="eyebrow">{isSignup ? "Get started" : "Account access"}</p>
          <h2 id="auth-title">{isSignup ? "Create account" : "Sign in"}</h2>
          <form onSubmit={onSubmit} aria-busy={busy}>
            {isSignup && <div className="form-field"><label htmlFor="account-name">Name</label><input id="account-name" autoComplete="name" value={name} onChange={(event) => onNameChange(event.target.value)} required /></div>}
            <div className="form-field"><label htmlFor="account-email">Email</label><input id="account-email" type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required /></div>
            <div className="form-field"><label htmlFor="account-password">Password</label><div className="password-control"><input id="account-password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 6 : undefined} value={password} onChange={(event) => onPasswordChange(event.target.value)} required /><button className="password-toggle" type="button" aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div>{isSignup && <small>Use at least 6 characters.</small>}</div>
            {isSignup && <div className="form-field"><label htmlFor="account-confirm-password">Confirm password</label><input id="account-confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} required /></div>}
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            {message && <p className="notice notice-success" role="status">{message}</p>}
            <button className="button button-full" type="submit" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</button>
          </form>
          <p className="auth-switch">{isSignup ? "Already registered?" : "New to NyayaSetu?"} <a href={isSignup ? "#/login" : "#/signup"}>{isSignup ? "Sign in" : "Create an account"}</a></p>
        </section>
      </main>
    </PublicLayout>
  );
}

export function AppShell({ page, title, profile, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ["/app/dashboard", "Overview", "01"],
    ["/app/analyze", "Analyze a document", "02"],
    ["/app/documents", "Document library", "03"],
    ["/app/assistant", "Rights assistant", "04"],
    ["/app/history", "Chat history", "05"],
    ["/app/profile", "Account", "06"],
  ];
  return (
    <div className="app-frame">
      <aside className={`app-sidebar${menuOpen ? " is-open" : ""}`}>
        <Brand light />
        <p className="sidebar-caption">WORKSPACE</p>
        <nav className="app-nav" aria-label="Workspace navigation">
          {links.map(([href, label, number]) => (
            <a key={href} href={`#${href}`} aria-current={page === href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              <span className="nav-number">{number}</span>{label}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>General information, not legal advice.</p>
          <button className="sidebar-logout" type="button" onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <div className="app-main-column">
        <header className="app-header">
          <button className="menu-toggle app-menu-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
          <div><p className="header-kicker">NYAYASETU AI</p><h1>{title}</h1></div>
          <a className="header-account" href="#/app/profile"><span className="account-avatar">{(profile?.name || profile?.email || "U").slice(0, 1).toUpperCase()}</span><span>{profile?.name || profile?.email || "Account"}</span></a>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export function Notice({ kind = "info", children, onDismiss }) {
  return <div className={`notice notice-${kind}`} role={kind === "error" ? "alert" : "status"}><div>{children}</div>{onDismiss && <button type="button" className="notice-dismiss" onClick={onDismiss} aria-label="Dismiss message">×</button>}</div>;
}

export function PageHeading({ eyebrow, title, children, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children && <p className="page-intro">{children}</p>}</div>{action}</div>;
}

function EvidenceFindings({ findings }) {
  if (!Array.isArray(findings) || findings.length === 0) return null;
  return (
    <section className="analysis-section">
      <div className="analysis-section-heading"><div><p className="eyebrow">SOURCE CHECK</p><h3>Evidence and review</h3></div><span className="text-tag">Text match ≠ legal validation</span></div>
      <div className="evidence-list">
        {findings.map((item, index) => (
          <article className="evidence-item" key={`${item.finding_type || "finding"}-${index}`}>
            <div className="evidence-item-meta"><strong>{item.finding_type || "Finding"}</strong><span className={item.evidence_verified ? "verification-tag is-verified" : "verification-tag"}>{item.evidence_verified ? "Exact excerpt found" : "Unverified"}</span></div>
            {item.finding && <p className="evidence-finding-text">{item.finding}</p>}
            {item.evidence_verified && item.evidence_text ? <blockquote>{item.evidence_text}</blockquote> : <p className="muted-copy">{item.explanation || "No exact supporting excerpt was verified in the extracted text."}</p>}
            {item.evidence_verified && item.explanation && <p>{item.explanation}</p>}
            {item.review_action && <p className="review-action"><strong>Review:</strong> {item.review_action}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

export function DocumentAnalysisView({ analysis, filename }) {
  if (!analysis || typeof analysis !== "object") return <Notice kind="error">Analysis data is unavailable or malformed.</Notice>;
  const lists = [
    ["Important clauses", asList(analysis.important_clauses)],
    ["Rights", asList(analysis.rights)],
    ["Obligations", asList(analysis.obligations)],
    ["General risk notes", asList(analysis.risks)],
    ["Important dates", asList(analysis.important_dates)],
  ];
  return (
    <div className="analysis-view">
      {isLegacyAnalysis(analysis) && <Notice kind="warning"><strong>Legacy analysis — evidence not verified.</strong> Existing clauses and risks are shown for reference; the source PDF text is not available to re-check them.</Notice>}
      <header className="analysis-title-row"><div><p className="eyebrow">DOCUMENT ANALYSIS</p><h2>{analysis.document_type || "Document analysis"}</h2>{filename && <p className="muted-copy">{filename}</p>}</div><span className="analysis-tag">Preliminary AI review</span></header>
      {analysis.summary && <section className="summary-panel"><p className="eyebrow">SUMMARY</p><p>{analysis.summary}</p></section>}
      <EvidenceFindings findings={analysis.evidence_findings} />
      {lists.map(([title, values]) => values.length > 0 && (
        <section className="analysis-section" key={title}><div className="analysis-section-heading"><div><p className="eyebrow">DOCUMENT TEXT REVIEW</p><h3>{title}</h3></div></div><ul className="analysis-list">{values.map((value, index) => <li key={`${title}-${index}`}>{value}</li>)}</ul></section>
      ))}
      {Array.isArray(analysis.clause_risks) && analysis.clause_risks.length > 0 && (
        <section className="analysis-section"><div className="analysis-section-heading"><div><p className="eyebrow">PRELIMINARY SCREENING</p><h3>Clause risk radar</h3></div><span className="text-tag">Not a legal opinion</span></div><div className="risk-list">
          {analysis.clause_risks.map((risk, index) => <article className="risk-item" key={`risk-${index}`}><div className="risk-item-head"><h4>Potential risk {index + 1}</h4><span className={`risk-pill risk-${risk.evidence_verified && risk.severity ? String(risk.severity).toLowerCase() : "unrated"}`}>{risk.evidence_verified && risk.severity ? risk.severity : "Not assessed"}</span></div><p><strong>Supporting excerpt:</strong> {risk.evidence_verified && risk.clause_text ? risk.clause_text : "No exact supporting excerpt was verified in the extracted text."}</p><p><strong>Why review it:</strong> {risk.explanation || "No explanation supplied; review the original wording."}</p>{asList(risk.verification_questions).length > 0 && <div><strong>Questions to clarify</strong><ul>{risk.verification_questions.map((question, qIndex) => <li key={qIndex}>{question}</li>)}</ul></div>}</article>)}
        </div></section>
      )}
      {Array.isArray(analysis.completeness_check) && analysis.completeness_check.length > 0 && (
        <section className="analysis-section"><div className="analysis-section-heading"><div><p className="eyebrow">EXTRACTED TEXT CHECK</p><h3>Potentially missing information</h3></div></div><div className="completeness-list">
          {analysis.completeness_check.map((item, index) => <article className="completeness-item" key={`complete-${index}`}><div className="risk-item-head"><h4>{item.field_name || "Document field"}</h4><span className={`completeness-pill completeness-${String(item.status || "Needs Review").toLowerCase().replace(/\s+/g, "-")}`}>{item.status === "Not Found" ? "Not found in extracted text" : item.status || "Needs Review"}</span></div><p>{item.explanation || "No explanation was supplied."}</p>{item.evidence_verified && item.evidence_text && <blockquote>{item.evidence_text}</blockquote>}</article>)}
        </div><p className="muted-copy">Not found in extracted text does not establish that information is absent from the original PDF. This is not a legal-validity determination.</p></section>
      )}
      {analysis.disclaimer && <p className="analysis-disclaimer">{analysis.disclaimer}</p>}
    </div>
  );
}

export function DashboardPage({ profile, documents, chats, documentsLoading, chatsLoading, navigate }) {
  const recentDocuments = documents.slice(0, 3);
  const recentChats = chats.slice(0, 3);
  return (
    <div className="page-stack">
      <section className="dashboard-welcome"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>Welcome{profile?.name ? `, ${profile.name}` : ""}.</h2><p>Review documents and general rights information in one place.</p></div><a className="button" href="#/app/analyze">Analyze a document</a></section>
      <section className="metric-grid" aria-label="Workspace activity"><article><span>DOCUMENTS</span><strong>{documentsLoading ? "—" : documents.length}</strong><small>Saved analyses</small></article><article><span>QUESTIONS</span><strong>{chatsLoading ? "—" : chats.length}</strong><small>Rights assistant history</small></article><article><span>ACCOUNT</span><strong className="metric-account">{profile?.name || "Active"}</strong><small>{profile?.email || "Signed in"}</small></article></section>
      <div className="dashboard-columns">
        <section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">DOCUMENT LIBRARY</p><h3>Recent documents</h3></div><a href="#/app/documents">View all</a></div>{documentsLoading ? <p className="state-copy">Loading documents…</p> : recentDocuments.length === 0 ? <div className="empty-state"><strong>No saved analyses yet</strong><p>Upload a text-based PDF to begin a review.</p><a className="text-link" href="#/app/analyze">Go to document analysis →</a></div> : <ul className="recent-list">{recentDocuments.map((doc) => <li key={doc.id}><button className="list-link" type="button" onClick={() => navigate(`/app/documents/${encodeURIComponent(doc.id)}`)}><span><strong>{doc.filename || "Untitled document"}</strong><small>{doc.analysis?.document_type || "Analysis"}</small></span><span aria-hidden="true">→</span></button></li>)}</ul>}</section>
        <section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">RIGHTS ASSISTANT</p><h3>Recent questions</h3></div><a href="#/app/history">View history</a></div>{chatsLoading ? <p className="state-copy">Loading history…</p> : recentChats.length === 0 ? <div className="empty-state"><strong>No questions yet</strong><p>Ask for general information and possible next steps.</p><a className="text-link" href="#/app/assistant">Ask a question →</a></div> : <ul className="recent-list">{recentChats.map((chat) => <li key={chat.id}><a className="list-link" href={`#/app/history/${encodeURIComponent(chat.id)}`}><span><strong>{chat.question || "Rights question"}</strong><small>{chat.createdAt ? new Date(chat.createdAt).toLocaleDateString() : "Saved conversation"}</small></span><span aria-hidden="true">→</span></a></li>)}</ul>}</section>
      </div>
    </div>
  );
}

export function UploadPage({ file, fileInputRef, onChooseFile, onDropFile, onUpload, uploading, analysis, notice, clearNotice }) {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="DOCUMENT REVIEW" title="Analyze a document">The application extracts PDF text, requests AI analysis, checks evidence excerpts, and saves the resulting analysis to your account.</PageHeading>
      {notice && <Notice kind={notice.kind} onDismiss={clearNotice}>{notice.text}</Notice>}
      <section className="upload-workspace">
        <div className="upload-main">
          <div className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onDropFile(event.dataTransfer.files?.[0]); }}>
            <span className="upload-symbol" aria-hidden="true">PDF</span>
            <h3>Choose a PDF to review</h3>
            <p>Text-based PDF, up to 10 MiB. Scanned files may not contain extractable text.</p>
            <input ref={fileInputRef} id="document-file" className="visually-hidden" type="file" accept=".pdf,application/pdf" onChange={(event) => onChooseFile(event.target.files?.[0])} aria-describedby="upload-guidance" />
            <label className="button button-secondary" htmlFor="document-file">Browse files</label>
            <p id="upload-guidance" className="drop-guidance">or drag a PDF into this area</p>
            {file && <div className="selected-file"><span><strong>{file.name}</strong><small>{(file.size / (1024 * 1024)).toFixed(2)} MiB</small></span><button type="button" className="text-button" onClick={() => onChooseFile(null)}>Remove</button></div>}
            <button className="button" type="button" onClick={onUpload} disabled={!file || uploading} aria-busy={uploading}>{uploading ? "Analyzing document…" : "Upload and analyze"}</button>
            {uploading && <p className="state-copy" role="status">Processing PDF text and generating analysis. Keep this page open.</p>}
          </div>
          <aside className="privacy-panel"><p className="eyebrow">PROCESSING AND STORAGE</p><h3>Before you upload</h3><p>Extracted text is sent to the configured Google Gemini service. The PDF is temporarily written to the server's local uploads directory; cleanup is attempted after processing, but failures may leave a local copy.</p><p>Firestore stores the filename and generated analysis with your account. Deleting a document removes that Firestore record only. Provider retention is not controlled by this application.</p><a href="#/privacy">Read full privacy information →</a></aside>
        </div>
      </section>
      {analysis && <section className="content-panel"><DocumentAnalysisView analysis={analysis} filename={file?.name} /></section>}
    </div>
  );
}

export function DocumentsPage({ documents, loading, error, onDelete, navigate }) {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="SAVED ANALYSES" title="Document library" action={<a className="button" href="#/app/analyze">Analyze a document</a>}>Saved filenames and AI-generated analyses associated with your account.</PageHeading>
      {error && <Notice kind="error">{error}</Notice>}
      {loading ? <div className="loading-state" role="status"><span className="spinner" />Loading your documents…</div> : documents.length === 0 ? <section className="empty-state large"><span className="empty-index">01</span><h3>Your library is empty</h3><p>After analysis, saved documents appear here.</p><a className="button button-secondary" href="#/app/analyze">Start a document review</a></section> : <div className="document-table-wrap"><table className="document-table"><thead><tr><th scope="col">Document</th><th scope="col">Type</th><th scope="col">Saved</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id}><td><button className="table-link" type="button" onClick={() => navigate(`/app/documents/${encodeURIComponent(doc.id)}`)}>{doc.filename || "Untitled document"}</button></td><td>{doc.analysis?.document_type || "—"}</td><td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}</td><td><span className="status-dot-label"><i />{doc.status || "Saved"}</span></td><td className="table-actions"><button className="text-button" type="button" onClick={() => navigate(`/app/documents/${encodeURIComponent(doc.id)}`)}>Open</button><button className="text-button destructive-text" type="button" onClick={() => onDelete(doc)}>Delete</button></td></tr>)}</tbody></table></div>}
    </div>
  );
}

function RightsAnswer({ answer }) {
  if (!answer) return null;
  const sections = [
    ["Possible rights", asList(answer.rights)],
    ["Important points", asList(answer.important_points)],
    ["Suggested next steps", asList(answer.action_plan)],
    ["Evidence to consider preserving", asList(answer.evidence_checklist)],
    ["Questions to clarify", asList(answer.questions_to_clarify)],
    ["When to seek help", asList(answer.when_to_seek_help)],
  ];
  return <article className="answer-panel"><p className="eyebrow">GENERAL INFORMATION</p><h3>{answer.situation_summary || "Response"}</h3>{answer.answer && <p className="answer-lede">{answer.answer}</p>}{sections.map(([title, items]) => items.length > 0 && <section className="answer-section" key={title}><h4>{title}</h4><ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul></section>)}{answer.disclaimer && <p className="analysis-disclaimer">{answer.disclaimer}</p>}</article>;
}

export function AssistantPage({ question, setQuestion, onSubmit, loading, answer, notice, clearNotice }) {
  return <div className="page-stack"><PageHeading eyebrow="RIGHTS NAVIGATOR" title="Ask a rights question">Receive general information and possible next steps based on the situation you describe. Responses are not legal advice.</PageHeading>{notice && <Notice kind={notice.kind} onDismiss={clearNotice}>{notice.text}</Notice>}<section className="assistant-layout"><form className="question-form content-panel" onSubmit={onSubmit} aria-busy={loading}><label htmlFor="rights-question">Describe your question</label><textarea id="rights-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1000} rows={5} placeholder="Share the key facts and the jurisdiction if known." required /><div className="form-foot"><small>{question.length}/1000 characters</small><button className="button" type="submit" disabled={loading || !question.trim()}>{loading ? "Preparing response…" : "Get general guidance"}</button></div></form><aside className="privacy-panel"><p className="eyebrow">GOOD TO KNOW</p><h3>Keep the question focused</h3><p>Do not include unnecessary personal identifiers or confidential details. Guidance may depend on facts not provided.</p><p>For urgent danger or time-sensitive legal matters, contact appropriate local services or a qualified professional.</p></aside></section>{loading && <div className="loading-state" role="status"><span className="spinner" />Preparing general information…</div>}{answer && <RightsAnswer answer={answer} />}</div>;
}

export function HistoryPage({ chats, loading, error }) {
  return <div className="page-stack"><PageHeading eyebrow="SAVED QUESTIONS" title="Chat history">Questions and responses saved to your account.</PageHeading>{error && <Notice kind="error">{error}</Notice>}{loading ? <div className="loading-state" role="status"><span className="spinner" />Loading history…</div> : chats.length === 0 ? <section className="empty-state large"><span className="empty-index">04</span><h3>No saved questions</h3><p>Your rights-assistant responses will appear here after you ask a question.</p><a className="button button-secondary" href="#/app/assistant">Ask a question</a></section> : <div className="history-list">{chats.map((chat) => <article className="history-item" key={chat.id}><div><p className="eyebrow">{chat.createdAt ? new Date(chat.createdAt).toLocaleString() : "SAVED RESPONSE"}</p><h3>{chat.question || "Rights question"}</h3><p>{chat.situation_summary || chat.answer || "Response details unavailable."}</p></div><a className="text-link" href={`#/app/history/${encodeURIComponent(chat.id)}`}>Open response →</a></article>)}</div>}</div>;
}

export function ConversationPage({ chat }) {
  if (!chat) return <div className="empty-state large"><h3>Conversation not found</h3><p>This response may have been removed or is not available in the current history.</p><a href="#/app/history" className="text-link">Back to history →</a></div>;
  return <div className="page-stack"><PageHeading eyebrow="SAVED RESPONSE" title={chat.question || "Rights response"} action={<a className="button button-secondary" href="#/app/history">Back to history</a>} /> <RightsAnswer answer={chat} /></div>;
}

export function ProfilePage({ profile, onLogout }) {
  return <div className="page-stack"><PageHeading eyebrow="ACCOUNT" title="Profile">Account information returned by the existing profile endpoint. Editing is not supported here.</PageHeading><section className="profile-panel"><div className="profile-avatar">{(profile?.name || profile?.email || "U").slice(0, 1).toUpperCase()}</div><dl><div><dt>Name</dt><dd>{profile?.name || "Not provided"}</dd></div><div><dt>Email</dt><dd>{profile?.email || "Not provided"}</dd></div><div><dt>Account role</dt><dd>{profile?.role || "User"}</dd></div></dl><button className="button button-secondary" type="button" onClick={onLogout}>Sign out</button></section></div>;
}

export function NotFoundPage({ authenticated }) {
  return <div className="empty-state large"><span className="empty-index">404</span><h2>Page not found</h2><p>This address does not match an available page.</p><a className="button" href={authenticated ? "#/app/dashboard" : "#/"}>Return to {authenticated ? "workspace" : "home"}</a></div>;
}
