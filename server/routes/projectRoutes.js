const express = require("express");
const crypto = require("crypto");
const Project = require("../models/Project");
const User = require("../models/User");
const Note = require("../models/Note");
const File = require("../models/File");
const authMiddleware = require("../middleware/authMiddleware");
const Activity = require("../models/Activity");

const router = express.Router();

// Public, read-only project data for an unguessable share token.
router.get("/public/:token", async (req, res) => {
  try {
    const project = await Project.findOne({ shareToken: req.params.token })
      .select("name description createdAt");
    if (!project) return res.status(404).json({ message: "Shared project not found" });

    const [notes, files] = await Promise.all([
      Note.find({ project: project._id })
        .select("title content updatedAt")
        .sort({ updatedAt: -1 }),
      File.find({ project: project._id })
        .select("fileName mimeType size createdAt")
        .sort({ createdAt: -1 }),
    ]);

    res.json({ project, notes, files });
  } catch (error) {
    res.status(500).json({ message: "Could not load shared project" });
  }
});

// Get all projects for logged-in user
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

// Create or revoke the public read-only share link. Only the owner can manage it.
router.post("/:id/share", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
    if (!project) {
      return res.status(404).json({ message: "Project not found or you are not the owner" });
    }

    if (req.body.enabled === false) {
      project.shareToken = undefined;
      await project.save();
      return res.json({ enabled: false });
    }

    if (!project.shareToken) {
      project.shareToken = crypto.randomBytes(24).toString("hex");
      await project.save();
    }
    res.json({ enabled: true, token: project.shareToken });
  } catch (error) {
    res.status(500).json({ message: "Could not update share link" });
  }
});

// Notes and uploaded file counts by project member.
router.get("/:id/contributions", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ owner: req.userId }, { members: req.userId }],
    });
    if (!project) return res.status(404).json({ message: "Project not found or access denied" });

    const members = await User.find({ _id: { $in: project.members } }).select("name email");
    const contributions = await Promise.all(members.map(async (member) => {
      const [notesCreated, filesUploaded] = await Promise.all([
        Note.countDocuments({ project: project._id, user: member._id }),
        File.countDocuments({ project: project._id, uploadedBy: member._id }),
      ]);
      return {
        member: { _id: member._id, name: member.name, email: member.email },
        notesCreated,
        filesUploaded,
      };
    }));

    res.json({ contributions });
  } catch (error) {
    res.status(500).json({ message: "Could not load contribution analytics" });
  }
});


// Delete project
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    // Save activity before deleting the project
    await Activity.create({
      project: project._id,
      projectName: project.name,
      user: req.userId,
      action: "project_deleted",
      description: `Deleted project: ${project.name}`,
    });

    // Delete project
    await Project.findByIdAndDelete(project._id);

    res.json({
      message: "Project deleted successfully!",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      message: "Could not delete project",
    });
  }
});

// Get project team members
router.get("/:id/members", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      members: req.userId,
    }).populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project.members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add an existing registered user by email
router.post("/:id/invite", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    const invitedUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!invitedUser) {
      return res.status(404).json({
        message: "No registered user found with this email",
      });
    }

    if (project.members.some(
      (member) => member.toString() === invitedUser._id.toString()
    )) {
      return res.status(400).json({
        message: "User is already a project member",
      });
    }

    project.members.push(invitedUser._id);
    await project.save();

    res.json({
      message: `${invitedUser.name} added to the project successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove a team member
router.delete("/:id/members/:userId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    if (req.params.userId === req.userId.toString()) {
      return res.status(400).json({
        message: "Project owner cannot be removed",
      });
    }

    const originalLength = project.members.length;

    project.members = project.members.filter(
      (member) => member.toString() !== req.params.userId
    );

    if (project.members.length === originalLength) {
      return res.status(404).json({
        message: "Team member not found",
      });
    }

    await project.save();

    res.json({ message: "Team member removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
