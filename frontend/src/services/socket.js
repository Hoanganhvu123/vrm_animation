import io from 'socket.io-client'

// const SOCKET_URL = 'http://localhost:8080'

const SOCKET_URL = 'https://0cba-2402-800-6173-5345-83d-22f0-9e4f-f971.ngrok-free.app'

class SocketService {
  constructor() {
    this.socket = null
    this.messageHandler = null
  }

  connect() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 30,
      withCredentials: true,
      extraHeaders: {
        "Access-Control-Allow-Origin": "*"
      }
    })

    this.socket.on('connect', () => {
      console.log('Socket connected successfully! Transport:', this.socket.io.engine.transport.name)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    this.socket.on('message', (data) => {
      console.log('Received message:', data)
      if (this.messageHandler) {
        this.messageHandler(data)
      }
    })

    return this.socket
  }

  setMessageHandler(handler) {
    this.messageHandler = handler
  }

  sendMessage(message) {
    if (this.socket && this.socket.connected) {
      console.log('Sending message:', message)
      this.socket.emit('message', { text: message })
    } else {
      console.warn('Socket not connected')
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }
}

export const socketService = new SocketService() 