const { GoogleGenAI } = require('@google/genai');
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const Type = { ARRAY: 'ARRAY', STRING: 'STRING', OBJECT: 'OBJECT' };

async function test() {
  const linksArray = [
    'https://buyer.indiamart.com/payment-protection',
    'https://sagardisplay.com/products.html',
    'https://sagardisplay.com/roll-up-standee.html',
    'https://sagardisplay.com/promotional-umbrella.html',
    'https://sagardisplay.com/digital-standee.html'
  ];
  const url = 'https://sagardisplay.com';
  const prompt = `Here is a list of URLs found on a webpage (${url}). Which of these links are likely individual product detail pages? Filter out navigation, categories, privacy policies, etc. Return ONLY a JSON array of the product URLs.
URLs:
${linksArray.slice(0, 300).join('\n')}`;

  const response = await aiClient.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  console.log(response.text);
}
test().catch(console.error);
