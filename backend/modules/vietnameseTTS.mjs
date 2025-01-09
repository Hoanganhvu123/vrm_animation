import gtts from 'node-gtts';
import fs from 'fs';

const tts = gtts('en');

async function convertTextToSpeech({ text, fileName }) {
  try {
    // Generate MP3 file directly
    await new Promise((resolve, reject) => {
      tts.save(fileName, text, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    console.log(`✅ Generated English speech for: "${text.substring(0, 50)}..."`);
  } catch (error) {
    console.error('❌ Error generating speech:', error);
    throw error;
  }
}

export { convertTextToSpeech };