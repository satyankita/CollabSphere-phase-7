
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Save, X, FileText } from "lucide-react";

const API_URL = "http://localhost:5000/api/notes";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, getAuthConfig());
      setNotes(response.data);
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
    setMessage("");
  };

  const saveNote = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Please enter a note title.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = { title: title.trim(), content };

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          getAuthConfig()
        );
      } else {
        await axios.post(API_URL, payload, getAuthConfig());
      }

      resetForm();
      await fetchNotes();
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
    setMessage("");
  };

  const deleteNote = async (note) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${note.title}"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/${note._id}`, getAuthConfig());
      setNotes((current) =>
        current.filter((item) => item._id !== note._id)
      );

      if (editingId === note._id) resetForm();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete note.");
    }
  };

  return (
    <section className="notes-page">
      <div className="welcome-section">
        <div>
          <h1>My Notes</h1>
          <p className="page-description">
            Save your ideas, project plans, and important thoughts.
          </p>
        </div>
      </div>

      {message && <p className="notes-message">{message}</p>}

      <div className="notes-layout">
        <form className="notes-editor" onSubmit={saveNote}>
          <div className="notes-editor-heading">
            <h2>{editingId ? "Edit Note" : "Create a Note"}</h2>
            {editingId && (
              <button
                type="button"
                className="icon-button"
                onClick={resetForm}
                title="Cancel editing"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <label htmlFor="noteTitle">Note Title</label>
          <input
            id="noteTitle"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter note title..."
            required
          />

          <label htmlFor="noteContent">Content</label>
          <textarea
            id="noteContent"
            rows={10}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your thoughts here..."
          />

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            <Save size={17} />
            {loading
              ? "Saving..."
              : editingId
              ? "Update Note"
              : "Save Note"}
          </button>
        </form>

        <div className="notes-list-section">
          <div className="section-heading">
            <div>
              <h2>Saved Notes</h2>
              <p>{notes.length} note(s) saved</p>
            </div>
          </div>

          {loading && notes.length === 0 ? (
            <p className="empty-state">Loading notes...</p>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <FileText size={35} />
              <h3>No notes yet</h3>
              <p>Create your first note to get started.</p>
            </div>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <article className="note-card" key={note._id}>
                  <div className="note-card-heading">
                    <h3>{note.title}</h3>

                    <div className="project-actions">
                      <button
                        className="project-action edit-action"
                        onClick={() => editNote(note)}
                        title="Edit note"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="project-action delete-action"
                        onClick={() => deleteNote(note)}
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="note-content">
                    {note.content || "No content added."}
                  </p>

                  <span className="note-date">
                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
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
