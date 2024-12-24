import React, { useState, useCallback } from 'react'
import { Avatar } from '../Avatar/Avatar'
import { Chat } from '../Chat/Chat'
import { socketService } from '../../services/socket'

export const Interface = () => {
  const [currentState, setCurrentState] = useState({
    facialExpression: 'neutral',
    animation: null,
    audio: null,
    text: ''
  })

  const handleAIResponse = useCallback((response) => {
    if (response.messages && response.messages.length > 0) {
      const firstMessage = response.messages[0]
      console.log('Received message:', firstMessage)
      
      setCurrentState({
        facialExpression: firstMessage.facialExpression,
        animation: firstMessage.animation,
        audio: firstMessage.audio,
        text: firstMessage.text
      })
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Avatar 
        expression={{ facial: currentState.facialExpression }}
        animation={currentState.animation}
        audio={currentState.audio}
        text={currentState.text}
      />
      <Chat 
        onAIResponse={handleAIResponse}
      />
    </div>
  )
} 