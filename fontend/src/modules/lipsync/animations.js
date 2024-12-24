import { MOUTH_SHAPES, PHONEME_TO_MOUTH } from './constants'

// Reset tất cả mouth shapes về 0
const resetMouthShapes = (vrm) => {
  if (!vrm?.expressionManager) return
  
  Object.values(MOUTH_SHAPES).forEach(shape => {
    vrm.expressionManager.setValue(shape, 0)
  })
}

// Áp dụng một mouth shape
const setMouthShape = (vrm, shape, value = 1) => {
  if (!vrm?.expressionManager) return
  vrm.expressionManager.setValue(shape, value)
}

// Tìm mouth shape đang active tại thời điểm hiện tại
const getCurrentMouthShape = (lipsync, currentTime) => {
  if (!lipsync?.mouthCues) return null

  const currentCue = lipsync.mouthCues.find(cue => 
    currentTime >= cue.start && currentTime <= cue.end
  )

  if (!currentCue) return null

  return PHONEME_TO_MOUTH[currentCue.value] || PHONEME_TO_MOUTH.default
}

// Xử lý lip sync animation
export const handleLipSync = (vrm, lipsync, audioStartTime, currentTime) => {
  if (!vrm || !lipsync) return

  // Reset all mouth shapes
  resetMouthShapes(vrm)

  // Tính thời gian tương đối từ khi bắt đầu audio
  const relativeTime = currentTime - audioStartTime

  // Nếu đã hết duration thì return
  if (relativeTime > lipsync.metadata.duration) return

  // Tìm và áp dụng mouth shape phù hợp
  const currentShape = getCurrentMouthShape(lipsync, relativeTime)
  if (currentShape) {
    setMouthShape(vrm, currentShape)
  }
} 