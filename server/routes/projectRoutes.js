
const express = require("express");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.userId,
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch projects" });
  }
});

// Create project
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || "",
      owner: req.userId,
      members: [req.userId],
    });

    res.status(201).json({
      message: "Project created successfully!",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create project" });
  }
});

// Edit project
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { name: name.trim(), description: description || "" },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    res.json({
      message: "Project updated successfully!",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not update project" });
  }
});

// Delete project
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    res.json({ message: "Project deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete project" });
  }
});

module.exports = router;
