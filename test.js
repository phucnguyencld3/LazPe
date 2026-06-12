const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6JXZBHpIGoYXrj0AiNk1ZGByaakQQYFdsb2JjuahmMGuw' });
async function run() {
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Hello' });
    console.log('SUCCESS:', response.text);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
run();
