const express = require("express");
const router = express.Router();

const Note = require("../models/Note");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

async function findAccessibleProject(projectId, userId) {
  return Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }],
  });
}

// Project-scoped notes are visible to project members. Personal notes remain
// available through the same API when no projectId is supplied.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.query;
    let filter;

    if (projectId) {
      const project = await findAccessibleProject(projectId, req.userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or access denied" });
      }
      filter = { project: project._id };
    } else {
      filter = { user: req.userId, project: null };
    }

    const notes = await Note.find(filter)
      .populate("user", "name email")
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content = "", projectId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Note title is required" });
    }

    let project = null;
    if (projectId) {
      project = await findAccessibleProject(projectId, req.userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or access denied" });
      }
    }

    const note = await Note.create({
      title: title.trim(),
      content,
      user: req.userId,
      project: project?._id || null,
    });
    await note.populate("user", "name email");
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.project && !(await findAccessibleProject(note.project, req.userId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, content } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: "Note title is required" });
      note.title = title.trim();
    }
    if (content !== undefined) note.content = content;

    await note.save();
    await note.populate("user", "name email");
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.project && !(await findAccessibleProject(note.project, req.userId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    await note.deleteOne();
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
