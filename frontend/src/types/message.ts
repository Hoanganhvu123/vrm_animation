export interface LipSyncCue {
  start: number
  end: number
  value: string
}

export interface LipSyncData {
  metadata: {
    soundFile: string
    duration: number
  }
  mouthCues: LipSyncCue[]
}

export interface AIMessage {
  text: string
  facialExpression: string
  animation: string
  audio?: string
  lipsync?: LipSyncData
}

export interface AIResponse {
  messages: AIMessage[]
} 