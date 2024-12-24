import { convertTextToSpeech } from './vietnameseTTS.mjs';

async function textToSpeech(text) {
  try {
    const fileName = `audios/temp_${Date.now()}.mp3`;
    await convertTextToSpeech({ text, fileName });
    
    // Đọc file audio và convert sang base64
    const audioBase64 = await audioFileToBase64({ fileName });
    
    // Xóa file tạm
    // TODO: Thêm logic xóa file tạm ở đây
    
    return audioBase64;
  } catch (error) {
    console.error('Error in textToSpeech:', error);
    throw error;
  }
}

export { textToSpeech }; 