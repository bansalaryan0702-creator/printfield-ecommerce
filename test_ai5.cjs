const { GoogleGenAI } = require('@google/genai');
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const interaction = await aiClient.interactions.create({
      model: "gemini-3.7-flash",
      input: "hello",
    });
    console.log(interaction.output_text);
  } catch (err) {
    console.error("error:", err.status, err.message);
  }
}
test().catch(console.error);
