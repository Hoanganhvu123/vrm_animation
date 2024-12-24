import { execCommand } from "../utils/files.mjs";

const RHUBARB_PATH = 'E:\\Rhubarb-Lip-Sync-1.13.0-Windows\\rhubarb.exe';

const getPhonemes = async ({ message }) => {
  try {
    console.log('Starting lip sync...');
    
    // 1. Convert MP3 to WAV với tên file tạm thời
    const tempWav = `audios/message_${message}_temp.wav`;
    await execCommand(
      { command: `ffmpeg -y -i audios/message_${message}.mp3 ${tempWav}` }
    );

    // 2. Generate lip sync
    await execCommand({
      command: `"${RHUBARB_PATH}" -f json -o audios/message_${message}.json ${tempWav} -r phonetic`
    });

    // 3. Xóa file tạm
    await execCommand({ command: `del ${tempWav}` });

    console.log('✅ Lip sync generated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

export { getPhonemes };