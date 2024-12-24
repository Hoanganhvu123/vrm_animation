import React, { useState, useEffect } from 'react'
import { socketService } from '../../services/socket'
import './Chat.css'

export const Chat = ({ onAIResponse }) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    socketService.connect()

    const cleanup = socketService.onMessage((response) => {
      if (response.messages && Array.isArray(response.messages)) {
        // Thêm messages vào chat history
        setMessages(prev => [
          ...prev, 
          ...response.messages.map(msg => ({
            text: msg.text,
            isUser: false
          }))
        ])
        
        // Gửi toàn bộ response lên Interface component
        onAIResponse(response)
      }
    })

    return () => {
      cleanup()
      socketService.disconnect()
    }
  }, [onAIResponse])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      socketService.sendMessage(message)
      setMessages(prev => [...prev, { text: message, isUser: true }])
      setMessage('')
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.isUser ? 'user' : 'ai'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
} 