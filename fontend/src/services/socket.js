import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:8080'

// const SOCKET_URL = 'https://aecd-42-116-202-148.ngrok-free.app'

class SocketService {
  constructor() {
    this.socket = null
    this.messageHandlers = new Set()
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
    if (!this.socket && !this.isConnecting) {
      this.isConnecting = true
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        secure: false,
        rejectUnauthorized: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        withCredentials: true,
        extraHeaders: {
          "Access-Control-Allow-Origin": "*"
        }
      })

      this.socket.on('connect', () => {
        console.log('Socket connected successfully! Transport:', this.socket.io.engine.transport.name)
        this.isConnecting = false
        this.reconnectAttempts = 0

        this.socket.io.engine.on('upgrade', () => {
          console.log('Transport upgraded to:', this.socket.io.engine.transport.name)
        })
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        this.isConnecting = false
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        this.reconnectAttempts++
        
        if (this.socket.io.engine.transport.name === 'websocket') {
          console.log('WebSocket failed, falling back to polling')
          this.socket.io.opts.transports = ['polling']
        }
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached')
          this.disconnect()
        }
      })

      this.socket.on('ai_response', (response) => {
        try {
          this.messageHandlers.forEach(handler => handler(response))
        } catch (error) {
          console.error('Error handling AI response:', error)
        }
      })

      this.socket.on('error', (error) => {
        console.error('Socket error:', error)
        if (this.socket.io.engine.transport.name === 'websocket') {
          console.log('Error occurred, falling back to polling')
          this.socket.io.opts.transports = ['polling']
          this.reconnect()
        }
      })
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnecting = false
      this.reconnectAttempts = 0
    }
  }

  reconnect() {
    this.disconnect()
    this.connect()
  }
 
  sendMessage(message) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Attempting to connect...')
      this.connect()
      
      this.socket.once('connect', () => {
        this.socket.emit('user_message', message)
      })
      return
    }

    try {
      this.socket.emit('user_message', message)
    } catch (error) {
      console.error('Error sending message:', error)
      this.reconnect()
    }
  }

  onMessage(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Message handler must be a function')
    }
    
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  isConnected() {
    return this.socket?.connected || false
  }

  getSocketId() {
    return this.socket?.id
  }

  getCurrentTransport() {
    return this.socket?.io.engine.transport.name
  }
}

export const socketService = new SocketService() 