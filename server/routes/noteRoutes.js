
const express = require("express");
const router = express.Router();

const Note = require("../models/Note");
const authMiddleware = require("../middleware/authMiddleware");

// Get all notes
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.userId }).sort({
      updatedAt: -1,
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create note
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Note title is required",
      });
    }

    const note = await Note.create({
      title: title.trim(),
      content: content || "",
      user: req.userId,
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update note
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;

    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete note
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
