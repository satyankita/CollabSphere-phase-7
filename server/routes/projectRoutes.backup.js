
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

// Invite an existing user by email
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

    const User = require("../models/User");

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
