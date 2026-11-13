
const express = require("express");
const router = express.Router();

const Activity = require("../models/Activity");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

// Check whether user has access to the project
const checkProjectAccess = async (projectId, userId) => {
  return Project.findOne({
    _id: projectId,
    $or: [
      { owner: userId },
      { members: userId },
    ],
  });
};

// Get activities of a single project
router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await checkProjectAccess(
      req.params.projectId,
      req.userId
    );

    if (!project) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const activities = await Activity.find({
      project: req.params.projectId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all activities of logged-in user (including deleted projects)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId },
      ],
    }).select("_id");

    const projectIds = projects.map((project) => project._id);

    const activities = await Activity.find({
      $or: [
        { project: { $in: projectIds } },
        { user: req.userId },
      ],
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a project activity
router.post("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await checkProjectAccess(
      req.params.projectId,
      req.userId
    );

    if (!project) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const { action, description } = req.body;

    if (!action || !description) {
      return res.status(400).json({
        message: "Action and description are required.",
      });
    }

    const activity = await Activity.create({
      project: req.params.projectId,
      projectName: project.name,
      user: req.userId,
      action,
      description,
    });

    res.status(201).json({ activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
