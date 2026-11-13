const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

async function generateAIResponse(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing");
  }

  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
  });

  return response.text;
}

router.post("/generate-readme", authMiddleware, async (req, res) => {
  try {
    const { name, description, techStack, features, installation } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        message: "Project name and description are required",
      });
    }

  const prompt = `
Create a professional and complete README.md file for the following project.

Project Name:
${name}

Description:
${description}

Tech Stack:
${techStack}

Features:
${features}

Installation:
${installation}

Include these sections:
1. Project Title
2. Project Description
3. Features
4. Tech Stack
5. Installation Steps
6. How to Run the Project
7. Author

Requirements:
- Generate clean and professional Markdown.
- Use proper headings and code blocks.
- Make the README beginner-friendly.
- Include all the information provided above.
- Do not invent project details.
`;

    const readme = await generateAIResponse(prompt);
    res.json({ readme });
  } catch (error) {
    console.error("README generation error:", error.message);
    res.status(500).json({ message: "Could not generate README" });
  }
});


router.post("/explain-code", authMiddleware, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Code is required" });
    }

    if (code.length > 15000) {
      return res.status(400).json({
        message: "Code is too long. Maximum 15000 characters.",
      });
    }

    const prompt = `
      Explain this ${language || "programming"} code in beginner-friendly language.
      Include what it does, important parts, concepts used and possible improvements.

      Code:
      ${code}
    `;

    let explanation;
    let lastError;

    // Retry maximum 3 times for temporary Gemini errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        explanation = await generateAIResponse(prompt);
        break;
      } catch (error) {
        lastError = error;

        const errorMessage = String(error.message || "");
        const isTemporaryError =
          error.status === 503 ||
          error.status === 429 ||
          errorMessage.includes("503") ||
          errorMessage.includes("429") ||
          errorMessage.includes("UNAVAILABLE") ||
          errorMessage.includes("high demand");

        if (!isTemporaryError || attempt === 3) {
          throw error;
        }

        console.log(`Gemini retry attempt ${attempt + 1}/3...`);

        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 2000)
        );
      }
    }

    if (!explanation) {
      throw lastError || new Error("AI returned an empty response");
    }

    res.json({ explanation });
  } catch (error) {
    console.error("Code explanation error:", error.message);

    const errorMessage = String(error.message || "");

    const isTemporaryError =
      error.status === 503 ||
      error.status === 429 ||
      errorMessage.includes("503") ||
      errorMessage.includes("429") ||
      errorMessage.includes("UNAVAILABLE") ||
      errorMessage.includes("high demand");

    res.status(isTemporaryError ? 503 : 500).json({
      message: isTemporaryError
        ? "AI service is busy. Please try again in a few seconds."
        : "Could not explain code. Please try again.",
    });
  }
});

module.exports = router;