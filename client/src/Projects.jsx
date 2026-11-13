
import React, { useState } from "react";
import axios from "axios";

function Projects() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateProject = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://collabsphere-api-70ke.onrender.com/api/projects",
        {
          name,
          description,
        }
      );

      alert("Project created successfully!");
      console.log(response.data);

      setName("");
      setDescription("");
    } catch (error) {
      console.error(error);
      alert("Failed to create project");
    }
  };

  return (
    <div className="projects-container">
      <h2>My Projects</h2>

      <form onSubmit={handleCreateProject}>
        <input
          type="text"
          placeholder="Enter project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Project description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <button type="submit">Create Project</button>
      </form>
    </div>
  );
}

export default Projects;
