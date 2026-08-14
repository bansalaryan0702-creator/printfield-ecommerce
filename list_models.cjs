const { GoogleGenAI } = require('@google/genai');
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const models = await aiClient.models.list();
  for (const m of models) console.log(m.name);
}
test().catch(console.error);
