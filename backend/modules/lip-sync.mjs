// import { convertTextToSpeech } from "./elevenLabs.mjs";
import { convertTextToSpeech } from "./vietnameseTTS.mjs";  // Thay đổi import
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";

const lipSync = async (messages) => {
  // Validate input
  if (!Array.isArray(messages)) {
    throw new Error("messages must be an array");
  }

  // Convert text to speech first
  await Promise.all(
    messages.map(async (message, index) => {
      const fileName = `audios/message_${index}.mp3`;
      await convertTextToSpeech({ text: message.text, fileName });
    })
  );

  // Process lip sync data
  await Promise.all(
    messages.map(async (message, index) => {
      try {
        // Generate phonemes
        await getPhonemes({ message: index });
        
        // Get audio base64
        message.audio = await audioFileToBase64({ 
          fileName: `audios/message_${index}.mp3` 
        });

        // Read and process lip sync data
        const lipSyncData = await readJsonTranscript({ 
          fileName: `audios/message_${index}.json` 
        });

        // Process mouth cues to avoid long pauses
        const processedMouthCues = [];
        let lastValidShape = 'B';  // Default shape

        lipSyncData.mouthCues.forEach((cue, idx) => {
          const duration = cue.end - cue.start;

          if (cue.value === 'X') {
            // Split long pauses into smaller segments
            if (duration > 0.1) {
              const segments = Math.ceil(duration / 0.1);
              const segmentDuration = duration / segments;

              for (let i = 0; i < segments; i++) {
                processedMouthCues.push({
                  start: cue.start + (i * segmentDuration),
                  end: cue.start + ((i + 1) * segmentDuration),
                  value: lastValidShape
                });
              }
            }
          } else {
            lastValidShape = cue.value;
            processedMouthCues.push(cue);
          }
        });

        // Update lip sync data
        lipSyncData.mouthCues = processedMouthCues;
        message.lipsync = lipSyncData;

      } catch (error) {
        console.error(`Error processing lip sync for message ${index}:`, error);
        throw error;
      }
    })
  );

  return messages;
};

export { lipSync };