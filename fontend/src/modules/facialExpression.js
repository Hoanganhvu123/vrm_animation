// Định nghĩa các facial expressions có sẵn
export const FACIAL_EXPRESSIONS = {
  NEUTRAL: 'neutral',
  SMILE: 'smile',
  SAD: 'sad',
  ANGRY: 'angry',
  SURPRISED: 'surprised',
  RELAXED: 'relaxed',
  HAPPY: 'happy',
  EXTRA: 'extra'
}

// Map facial expression từ backend sang VRM expressions
export const mapFacialExpression = (expression) => {
  const expressionMap = {
    'smile': 'happy',
    'sad': 'sad',
    'angry': 'angry',
    'surprised': 'Surprised',
    'default': 'neutral',
    'funnyFace': 'extra',
    'relaxed': 'relaxed'
  }
  
  return expressionMap[expression.toLowerCase()] || 'neutral'
}

// Áp dụng facial expression cho VRM
export const applyFacialExpression = (vrm, expressionName) => {
  if (!vrm || !vrm.expressionManager) return

  // Reset tất cả expressions
  Object.values(FACIAL_EXPRESSIONS).forEach(exp => {
    vrm.expressionManager.setValue(exp, 0)
  })

  // Set expression mới
  const mappedExpression = mapFacialExpression(expressionName)
  vrm.expressionManager.setValue(mappedExpression, 1)
} 