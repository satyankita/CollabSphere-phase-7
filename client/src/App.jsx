import { useEffect, useState } from "react";
import axios from "axios";
import Auth from "./Auth";
import Notes from "./Notes";

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
  ArrowLeft,
  Upload,
  Download,
  X,
  Activity,
} from "lucide-react";

import "./App.css";

const API_URL = "http://localhost:5000/api/projects";
const AI_API_URL = "http://localhost:5000/api/ai";
const FILE_API_URL = "http://localhost:5000/api/files";

function App() {
  const [active, setActive] = useState("Overview");
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTab, setProjectTab] = useState("Overview");

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
  const [searchTerm, setSearchTerm] = useState("");

  // AI states
  const [aiLoading, setAiLoading] = useState(false);

  const [readmeForm, setReadmeForm] = useState({
    name: "",
    description: "",
    techStack: "",
    features: "",
    installation: "npm install",
  });

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [readmeResult, setReadmeResult] = useState("");
  const [explanationResult, setExplanationResult] = useState("");
  const [aiMessage, setAiMessage] = useState("");

  // Team states
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [teamMessage, setTeamMessage] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);

  // Project file states
  const [projectFiles, setProjectFiles] = useState([]);
  const [fileMessage, setFileMessage] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  // Activity Log states
const [activities, setActivities] = useState([]);
const [activityLoading, setActivityLoading] = useState(false);
const [activityMessage, setActivityMessage] = useState("");
const [activityFilter, setActivityFilter] = useState("all");

  // Authentication config
  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Theme
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch projects
  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  // Fetch members and files when project changes
  useEffect(() => {
    if (selectedProject?._id) {
      fetchMembers();
      setProjectFiles([]);
      setFileMessage("");
      fetchProjectFiles();
    }
  }, [selectedProject?._id]);

  // Get all projects
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

  // Get project members
  const fetchMembers = async () => {
    try {
      setTeamLoading(true);

      const response = await axios.get(
        `${API_URL}/${selectedProject._id}/members`,
        getAuthConfig()
      );

      setMembers(response.data.members || response.data || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);

      setMembers([]);

      setTeamMessage(
        error.response?.data?.message || "Could not load team members."
      );
    } finally {
      setTeamLoading(false);
    }
  };

  // Get project files from backend
  const fetchProjectFiles = async () => {
    if (!selectedProject?._id) return;

    try {
      setFileLoading(true);

      const response = await axios.get(
        `${FILE_API_URL}/${selectedProject._id}`,
        getAuthConfig()
      );

      setProjectFiles(response.data.files || []);
    } catch (error) {
      console.error("Failed to fetch files:", error);

      setFileMessage(
        error.response?.data?.message || "Could not load files."
      );
    } finally {
      setFileLoading(false);
    }
  };

  // Fetch activities from all projects

const fetchActivities = async () => {
  try {
    setActivityLoading(true);
    setActivityMessage("");

    const response = await axios.get(
      "http://localhost:5000/api/activities",
      getAuthConfig()
    );

    const allActivities = (response.data.activities || []).map(
      (activity) => ({
        ...activity,
        projectName: activity.projectName || "Deleted Project",
      })
    );

    setActivities(allActivities);
  } catch (error) {
    console.error("Activity loading failed:", error);

    setActivityMessage(
      error.response?.data?.message || "Could not load activities."
    );
  } finally {
    setActivityLoading(false);
  }
};



// Save a new activity
const logActivity = async (projectId, action, description) => {
  try {
    await axios.post(
      `http://localhost:5000/api/activities/${projectId}`,
      { action, description },
      getAuthConfig()
    );
  } catch (error) {
    console.error("Activity logging failed:", error);
  }
};

  // Create project form
  const openCreateForm = () => {
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setProjectMessage("");
    setShowForm(true);
  };

  // Edit project form
  const openEditForm = (project) => {
    setEditingProject(project);
    setProjectName(project.name || project.title || "");
    setProjectDescription(project.description || "");
    setProjectMessage("");
    setShowForm(true);
  };

  // Close project form
  const closeForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setProjectMessage("");
  };

  // Save project
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

    let projectId;

    if (editingProject) {
      const response = await axios.put(
        `${API_URL}/${editingProject._id}`,
        payload,
        getAuthConfig()
      );

      projectId = editingProject._id;

      await logActivity(
        projectId,
        "project_updated",
        `Updated project: ${payload.name}`
      );
    } else {
      const response = await axios.post(
        API_URL,
        payload,
        getAuthConfig()
      );

      projectId = response.data.project._id;

      await logActivity(
        projectId,
        "project_created",
        `Created project: ${payload.name}`
      );
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

  // Delete project
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

      if (selectedProject?._id === project._id) {
        setSelectedProject(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Could not delete the project.");
    }
  };

  // Open project workspace
  const openProject = (project) => {
    setSelectedProject(project);
    setProjectTab("Overview");
    setTeamMessage("");

    setActive("Projects");

    setReadmeForm({
      name: project.name || project.title || "",
      description: project.description || "",
      techStack: "",
      features: "",
      installation: "npm install",
    });
  };

  // Back to projects
  const goBackToProjects = () => {
    setSelectedProject(null);
    setProjectTab("Overview");
  };

  // Invite team member
const inviteMember = async (event) => {
  event.preventDefault();

  if (!inviteEmail.trim()) return;

  try {
    setTeamLoading(true);
    setTeamMessage("");

    await axios.post(
      `${API_URL}/${selectedProject._id}/invite`,
      { email: inviteEmail.trim() },
      getAuthConfig()
    );

    await logActivity(
      selectedProject._id,
      "member_invited",
      `Invited member: ${inviteEmail.trim()}`
    );

    setInviteEmail("");
    setTeamMessage("Member added successfully!");

    await fetchMembers();
  } catch (error) {
    setTeamMessage(
      error.response?.data?.message || "Could not add member."
    );
  } finally {
    setTeamLoading(false);
  }
};

  
  // Remove team member
const removeMember = async (memberId) => {
  if (!window.confirm("Remove this member from the project?")) return;

  try {
    const member = members.find((item) => item._id === memberId);

    await axios.delete(
      `${API_URL}/${selectedProject._id}/members/${memberId}`,
      getAuthConfig()
    );

    await logActivity(
      selectedProject._id,
      "member_removed",
      `Removed member: ${member?.name || "Team member"}`
    );

    setTeamMessage("Member removed successfully.");

    await fetchMembers();
  } catch (error) {
    setTeamMessage(
      error.response?.data?.message || "Could not remove member."
    );
  }
};

  // Generate README
  const generateReadme = async (event) => {
    event.preventDefault();

    try {
      setAiLoading(true);
      setAiMessage("");
      setReadmeResult("");

      const response = await axios.post(
        `${AI_API_URL}/generate-readme`,
        readmeForm,
        getAuthConfig()
      );

      setReadmeResult(response.data.readme);
    } catch (error) {
      setAiMessage(
        error.response?.data?.message || "README generation failed."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // Explain code
  const explainCode = async (event) => {
    event.preventDefault();

    if (!code.trim()) {
      setAiMessage("Please enter some code first.");
      return;
    }

    try {
      setAiLoading(true);
      setAiMessage("");
      setExplanationResult("");

      const response = await axios.post(
        `${AI_API_URL}/explain-code`,
        { code, language },
        getAuthConfig()
      );

      setExplanationResult(response.data.explanation);
    } catch (error) {
      setAiMessage(
        error.response?.data?.message || "Code explanation failed."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // Upload files to backend
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    try {
      setFileLoading(true);
      setFileMessage("");

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        await axios.post(
          `${FILE_API_URL}/${selectedProject._id}`,
          formData,
          getAuthConfig()
        );
      }

      setFileMessage("Files uploaded successfully!");

      await fetchProjectFiles();
    } catch (error) {
      console.error("File upload failed:", error);

      setFileMessage(
        error.response?.data?.message || "File upload failed."
      );
    } finally {
      setFileLoading(false);
      event.target.value = "";
    }
  };

  // Download file from backend
  const downloadFile = async (file) => {
    try {
      const response = await axios.get(
        `${FILE_API_URL}/download/${file._id}`,
        {
          ...getAuthConfig(),
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (error) {
      console.error("File download failed:", error);

      setFileMessage(
        error.response?.data?.message || "Could not download file."
      );
    }
  };

  // Delete file from backend
  const removeFile = async (fileId) => {
    if (!window.confirm("Delete this file permanently?")) return;

    try {
      await axios.delete(
        `${FILE_API_URL}/${fileId}`,
        getAuthConfig()
      );

      setProjectFiles((current) =>
        current.filter((file) => file._id !== fileId)
      );

      setFileMessage("File deleted successfully.");
    } catch (error) {
      console.error("File deletion failed:", error);

      setFileMessage(
        error.response?.data?.message || "Could not delete file."
      );
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setProjects([]);
    setSelectedProject(null);
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
  { name: "Activity Log", icon: Activity },
  { name: "Settings", icon: SettingsIcon },
];

const filteredActivities =
  activityFilter === "all"
    ? activities
    : activities.filter(
        (activity) => activity.action === activityFilter
      );


  const projectCount = projects.length;

  const filteredProjects = projects.filter((project) =>
    (project.name || project.title || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
                setSelectedProject(null);
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
            Workspace <span>/</span>{" "}
            {selectedProject
              ? selectedProject.name || selectedProject.title
              : active}

            {selectedProject && <span>/ {projectTab}</span>}
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
              {theme === "light" ? (
                <Moon size={19} />
              ) : (
                <Sun size={19} />
              )}
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
          {selectedProject ? (
            <section className="project-workspace">
              <button
                className="settings-button"
                onClick={goBackToProjects}
              >
                <ArrowLeft size={17} /> Back to Projects
              </button>

              <div className="welcome-section">
                <div>
                  <p className="welcome-text">PROJECT WORKSPACE</p>

                  <h1>
                    {selectedProject.name || selectedProject.title}
                  </h1>

                  <p className="page-description">
                    {selectedProject.description ||
                      "No description added yet."}
                  </p>
                </div>

                <span className="project-status">Active</span>
              </div>

              <div className="project-tabs">
                {[
                  { name: "Overview", icon: LayoutDashboard },
                  { name: "Team", icon: Users },
                  { name: "Files", icon: FolderKanban },
                  { name: "Notes", icon: FileText },
                  { name: "AI Tools", icon: Sparkles },
                ].map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    className={`project-tab ${
                      projectTab === name ? "active" : ""
                    }`}
                    onClick={() => setProjectTab(name)}
                  >
                    <Icon size={17} />
                    {name}
                  </button>
                ))}
              </div>

              {/* Project Overview */}
              {projectTab === "Overview" && (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <FolderKanban size={21} />
                      <p>Project Status</p>
                      <h2>Active</h2>
                    </div>

                    <div className="stat-card">
                      <Users size={21} />
                      <p>Team Members</p>
                      <h2>{members.length}</h2>
                    </div>

                    <div className="stat-card">
                      <FileText size={21} />
                      <p>Uploaded Files</p>
                      <h2>{projectFiles.length}</h2>
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-info">
                      <h3>Project Details</h3>

                      <p>
                        <strong>Name:</strong>{" "}
                        {selectedProject.name || selectedProject.title}
                      </p>

                      <p>
                        <strong>Description:</strong>{" "}
                        {selectedProject.description || "No description"}
                      </p>

                      <p>
                        <strong>Project ID:</strong>{" "}
                        {selectedProject._id}
                      </p>
                    </div>

                    <button
                      className="settings-button"
                      onClick={() => openEditForm(selectedProject)}
                    >
                      <Pencil size={16} /> Edit Project
                    </button>
                  </div>

                  <div className="settings-card">
                    <div className="settings-info">
                      <h3>Quick Actions</h3>
                      <p>
                        Manage your team, files, notes and AI tools.
                      </p>
                    </div>

                    <button
                      className="primary-button"
                      onClick={() => setProjectTab("Team")}
                    >
                      Open Team <ArrowUpRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {/* Team Section */}
              {projectTab === "Team" && (
                <section className="workspace-panel">
                  <h2>Team Collaboration</h2>

                  <p className="page-description">
                    Add registered users and manage your project team.
                  </p>

                  <form
                    className="invite-form"
                    onSubmit={inviteMember}
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter registered user's email"
                      value={inviteEmail}
                      onChange={(event) =>
                        setInviteEmail(event.target.value)
                      }
                    />

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={teamLoading}
                    >
                      <Plus size={17} />
                      {teamLoading ? "Adding..." : "Add Member"}
                    </button>
                  </form>

                  {teamMessage && (
                    <p className="form-message">{teamMessage}</p>
                  )}

                  <h3>Project Members</h3>

                  {teamLoading && members.length === 0 ? (
                    <p>Loading members...</p>
                  ) : members.length === 0 ? (
                    <p className="empty-state">
                      No members found.
                    </p>
                  ) : (
                    <div className="member-list">
                      {members.map((member) => (
                        <div className="settings-card" key={member._id}>
                          <div className="avatar">
                            {(member.name || member.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="settings-info">
                            <h3>{member.name || "Member"}</h3>
                            <p>{member.email}</p>
                          </div>

                          {String(member._id) !==
                            String(selectedProject.owner) &&
                            String(member._id) !==
                              String(selectedProject.owner?._id) && (
                              <button
                                className="settings-button"
                                onClick={() =>
                                  removeMember(member._id)
                                }
                              >
                                <Trash2 size={16} /> Remove
                              </button>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Files Section */}
              {projectTab === "Files" && (
                <section className="workspace-panel">
                  <h2>Project Files</h2>

                  <p className="page-description">
                    Upload, download and manage permanent project files.
                  </p>

                  <label className="file-upload-area">
                    <Upload size={28} />

                    <strong>Choose files to upload</strong>

                    <span>Maximum file size: 5 MB per file</span>

                    <input
                      type="file"
                      multiple
                      hidden
                      disabled={fileLoading}
                      onChange={handleFileUpload}
                    />
                  </label>

                  {fileMessage && (
                    <p className="form-message">{fileMessage}</p>
                  )}

                  <h3>Files ({projectFiles.length})</h3>

                  {fileLoading ? (
                    <p>Loading files...</p>
                  ) : projectFiles.length === 0 ? (
                    <p className="empty-state">
                      No files uploaded yet.
                    </p>
                  ) : (
                    <div className="file-list">
                      {projectFiles.map((file) => (
                        <div
                          className="settings-card"
                          key={file._id}
                        >
                          <FileText size={22} />

                          <div className="settings-info">
                            <h3>{file.fileName}</h3>

                            <p>
                              Uploaded on{" "}
                              {new Date(
                                file.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            className="settings-button"
                            onClick={() => downloadFile(file)}
                          >
                            <Download size={16} /> Download
                          </button>

                          <button
                            className="settings-button"
                            onClick={() => removeFile(file._id)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Notes Section */}
              {projectTab === "Notes" && (
                <section className="workspace-panel">
                  <h2>Project Notes</h2>

                  <p className="page-description">
                    Create and manage your Markdown notes.
                  </p>

                  <Notes />
                </section>
              )}

              {/* AI Tools Section */}
              {projectTab === "AI Tools" && (
                <section className="workspace-panel">
                  <h2>Project AI Tools</h2>

                  <p className="page-description">
                    Generate documentation and explain your project code.
                  </p>

                  <AIWorkspace
                    readmeForm={readmeForm}
                    setReadmeForm={setReadmeForm}
                    generateReadme={generateReadme}
                    readmeResult={readmeResult}
                    code={code}
                    setCode={setCode}
                    language={language}
                    setLanguage={setLanguage}
                    explainCode={explainCode}
                    explanationResult={explanationResult}
                    aiLoading={aiLoading}
                    aiMessage={aiMessage}
                  />
                </section>
              )}
            </section>
          ) : (
            <>
              {/* Main Overview */}
              {active === "Overview" && (
                <>
                  <section className="welcome-section">
                    <div>
                      <p className="welcome-text">
                        YOUR DEVELOPER WORKSPACE
                      </p>

                      <h1>
                        Welcome back,{" "}
                        {user.name?.split(" ")[0] || "Developer"}!
                      </h1>

                      <p className="page-description">
                        Build, organize, and collaborate on your projects.
                      </p>
                    </div>

                    <button
                      className="primary-button"
                      onClick={openCreateForm}
                    >
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
                    onOpen={openProject}
                  />
                </>
              )}

              {/* All Projects */}
              {active === "Projects" && (
                <>
                  <section className="welcome-section">
                    <div>
                      <h1>My Projects</h1>

                      <p className="page-description">
                        Manage all your developer projects in one place.
                      </p>
                    </div>

                    <button
                      className="primary-button"
                      onClick={openCreateForm}
                    >
                      <Plus size={18} /> New Project
                    </button>
                  </section>

                  <div className="search-box">
                    <Search size={18} />

                    <input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                    />
                  </div>

                  <ProjectList
                    projects={filteredProjects}
                    loading={loading}
                    onEdit={openEditForm}
                    onDelete={deleteProject}
                    onCreate={openCreateForm}
                    onOpen={openProject}
                  />
                </>
              )}


{active === "Activity Log" && (
  <section className="workspace-panel">
    <div className="section-heading">
      <div>
        <h1>Activity Log</h1>
        <p>Track recent activities across your projects.</p>
      </div>

      <button
        className="settings-button"
        onClick={fetchActivities}
        disabled={activityLoading}
      >
        {activityLoading ? "Refreshing..." : "Refresh"}
      </button>
    </div>

    {activityMessage && (
      <p className="form-message">{activityMessage}</p>
    )}

    <div className="activity-filters">
      <select
        value={activityFilter}
        onChange={(e) => setActivityFilter(e.target.value)}
      >
        <option value="all">All Activities</option>
        <option value="project_created">Project Created</option>
        <option value="project_updated">Project Updated</option>
        <option value="project_deleted">Project Deleted</option>
        <option value="member_invited">Member Invited</option>
        <option value="member_removed">Member Removed</option>
      </select>
    </div>

    {activityLoading ? (
      <p>Loading activities...</p>
    ) : filteredActivities.length === 0 ? (
      <p className="empty-state">
        No activities found for this filter.
      </p>
    ) : (
      <div className="file-list">
        {filteredActivities.map((activity) => (
          <div className="settings-card" key={activity._id}>
            <Activity size={20} />

            <div className="settings-info">
              <div className="activity-title">
                <span className={`activity-badge ${activity.action}`}>
                  {activity.action.replaceAll("_", " ")}
                </span>

                <h3>{activity.description}</h3>
              </div>

              <p>
                {activity.user?.name || "User"} · {activity.projectName}
              </p>

              <p>
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}


              {/* Settings */}
              {active === "Settings" && (
                <section className="settings-page">
                  <h1>Settings</h1>

                  <p>
                    Personalize your CollabSphere workspace.
                  </p>

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
                      <p>
                        {user.email || user.name || "Logged in"}
                      </p>
                    </div>

                    <button
                      className="settings-button"
                      onClick={logout}
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>

                  <div className="settings-card">
                    <div className="settings-info">
                      <h3>Workspace</h3>
                      <p>
                        {projectCount} project(s) in your workspace.
                      </p>
                    </div>

                    <span className="settings-status">Active</span>
                  </div>
                </section>
              )}

              {/* Global Notes */}
              {active === "Notes" && <Notes />}

              {/* Global AI Assistant */}
              {active === "AI Assistant" && (
                <section className="ai-page">
                  <div className="ai-heading">
                    <p className="welcome-text">
                      POWERED BY GEMINI AI
                    </p>

                    <h1>AI Assistant</h1>

                    <p className="page-description">
                      Generate documentation and understand your code with AI.
                    </p>
                  </div>

                  <AIWorkspace
                    readmeForm={readmeForm}
                    setReadmeForm={setReadmeForm}
                    generateReadme={generateReadme}
                    readmeResult={readmeResult}
                    code={code}
                    setCode={setCode}
                    language={language}
                    setLanguage={setLanguage}
                    explainCode={explainCode}
                    explanationResult={explanationResult}
                    aiLoading={aiLoading}
                    aiMessage={aiMessage}
                  />
                </section>
              )}

              {/* Global Team */}
              {active === "Team" && (
                <section className="placeholder-page">
                  <Users size={35} />

                  <h1>Team</h1>

                  <p>
                    Open a project and select its Team tab to manage members.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => setActive("Projects")}
                  >
                    View Projects
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create/Edit Project Modal */}
      {showForm && (
        <div className="modal-overlay">
          <form className="project-form" onSubmit={saveProject}>
            <div className="form-header">
              <div>
                <h2>
                  {editingProject
                    ? "Edit Project"
                    : "Create New Project"}
                </h2>

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
                <X size={19} />
              </button>
            </div>

            <label htmlFor="projectName">Project name</label>

            <input
              id="projectName"
              value={projectName}
              onChange={(event) =>
                setProjectName(event.target.value)
              }
              placeholder="e.g. CampusVoice"
              required
            />

            <label htmlFor="projectDescription">Description</label>

            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(event) =>
                setProjectDescription(event.target.value)
              }
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

// Project List Component
function ProjectList({
  projects,
  loading,
  onEdit,
  onDelete,
  onCreate,
  onOpen,
}) {
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
          onClick={() => onOpen(project)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onOpen(project);
          }}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
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
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(project);
                }}
              >
                <Pencil size={16} />
              </button>

              <button
                className="project-action delete-action"
                title="Delete project"
                aria-label="Delete project"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(project);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <h3>
            {project.name || project.title || "Untitled Project"}
          </h3>

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

// AI Workspace Component
function AIWorkspace({
  readmeForm,
  setReadmeForm,
  generateReadme,
  readmeResult,
  code,
  setCode,
  language,
  setLanguage,
  explainCode,
  explanationResult,
  aiLoading,
  aiMessage,
}) {
  return (
    <>
      {aiMessage && <p className="ai-message">{aiMessage}</p>}

      <div className="ai-grid">
        {/* README Generator */}
        <div className="ai-card">
          <div className="ai-card-icon">
            <FileText size={23} />
          </div>

          <h2>README Generator</h2>

          <p>Create professional project documentation.</p>

          <form onSubmit={generateReadme}>
            <label>Project Name</label>

            <input
              required
              value={readmeForm.name}
              onChange={(e) =>
                setReadmeForm({
                  ...readmeForm,
                  name: e.target.value,
                })
              }
              placeholder="e.g. CollabSphere"
            />

            <label>Description</label>

            <textarea
              required
              rows={3}
              value={readmeForm.description}
              onChange={(e) =>
                setReadmeForm({
                  ...readmeForm,
                  description: e.target.value,
                })
              }
              placeholder="Describe your project..."
            />

            <label>Tech Stack</label>

            <input
              value={readmeForm.techStack}
              onChange={(e) =>
                setReadmeForm({
                  ...readmeForm,
                  techStack: e.target.value,
                })
              }
              placeholder="React, Node.js, MongoDB..."
            />

            <label>Features</label>

            <textarea
              rows={3}
              value={readmeForm.features}
              onChange={(e) =>
                setReadmeForm({
                  ...readmeForm,
                  features: e.target.value,
                })
              }
              placeholder="List your project features..."
            />

            <label>Installation</label>

            <input
              value={readmeForm.installation}
              onChange={(e) =>
                setReadmeForm({
                  ...readmeForm,
                  installation: e.target.value,
                })
              }
            />

            <button
              type="submit"
              className="primary-button"
              disabled={aiLoading}
            >
              {aiLoading ? "Generating..." : "Generate README"}

              <Sparkles size={17} />
            </button>
          </form>

          {readmeResult && (
            <div className="ai-result">
              <div className="ai-result-heading">
                <h3>Generated README</h3>

                <button
                  type="button"
                  className="settings-button"
                  onClick={() =>
                    navigator.clipboard.writeText(readmeResult)
                  }
                >
                  Copy README
                </button>
              </div>

              <pre>{readmeResult}</pre>
            </div>
          )}
        </div>

        {/* Code Explainer */}
        <div className="ai-card">
          <div className="ai-card-icon">
            <Code2 size={23} />
          </div>

          <h2>Code Explainer</h2>

          <p>
            Understand your code in beginner-friendly language.
          </p>

          <form onSubmit={explainCode}>
            <label>Programming Language</label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>JavaScript</option>
              <option>Python</option>
              <option>Java</option>
              <option>C++</option>
              <option>HTML</option>
              <option>CSS</option>
            </select>

            <label>Paste Your Code</label>

            <textarea
              rows={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
            />

            <button
              type="submit"
              className="primary-button"
              disabled={aiLoading}
            >
              {aiLoading ? "Explaining..." : "Explain Code"}

              <Sparkles size={17} />
            </button>
          </form>

          {explanationResult && (
            <div className="ai-result">
              <h3>Code Explanation</h3>

              <div className="code-explanation-result">
                {explanationResult
                  .replace(/^#{1,6}\s*/gm, "")
                  .replace(/\*\*/g, "")
                  .replace(/^\*\s*/gm, "• ")
                  .replace(/^---$/gm, "")}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;