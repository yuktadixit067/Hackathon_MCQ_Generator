require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so React (running on a different port) can call this backend
app.use(cors());
app.use(express.json());

// Multer setup - handles PDF upload, keeps file in memory (no need to save to disk)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Health check route - useful to test if server is alive
app.get('/', (req, res) => {
  res.send('MCQ Generator Backend is running!');
});

// Main route: upload PDF -> extract text -> generate MCQs
app.post('/generate-mcqs', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Step 1: Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from this PDF. Try a text-based PDF, not a scanned one.' });
    }

    // Limit text length to avoid overly long prompts (adjust as needed)
    const trimmedText = extractedText.slice(0, 8000);

    // Step 2: Build the prompt
    const numQuestions = req.body.numQuestions || 5;
    const prompt = `You are an expert educator. Read the following text and generate ${numQuestions} multiple-choice questions.

For each question:
- Focus on important concepts, not trivial details
- Provide exactly 4 options
- Only one correct answer
- The 3 incorrect options must be plausible (not obviously wrong)
- Include the topic/concept it's testing

Return ONLY valid JSON, no other text, no markdown formatting, no code fences, in this exact structure:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "topic": "string"
    }
  ]
}

Text:
${trimmedText}`;

    // Step 3: Call Gemini
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Step 4: Clean up response (Gemini sometimes wraps JSON in markdown code fences)
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Step 5: Parse JSON safely
    let mcqData;
    try {
      mcqData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response:', responseText);
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    // Step 6: Send back to frontend
    return res.json(mcqData);

  } catch (err) {
    console.error('Error generating MCQs:', err);
    return res.status(500).json({ error: 'Something went wrong generating MCQs.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});