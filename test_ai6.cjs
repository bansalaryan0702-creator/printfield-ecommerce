const { GoogleGenAI } = require('@google/genai');
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "hello",
    });
    console.log(response.text);
  } catch (err) {
    console.error("error:", err.status, err.message);
  }
}
test().catch(console.error);
