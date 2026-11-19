import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { API_ROOT } from "./api";
import { Pencil, Trash2, Save, X, FileText, Sparkles, Bold, Italic, Heading, Code2, List } from "lucide-react";

function Notes({ projectId, projectName, onNotesChange }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiAction, setAiAction] = useState("");
  const contentRef = useRef(null);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = projectId ? { projectId } : undefined;
      const response = await axios.get(`${API_ROOT}/notes`, { ...getAuthConfig(), params });
      setNotes(Array.isArray(response.data) ? response.data : []);
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
    setAiResult("");
    setAiAction("");
    setPreview(false);
    setMessage("");
  };

  const saveNote = async (event) => {
    event.preventDefault();
    if (!title.trim()) return setMessage("Please enter a note title.");

    try {
      setLoading(true);
      setMessage("");
      const payload = { title: title.trim(), content, ...(projectId ? { projectId } : {}) };
      if (editingId) {
        await axios.put(`${API_ROOT}/notes/${editingId}`, payload, getAuthConfig());
      } else {
        await axios.post(`${API_ROOT}/notes`, payload, getAuthConfig());
      }
      resetForm();
      await fetchNotes();
      if (projectId && onNotesChange) await onNotesChange();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save note.");
    } finally {
      setLoading(false);
    }
  };

  const editNote = (note) => {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content || "");
    setAiResult("");
    setPreview(false);
    setMessage("");
  };

  const deleteNote = async (note) => {
    if (!window.confirm(`Are you sure you want to delete "${note.title}"?`)) return;
    try {
      await axios.delete(`${API_ROOT}/notes/${note._id}`, getAuthConfig());
      setNotes((current) => current.filter((item) => item._id !== note._id));
      if (editingId === note._id) resetForm();
      if (projectId && onNotesChange) await onNotesChange();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete note.");
    }
  };

  const insertMarkdown = (before, after = before) => {
    const field = contentRef.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = content.slice(start, end) || "text";
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const runNoteAI = async (action) => {
    if (!content.trim()) return setMessage("Write some note content first.");
    try {
      setAiLoading(true);
      setMessage("");
      setAiAction(action);
      setAiResult("");
      const response = await axios.post(`${API_ROOT}/gemini/explain`, {
        content,
        action,
      }, getAuthConfig());
      setAiResult(response.data.explanation || response.data.result || "");
    } catch (error) {
      setMessage(error.response?.data?.message || "Gemini could not process this note.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="notes-page">
      <div className="welcome-section">
        <div>
          <h1>{projectId ? `${projectName || "Project"} Notes` : "My Notes"}</h1>
          <p className="page-description">
            {projectId ? "Markdown notes shared with this project team." : "Save your ideas, plans, and important thoughts."}
          </p>
        </div>
      </div>

      {message && <p className="notes-message" role="status">{message}</p>}

      <div className="notes-layout">
        <form className="notes-editor" onSubmit={saveNote}>
          <div className="notes-editor-heading">
            <h2>{editingId ? "Edit Note" : "Create a Note"}</h2>
            {editingId && <button type="button" className="icon-button" onClick={resetForm} title="Cancel editing"><X size={18} /></button>}
          </div>

          <label htmlFor="noteTitle">Note Title</label>
          <input id="noteTitle" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter note title..." required />

          <label htmlFor="noteContent">Markdown Content</label>
          <div className="markdown-toolbar" role="toolbar" aria-label="Markdown formatting">
            <button type="button" title="Bold" onClick={() => insertMarkdown("**")}><Bold size={15} /></button>
            <button type="button" title="Italic" onClick={() => insertMarkdown("*")}><Italic size={15} /></button>
            <button type="button" title="Heading" onClick={() => insertMarkdown("## ", "")}><Heading size={15} /></button>
            <button type="button" title="Inline code" onClick={() => insertMarkdown("`")}><Code2 size={15} /></button>
            <button type="button" title="List item" onClick={() => insertMarkdown("- ", "")}><List size={15} /></button>
            <button type="button" className={preview ? "active-tab" : ""} onClick={() => setPreview((value) => !value)}>{preview ? "Edit" : "Preview"}</button>
          </div>

          {preview ? (
            <div className="markdown-preview" aria-live="polite">
              {content.trim() ? <ReactMarkdown>{content}</ReactMarkdown> : <p>Nothing to preview yet.</p>}
            </div>
          ) : (
            <textarea ref={contentRef} id="noteContent" rows={10} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your note in Markdown..." />
          )}

          <div className="note-ai-actions">
            <button type="button" className="settings-button" disabled={aiLoading} onClick={() => runNoteAI("explain-note")}>
              <Sparkles size={16} /> {aiLoading && aiAction === "explain-note" ? "Explaining..." : "Explain this note"}
            </button>
            <button type="button" className="settings-button" disabled={aiLoading} onClick={() => runNoteAI("improve-note")}>
              <Sparkles size={16} /> {aiLoading && aiAction === "improve-note" ? "Suggesting..." : "Suggest improvements"}
            </button>
          </div>

          {aiResult && <div className="ai-result markdown-preview"><ReactMarkdown>{aiResult}</ReactMarkdown></div>}

          <button type="submit" className="primary-button" disabled={loading}>
            <Save size={17} /> {loading ? "Saving..." : editingId ? "Update Note" : "Save Note"}
          </button>
        </form>

        <div className="notes-list-section">
          <div className="section-heading"><div><h2>{projectId ? "Project Notes" : "Saved Notes"}</h2><p>{notes.length} note(s) saved</p></div></div>
          {loading && notes.length === 0 ? <p className="empty-state">Loading notes...</p> : notes.length === 0 ? (
            <div className="empty-state"><FileText size={35} /><h3>No notes yet</h3><p>Create the first note to get started.</p></div>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <article className="note-card" key={note._id}>
                  <div className="note-card-heading"><h3>{note.title}</h3><div className="project-actions">
                    <button className="project-action edit-action" onClick={() => editNote(note)} title="Edit note"><Pencil size={16} /></button>
                    <button className="project-action delete-action" onClick={() => deleteNote(note)} title="Delete note"><Trash2 size={16} /></button>
                  </div></div>
                  <div className="note-content markdown-preview"><ReactMarkdown>{note.content || "No content added."}</ReactMarkdown></div>
                  {projectId && <small>{note.user?.name || note.user?.email || "Project member"}</small>}
                  <span className="note-date">Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Notes;
