import fs from 'fs/promises';

/**
 * Chuyển đổi file audio thành chuỗi base64
 * @param {Object} params - Các tham số
 * @param {string} params.fileName - Đường dẫn đến file audio
 * @returns {Promise<string>} Chuỗi base64 của file audio
 */
export async function audioFileToBase64({ fileName }) {
  try {
    const buffer = await fs.readFile(fileName);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error converting audio to base64:', error);
    throw error;
  }
}
