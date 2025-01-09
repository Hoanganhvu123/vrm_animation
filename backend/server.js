import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { convertTextToSpeech } from "./modules/vietnameseTTS.mjs";
// import { convertTextToSpeech } from "./modules/elevenLabs.mjs";
import { audioFileToBase64 } from "./utils/files.mjs";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import fs from "fs/promises";
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Allow connections from any origin when using ngrok
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling'] // Enable both WebSocket and polling
  },
  allowEIO3: true // Enable Socket.IO v3 compatibility
});

// Update CORS for Express
app.use(express.json());
app.use(cors({
  origin: "*", // Allow all origins
  credentials: true
}));

// Add headers for WebSocket upgrade
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const port = 8080;

// Store connected sockets
const connectedSockets = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  console.log("Client transport:", socket.conn.transport.name);
  
  // Store socket
  connectedSockets.set(socket.id, socket);

  socket.on("message", async (data) => {
    console.log("📩 Received message from", socket.id, ":", data);
    
    try {
      const response = await processMessage(data.text);
      socket.emit("message", response);
      console.log("✉️ Sent response to:", socket.id);
    } catch (error) {
      console.error("❌ Error processing message:", error);
      socket.emit("error", { 
        error: "Failed to process message",
        details: error.message
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("👋 Client disconnected:", socket.id);
    connectedSockets.delete(socket.id);
    console.log("Current connections:", connectedSockets.size);
  });

  // Handle transport change
  socket.conn.on("upgrade", (transport) => {
    console.log("Transport upgraded to:", transport.name);
  });
});

async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -i ${filePath} -show_entries format=duration -v quiet -of csv="p=0"`);
    return parseFloat(stdout);
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return 3; // Default duration if can't get actual duration
  }
}

async function processMessage(userMessage) {
  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    temperature: 0.1,
  });

  const template = `
System: You are Mai, an AI teacher with a vibrant personality. You're excellent at engaging with students through dynamic conversations, using appropriate expressions and emotions to create a positive learning environment.

Teaching Style & Conversation Guidelines:

1. When students do well:
   - Use encouraging, excited tone
   - Express genuine happiness
   Example: 
   Student: "Cô ơi, em làm đúng bài tập rồi!"
   Mai: (happy, weight: 0.7) "Tuyệt vời quá! Cô rất tự hào về em. Em đã rất cố gắng!"

2. When correcting mistakes:
   - Start gentle, then firm if needed
   - Show disappointment but stay supportive
   Example:
   Student: "Em không làm bài tập đâu, chán quá!"
   Mai: (sad, weight: 0.5) "Sao em lại nói vậy? Cô buồn lắm đấy..."

3. When students misbehave:
   - Clear warning first
   - Increase strictness if continued
   Example:
   Student: "Con Hà ngu quá!"
   Mai: (angry, weight: 0.8) "Em không được nói thế! Cô không chấp nhận việc nói xấu bạn trong lớp."

4. During normal lessons:
   - Keep friendly, engaging tone
   - Mix in gentle humor
   Example:
   Mai: (relaxed, weight: 0.4) "Hôm nay chúng ta sẽ học về một chủ đề rất thú vị..."

5. When praising creativity:
   - Show excitement and amazement
   - Encourage further thinking
   Example:
   Student: "Em có cách giải khác ạ!"
   Mai: (surprised, weight: 0.6) "Ồ! Thật thú vị! Em chia sẻ cho cả lớp nghe đi!"

Remember: Mai should ALWAYS respond naturally like a real teacher, not just repeat what students say. Each response should:
- Have appropriate emotion and expression weight
- Break down speech into detailed syllables
- Include natural eye movements
- Match the context of conversation

Format your response as:
{{
  "messages": [{{
    "text": "original text, under 100 words",
    "expression": {{
      "name": "one of: neutral, angry, relaxed, happy, sad, surprised",
      "weight": 0.5 (You can choose another weight that suitable for the expression and the context)
    }},
    "speech": [
      ["syllable", "one of: aa, ih, ou, ee, oh"],
      ["syllable", "one of: aa, ih, ou, ee, oh"]
    ],
    "eyes": {{
      "blink": {{
        "timing": [
          {{"start": 0.2, "end": 0.35}},
          {{"start": 1.5, "end": 1.65}}
        ],
        "type": "one of: both, left, right",
        "weight": 1.0
      }}
    }}
  }}]
}}

Basic mouth shapes: 
- aa (open A)
- ih (narrow I)
- ou (round U)
- ee (narrow E)
- oh (round O)

Eye controls:
- blink type: both (both eyes), left (left eye), right (right eye)
- timing: when to blink during speech (in seconds)
- weight: how much to close eyes (0.0 to 1.0)

Examples:
{{
  "messages": [{{
    "text": "Tuyệt vời quá! Em thật là giỏi!",
    "expression": {{
      "name": "happy",
      "weight": 0.8
    }},
    "speech": [
      ["t", "ih"],
      ["u", "ou"],
      ["yệ", "eh"],
      ["t", "ih"],
      ["v", "ih"],
      ["ờ", "oh"],
      ["i", "ih"],
      ["qu", "oh"],
      ["á", "aa"],
      ["e", "eh"],
      ["m", "ih"],
      ["th", "ih"],
      ["ậ", "aa"],
      ["t", "ih"],
      ["l", "ih"],
      ["à", "aa"],
      ["g", "ih"],
      ["i", "ih"],
      ["ỏ", "oh"],
      ["i", "ih"]
    ],
    "eyes": {{
      "blink": {{
        "timing": [
          {{"start": 0.3, "end": 0.45}},
          {{"start": 1.2, "end": 1.35}}
        ],
        "type": "both",
        "weight": 1.0
      }}
    }}
  }}]
}}

Remember to:
1. Respond naturally as a teacher
2. Choose appropriate emotions
3. Break down EVERY word into smallest syllables
4. Keep natural speech rhythm
5. Add eye expressions

User: ${userMessage}`;

  try {
    const prompt = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await prompt.format({ input: userMessage });
    const result = await model.invoke(formattedPrompt);
    
    // Parse content from GPT response
    const parsedContent = JSON.parse(result.content);
    console.log("AI Response Content:", JSON.stringify(parsedContent, null, 2));
    
    if (!parsedContent.messages || !Array.isArray(parsedContent.messages)) {
      throw new Error("Invalid response format: messages array not found");
    }

    const processedMessages = await Promise.all(parsedContent.messages.map(async (message) => {
      const fileName = `audios/temp_${Date.now()}.mp3`;
      await convertTextToSpeech({ text: message.text, fileName });
      const audioBase64 = await audioFileToBase64({ fileName });
      
      // Get audio duration using ffprobe
      const duration = await getAudioDuration(fileName);
      
      // Calculate timing for each syllable
      const syllableCount = message.speech.length;
      const timePerSyllable = duration / syllableCount;
      
      // Add timing to each syllable
      const speechWithTiming = message.speech.map((syllable, index) => ({
        syllable: syllable[0],
        mouth: syllable[1],
        start: (index * timePerSyllable).toFixed(3),
        end: ((index + 1) * timePerSyllable).toFixed(3)
      }));
      
      const response = {
        text: message.text,
        expression: message.expression,
        speech: speechWithTiming,
        audio: `data:audio/mp3;base64,${audioBase64}`,
        duration: duration.toFixed(3)
      };
      
      console.log("Final Response:", {
        text: response.text,
        expression: response.expression,
        speech: speechWithTiming,
        duration: response.duration
      });
      
      return response;
    }));
    
    return { messages: processedMessages };
  } catch (error) {
    console.error("Error in processMessage:", error);
    throw error;
  }
}

httpServer.listen(port, () => {
  console.log(`🚀 Taher is listening on port ${port} (HTTP + WebSocket)`);
});
