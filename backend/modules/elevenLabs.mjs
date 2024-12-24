import ElevenLabs from "elevenlabs-node";
import dotenv from "dotenv";
dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = process.env.ELEVEN_LABS_VOICE_ID;
const modelID = process.env.ELEVEN_LABS_MODEL_ID;

const voice = new ElevenLabs({
  apiKey: elevenLabsApiKey,
  voiceId: voiceID,
});

async function convertTextToSpeech({ text, fileName }) {
  // Thêm voice settings để điều chỉnh tốc độ và chất lượng
  const voiceSettings = {
    stability: 0.7,           // Tăng stability để giọng ổn định hơn
    similarityBoost: 0.7,     // Tăng similarity để tự nhiên hơn
    style: 0.5,              // Giảm style xuống để tự nhiên hơn
    speakerBoost: true,
    speaking_rate: 0.85      // Thêm speaking_rate (0.5 là rất chậm, 2.0 là rất nhanh)
  };

  try {
    await voice.textToSpeech({
      fileName: fileName,
      textInput: text,
      voiceId: voiceID,
      modelId: modelID,
      voiceSettings: voiceSettings  // Thêm voice settings vào
    });

    console.log(`✅ Generated speech for text: "${text.substring(0, 50)}..."`);
  } catch (error) {
    console.error('❌ Error generating speech:', error);
    throw error;
  }
}

export { convertTextToSpeech, voice };