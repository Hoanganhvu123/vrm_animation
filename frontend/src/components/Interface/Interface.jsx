import React, { useState, useEffect, useCallback } from 'react'
import { Avatar } from '../Avatar/Avatar'
import { Chat } from '../Chat/Chat'
import { socketService } from '../../services/socket'

export const Interface = () => {
  const [currentState, setCurrentState] = useState({
    text: '',
    expression: { name: 'neutral', weight: 0 },
    speech: [],
    audio: null,
    duration: '0'
  })

  const [messages, setMessages] = useState([])

  useEffect(() => {
    socketService.connect()

    socketService.setMessageHandler((response) => {
      // Log full response để debug
      console.log('🔥 Backend Response:', response)
      
      if (response.messages && Array.isArray(response.messages)) {
        // Update messages cho chat
        setMessages(prev => [
          ...prev,
          ...response.messages.map(msg => ({
            text: msg.text,
            isUser: false
          }))
        ])

        // Update state cho avatar từ message đầu tiên
        if (response.messages[0]) {
          const message = response.messages[0]
          setCurrentState({
            text: message.text,
            expression: message.expression || { name: 'neutral', weight: 0 },
            speech: message.speech || [],
            audio: message.audio,
            duration: message.duration || '0'
          })

          // Log state update để verify
          console.log('🎭 Updated Avatar State:', {
            text: message.text,
            expression: message.expression,
            speech: message.speech,
            duration: message.duration
          })
        }
      }
    })

    return () => {
      socketService.disconnect()
    }
  }, [])

  const handleSendMessage = (message) => {
    if (message.trim()) {
      console.log('📤 Sending message:', message)
      socketService.sendMessage(message)
      setMessages(prev => [...prev, { text: message, isUser: true }])
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Avatar 
        text={currentState.text}
        expression={currentState.expression}
        speech={currentState.speech}
        audio={currentState.audio}
        duration={currentState.duration}
      />
      <Chat 
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
} 