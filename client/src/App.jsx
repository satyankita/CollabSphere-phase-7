
import { useEffect, useState } from "react";
import axios from "axios";
import Auth from "./Auth";

import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Sparkles,
  Settings as SettingsIcon,
  Plus,
  Search,
  Bell,
  Code2,
  Users,
  ArrowUpRight,
  Pencil,
  Trash2,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

import "./App.css";

const API_URL = "http://localhost:5000/api/projects";

function App() {
  const [active, setActive] = useState("Overview");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectMessage, setProjectMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, getAuthConfig());
      setProjects(
        Array.isArray(response.data)
          ? response.data
          : response.data.projects || []
      );
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjectMessage(
        error.response?.data?.message || "Could not load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setProjectMessage("");
    setShowForm(true);
  };

  const openEditForm = (project) => {
    setEditingProject(project);
    setProjectName(project.name || project.title || "");
    setProjectDescription(project.description || "");
    setProjectMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setProjectMessage("");
  };

  const saveProject = async (event) => {
    event.preventDefault();

    if (!projectName.trim()) {
      setProjectMessage("Please enter a project name.");
      return;
    }

    try {
      setLoading(true);
      setProjectMessage("");

      const payload = {
        name: projectName.trim(),
        description: projectDescription.trim(),
      };

      if (editingProject) {
        await axios.put(
          `${API_URL}/${editingProject._id}`,
          payload,
          getAuthConfig()
        );
      } else {
        await axios.post(API_URL, payload, getAuthConfig());
      }

      closeForm();
      await fetchProjects();
    } catch (error) {
      setProjectMessage(
        error.response?.data?.message || "Could not save the project."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name || project.title}"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/${project._id}`, getAuthConfig());
      setProjects((current) =>
        current.filter((item) => item._id !== project._id)
      );
    } catch (error) {
      alert(
        error.response?.data?.message || "Could not delete the project."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setProjects([]);
    setActive("Overview");
    closeForm();
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Projects", icon: FolderKanban },
    { name: "Notes", icon: FileText },
    { name: "AI Assistant", icon: Sparkles },
    { name: "Team", icon: Users },
    { name: "Settings", icon: SettingsIcon },
  ];

  const projectCount = projects.length;

  return (
    <div className={`app-shell ${theme}-theme`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Code2 size={23} />
          </div>
          <div>
            <h2>CollabSphere</h2>
            <span>Developer workspace</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${active === name ? "active" : ""}`}
              onClick={() => {
                setActive(name);
                closeForm();
              }}
            >
              <Icon size={18} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <strong>{user.name || "Developer"}</strong>
              <span>{user.email || "Workspace member"}</span>
            </div>
            <button
              className="icon-button"
              title="Log out"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {active}
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              title="Switch theme"
              onClick={() =>
                setTheme((current) =>
                  current === "light" ? "dark" : "light"
                )
              }
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>

            <button className="icon-button" title="Notifications">
              <Bell size={19} />
            </button>

            <div className="topbar-avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page">
          {active === "Overview" && (
            <>
              <section className="welcome-section">
                <div>
                  <p className="welcome-text">YOUR DEVELOPER WORKSPACE</p>
                  <h1>
                    Welcome back, {user.name?.split(" ")[0] || "Developer"}!
                  </h1>
                  <p className="page-description">
                    Build, organize, and collaborate on your projects.
                  </p>
                </div>

                <button className="primary-button" onClick={openCreateForm}>
                  <Plus size={18} /> New Project
                </button>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FolderKanban size={21} />
                  </div>
                  <p>Total Projects</p>
                  <h2>{projectCount}</h2>
                  <span>Your workspace projects</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={21} />
                  </div>
                  <p>Team Collaboration</p>
                  <h2>Ready</h2>
                  <span>Work together in one place</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Sparkles size={21} />
                  </div>
                  <p>AI Assistant</p>
                  <h2>Available</h2>
                  <span>AI tools for your workflow</span>
                </div>
              </section>

              <section className="section-heading">
                <div>
                  <h2>Recent Projects</h2>
                  <p>Continue working on your projects.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setActive("Projects")}
                >
                  View all <ArrowUpRight size={16} />
                </button>
              </section>

              <ProjectList
                projects={projects.slice(0, 3)}
                loading={loading}
                onEdit={openEditForm}
                onDelete={deleteProject}
                onCreate={openCreateForm}
              />
            </>
          )}

          {active === "Projects" && (
            <>
              <section className="welcome-section">
                <div>
                  <h1>My Projects</h1>
                  <p className="page-description">
                    Manage all your developer projects in one place.
                  </p>
                </div>

                <button className="primary-button" onClick={openCreateForm}>
                  <Plus size={18} /> New Project
                </button>
              </section>

              <div className="search-box">
                <Search size={18} />
                <input
                  placeholder="Search projects..."
                  onChange={(event) => {
                    const value = event.target.value.toLowerCase();
                    document.querySelectorAll("[data-project-name]").forEach(
                      (element) => {
                        element.style.display = element.dataset.projectName
                          .toLowerCase()
                          .includes(value)
                          ? ""
                          : "none";
                      }
                    );
                  }}
                />
              </div>

              <ProjectList
                projects={projects}
                loading={loading}
                onEdit={openEditForm}
                onDelete={deleteProject}
                onCreate={openCreateForm}
              />
            </>
          )}

          {active === "Settings" && (
            <section className="settings-page">
              <h1>Settings</h1>
              <p>Personalize your CollabSphere workspace.</p>

              <div className="settings-card">
                <div className="settings-info">
                  <h3>Appearance</h3>
                  <p>Choose the theme you prefer.</p>
                </div>

                <div className="theme-options">
                  <button
                    className={`theme-option ${
                      theme === "light" ? "selected" : ""
                    }`}
                    onClick={() => setTheme("light")}
                  >
                    <Sun size={17} /> Light
                  </button>

                  <button
                    className={`theme-option ${
                      theme === "dark" ? "selected" : ""
                    }`}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon size={17} /> Dark
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-info">
                  <h3>Account</h3>
                  <p>{user.email || user.name || "Logged in"}</p>
                </div>

                <button className="settings-button" onClick={logout}>
                  <LogOut size={16} /> Log out
                </button>
              </div>

              <div className="settings-card">
                <div className="settings-info">
                  <h3>Workspace</h3>
                  <p>{projectCount} project(s) in your workspace.</p>
                </div>
                <span className="settings-status">Active</span>
              </div>
            </section>
          )}

          {active === "Notes" && (
            <section className="placeholder-page">
              <FileText size={35} />
              <h1>Notes</h1>
              <p>Keep your project ideas and notes organized here.</p>
            </section>
          )}

          {active === "AI Assistant" && (
            <section className="placeholder-page">
              <Sparkles size={35} />
              <h1>AI Assistant</h1>
              <p>Your AI-powered developer assistant will be available here.</p>
            </section>
          )}

          {active === "Team" && (
            <section className="placeholder-page">
              <Users size={35} />
              <h1>Team</h1>
              <p>Team collaboration features will be available here.</p>
            </section>
          )}
        </div>
      </main>

      {showForm && (
        <div className="modal-overlay">
          <form className="project-form" onSubmit={saveProject}>
            <div className="form-header">
              <div>
                <h2>{editingProject ? "Edit Project" : "Create New Project"}</h2>
                <p>
                  {editingProject
                    ? "Update your project details."
                    : "Add a new project to your workspace."}
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <label htmlFor="projectName">Project name</label>
            <input
              id="projectName"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="e.g. CampusVoice"
              required
            />

            <label htmlFor="projectDescription">Description</label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(event) => setProjectDescription(event.target.value)}
              placeholder="What is this project about?"
              rows={4}
            />

            {projectMessage && (
              <p className="form-message">{projectMessage}</p>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="settings-button secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingProject
                  ? "Save Changes"
                  : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ProjectList({ projects, loading, onEdit, onDelete, onCreate }) {
  if (loading && projects.length === 0) {
    return <p className="empty-state">Loading projects...</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <FolderKanban size={35} />
        <h3>No projects yet</h3>
        <p>Create your first project to get started.</p>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={17} /> Create Project
        </button>
      </div>
    );
  }

  return (
    <section className="projects-grid">
      {projects.map((project) => (
        <article
          className="project-card"
          key={project._id}
          data-project-name={project.name || project.title || ""}
        >
          <div className="project-card-top">
            <div className="project-icon">
              <Code2 size={22} />
            </div>

            <div className="project-actions">
              <button
                className="project-action edit-action"
                title="Edit project"
                aria-label="Edit project"
                onClick={() => onEdit(project)}
              >
                <Pencil size={16} />
              </button>

              <button
                className="project-action delete-action"
                title="Delete project"
                aria-label="Delete project"
                onClick={() => onDelete(project)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <h3>{project.name || project.title || "Untitled Project"}</h3>
          <p className="project-description">
            {project.description || "No description added yet."}
          </p>

          <div className="project-card-footer">
            <span className="project-status">Active</span>
            <span className="project-open">
              <ArrowUpRight size={17} />
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}

export default App;
