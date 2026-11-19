
const express = require("express");
const fs = require("fs");
const path = require("path");

const Project = require("../models/Project");
const File = require("../models/File");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Check project access
const checkProjectAccess = async (projectId, userId) => {
  return await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }],
  });
};

// Upload file
router.post(
  "/:projectId",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const project = await checkProjectAccess(
        req.params.projectId,
        req.userId
      );

      if (!project) {
        return res.status(404).json({ message: "Project not found or access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Please select a file" });
      }

      const newFile = await File.create({
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        project: project._id,
        uploadedBy: req.userId,
      });

      res.status(201).json({
        message: "File uploaded successfully",
        file: newFile,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get project files
router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await checkProjectAccess(
      req.params.projectId,
      req.userId
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    const files = await File.find({ project: project._id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download file
router.get("/download/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const project = await checkProjectAccess(
      file.project,
      req.userId
    );

    if (!project) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filePath = path.resolve(file.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Physical file not found" });
    }

    res.download(filePath, file.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete file
router.delete("/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const project = await checkProjectAccess(
      file.project,
      req.userId
    );

    if (!project) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only project owner or uploader can delete
    const isOwner = String(project.owner) === String(req.userId);
    const isUploader = String(file.uploadedBy) === String(req.userId);

    if (!isOwner && !isUploader) {
      return res.status(403).json({ message: "You cannot delete this file" });
    }

    const filePath = path.resolve(file.filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.findByIdAndDelete(file._id);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
