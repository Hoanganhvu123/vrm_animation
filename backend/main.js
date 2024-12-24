import fetch from 'node-fetch';

async function testTTS(message) {
  try {
    console.log('🎤 Testing TTS with message:', message);
    
    const response = await fetch('http://localhost:3000/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    
    // Log tổng quan
    console.log('\n📝 Response Overview:');
    console.log('Status:', response.status);
    console.log('Number of messages:', data.messages.length);

    // Log chi tiết từng message
    data.messages.forEach((msg, index) => {
      console.log(`\n🗨️ Message ${index + 1}:`);
      console.log('Text:', msg.text);
      console.log('Expression:', msg.facialExpression);
      console.log('Animation:', msg.animation);
      console.log('Audio length:', msg.audio?.length || 0, 'characters');
      
      if (msg.lipsync) {
        console.log('Lip Sync Data:');
        console.log('- Duration:', msg.lipsync.metadata.duration, 'seconds');
        console.log('- Number of mouth cues:', msg.lipsync.mouthCues.length);
        console.log('- First 3 mouth cues:', msg.lipsync.mouthCues.slice(0, 3));
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test cases
const testCases = [
  "Hello! How are you today?",
  "Tell me a joke!",
  "Can you be angry?",
  "Switch to surprised mode and tell me something interesting!"
];

// Chạy test
async function runTests() {
  console.log('🚀 Starting TTS Tests...\n');
  
  for (const message of testCases) {
    console.log('------------------------------------------------');
    await testTTS(message);
    // Đợi 2 giây giữa các test để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runTests();