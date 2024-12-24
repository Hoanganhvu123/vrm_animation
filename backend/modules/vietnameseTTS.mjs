import gtts from 'node-gtts';
import fs from 'fs';

const tts = gtts('vi');

async function convertTextToSpeech({ text, fileName }) {
  try {
    // Tạo file MP3 trực tiếp
    await new Promise((resolve, reject) => {
      tts.save(fileName, text, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    console.log(`✅ Generated Vietnamese speech for: "${text.substring(0, 50)}..."`);
  } catch (error) {
    console.error('❌ Error generating speech:', error);
    throw error;
  }
}

export { convertTextToSpeech };