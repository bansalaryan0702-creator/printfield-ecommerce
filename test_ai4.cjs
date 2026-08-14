const { GoogleGenAI } = require('@google/genai');
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const response = await aiClient.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: 'hello',
  });
  console.log(response.text);
}
test().catch(console.error);
