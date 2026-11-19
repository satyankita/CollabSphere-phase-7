
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const aiRoutes = require("./routes/aiRoutes");
const noteRoutes = require("./routes/noteRoutes");
const fileRoutes = require("./routes/fileRoutes");
const activityRoutes = require("./routes/activityRoutes");

const connectDb = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/gemini", aiRoutes);
app.use("/api/ai", aiRoutes); // Backward-compatible aliases
app.use("/api/notes", noteRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/activities", activityRoutes);

app.get("/", (req, res) => {
  res.json({ message: "CollabSphere API is running!" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`CollabSphere server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
