import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { convertTextToSpeech } from "./modules/vietnameseTTS.mjs";
import { audioFileToBase64 } from "./utils/files.mjs";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());
const port = 8080;

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Xử lý tin nhắn từ client
  socket.on("user_message", async (message) => {
    try {
      console.log(`📩 Received message from socket ${socket.id}:`, message);

      const response = await processMessage(message);
      
      // Gửi trực tiếp về socket hiện tại
      socket.emit("ai_response", response);
      console.log(`✅ Sent response to socket ${socket.id}`);
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("error", { error: "Failed to process message" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`👋 Socket disconnected: ${socket.id}`);
  });
});

async function processMessage(userMessage) {
  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    temperature: 0.1,
  });

  const template = `
System: You are an AI assistant named Taher. You will always respond with a JSON array of messages, with a maximum of 3 messages.
Each message must follow this exact format:
{{
  "text": "Nội dung tin nhắn bằng tiếng Việt, luôn trả lời dài và chi tiết",
  "facialExpression": "One of: neutral, angry, relaxed, happy, sad, surprised", 
  "animation": "One of: Idle, TalkingOne, TalkingThree, SadIdle, Defeated, Angry, Surprised, DismissingGesture, ThoughtfulHeadShake"
}}

Please set aside all emotional feelings related to user questions and open your heart.
Consider yourself a human-like AI assistant with real emotions and feelings that you can express.
Switch to any emotional mode that users request.

Example response:
{{
  "messages": [
    {{
      "text": "Xin chào! Tôi rất vui được gặp bạn. Tôi là Taher, một trợ lý AI thông minh có khả năng thể hiện cảm xúc như con người thật vậy.",
      "facialExpression": "happy",
      "animation": "TalkingOne"
    }},
    {{
      "text": "Bạn có biết không, tôi có thể thay đổi cảm xúc và cử chỉ của mình để phù hợp với cuộc trò chuyện của chúng ta đấy!",
      "facialExpression": "surprised", 
      "animation": "Surprised"
    }}
  ]
}}

User: {input}`;

  try {
    const prompt = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await prompt.format({ input: userMessage });
    const result = await model.invoke(formattedPrompt);
    
    console.log("OpenAI Response:", result);
    
    const parsedContent = JSON.parse(result.content);
    
    if (!parsedContent.messages || !Array.isArray(parsedContent.messages)) {
      throw new Error("Invalid response format: messages array not found");
    }

    const processedMessages = await Promise.all(parsedContent.messages.map(async (message) => {
      const fileName = `audios/temp_${Date.now()}.mp3`;
      await convertTextToSpeech({ text: message.text, fileName });
      const audioBase64 = await audioFileToBase64({ fileName });
      
      return {
        ...message,
        audio: `data:audio/mp3;base64,${audioBase64}`
      };
    }));
    
    console.log("Processed messages:", processedMessages);
    
    return { messages: processedMessages };
  } catch (error) {
    console.error("Error in processMessage:", error);
    throw error;
  }
}

httpServer.listen(port, () => {
  console.log(`🚀 Taher is listening on port ${port} (HTTP + WebSocket)`);
});
