import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateFromModel = async (model, prompt) => {
  return ai.models.generateContent({
    model,
    contents: prompt,
  });
};

export const generateBlogContent = async (req, res) => {
  try {
    const { title, subtitle } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const prompt = `
Write a high-quality blog post.

Title: "${title}"
Subtitle: "${subtitle || ''}"

Guidelines:
- Clear introduction
- Use headings and subheadings
- Professional but engaging tone
- Practical examples if useful
- Around 600–800 words
- Plain text only (no markdown)
`;

    let response;

    try {
      // 🔹 Primary (fast, but may overload)
      response = await generateFromModel('gemini-2.5-flash', prompt);
    } catch (err) {
      if (err.status === 503) {
        // 🔹 Fallback (more stable)
        response = await generateFromModel('gemini-1.5-flash', prompt);
      } else {
        throw err;
      }
    }

    res.json({ content: response.text });
  } catch (error) {
    console.error('Gemini Error:', error);

    res.status(503).json({
      message:
        'AI is currently busy. Please try again in a few seconds.',
    });
  }
};
