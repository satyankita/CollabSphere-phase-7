const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const MODEL_NAME = "gemini-3.8-flash";

async function generateAIResponse(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });
  if (!response.text) throw new Error("Gemini returned an empty response");
  return response.text;
}

async function generateReadme(req, res) {
  try {
    const { name, description, techStack = "", features = "", installation = "npm install", runCommand = "npm run dev", author = "" } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: "Project name and description are required" });
    }

    const readme = await generateAIResponse(`Create a complete, professional README.md in Markdown.
Project: ${name}
Description: ${description}
Tech stack: ${techStack}
Features: ${features}
Installation: ${installation}
Run command: ${runCommand}
Author: ${author}
Include project description, features, tech stack, installation, usage, and author. Do not invent details.`);
    res.json({ readme });
  } catch (error) {
    console.error("README generation error:", error.message);
    res.status(500).json({ message: error.message === "Gemini API key is missing" ? error.message : "Could not generate README" });
  }
}

async function explainContent(req, res) {
  try {
    const content = req.body.code || req.body.content || req.body.text || "";
    const { language = "programming", action = req.body.task || "explain" } = req.body;
    if (!content.trim()) return res.status(400).json({ message: "Content is required" });
    if (content.length > 30000) return res.status(400).json({ message: "Content is too long (maximum 30000 characters)" });

    let instruction;
    if (["improve", "suggest-improvements", "improve-note"].includes(action)) {
      instruction = "Review this note and suggest clear, practical improvements. Preserve its intent and provide a revised Markdown version after the suggestions.";
    } else if (["explain-note", "note"].includes(action)) {
      instruction = "Explain this note in clear, beginner-friendly language. Summarize its main ideas and clarify any technical terms.";
    } else {
      instruction = `Explain this ${language} code in beginner-friendly language. Describe what it does, its important parts, concepts used, and possible improvements.`;
    }

    const explanation = await generateAIResponse(`${instruction}\n\nContent:\n${content}`);
    res.json({ explanation, result: explanation });
  } catch (error) {
    console.error("Gemini explain error:", error.message);
    res.status(500).json({ message: error.message === "Gemini API key is missing" ? error.message : "Could not generate an explanation" });
  }
}

async function generateDocs(req, res) {
  try {
    const { name = "Project", description = "", techStack = "", features = "", code = "", content = "" } = req.body;
    const source = code || content;
    if (!description.trim() && !source.trim()) {
      return res.status(400).json({ message: "Provide a project description or source content" });
    }
    const docs = await generateAIResponse(`Generate clear project documentation in Markdown for ${name}.
Description: ${description || "Not provided"}
Tech stack: ${techStack || "Not provided"}
Features: ${features || "Not provided"}
Source content (if supplied):\n${source.slice(0, 25000)}
Include an overview, setup/usage where supported by the supplied information, and key components. Do not invent facts or commands.`);
    res.json({ docs, documentation: docs });
  } catch (error) {
    console.error("Documentation generation error:", error.message);
    res.status(500).json({ message: error.message === "Gemini API key is missing" ? error.message : "Could not generate documentation" });
  }
}

// Required contract paths, plus legacy aliases used by previously deployed clients.
router.post(["/readme", "/generate-readme"], authMiddleware, generateReadme);
router.post(["/explain", "/explain-code"], authMiddleware, explainContent);
router.post("/docs", authMiddleware, generateDocs);

module.exports = router;
