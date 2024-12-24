// Các biểu cảm từ backend
export const BACKEND_EXPRESSIONS = {
  NEUTRAL: 'neutral',
  ANGRY: 'angry',
  RELAXED: 'relaxed',
  HAPPY: 'happy',
  SAD: 'sad',
  SURPRISED: 'surprised'
}

// Map giá trị các biểu cảm cho VRM
export const EXPRESSION_VALUES = {
  // Biểu cảm vui vẻ
  [BACKEND_EXPRESSIONS.HAPPY]: {
    happy: 1,      // Nụ cười
    aa: 0.3,       // Miệng hơi mở
    relaxed: 0.3   // Thả lỏng
  },

  // Biểu cảm tức giận
  [BACKEND_EXPRESSIONS.ANGRY]: {
    angry: 1,      // Cau mày
    aa: 0.7,       // Miệng mở to
    oh: 0.3        // Miệng tròn
  },

  // Biểu cảm thư giãn
  [BACKEND_EXPRESSIONS.RELAXED]: {
    relaxed: 1,    // Thả lỏng
    happy: 0.3,    // Hơi cười
    ih: 0.1        // Miệng hơi hé
  },

  // Biểu cảm buồn
  [BACKEND_EXPRESSIONS.SAD]: {
    sad: 1,        // Buồn
    ou: 0.3,       // Miệng chu
    lookDown: 0.5  // Nhìn xuống
  },

  // Biểu cảm ngạc nhiên
  [BACKEND_EXPRESSIONS.SURPRISED]: {
    surprised: 1,  // Ngạc nhiên
    oh: 0.8,       // Miệng tròn to
    lookUp: 0.3    // Nhìn lên
  },

  // Biểu cảm trung tính
  [BACKEND_EXPRESSIONS.NEUTRAL]: {
    neutral: 1,    // Trung tính
    ih: 0.1        // Miệng hơi hé
  }
}

// Áp dụng biểu cảm cho VRM
export const applyExpression = (vrm, expressionName) => {
  if (!vrm?.expressionManager) return

  // Reset tất cả expressions
  const allExpressions = vrm.expressionManager.expressions.map(
    exp => exp.expressionName
  )
  allExpressions.forEach(exp => {
    vrm.expressionManager.setValue(exp, 0)
  })

  // Lấy các giá trị biểu cảm
  const expressionValues = EXPRESSION_VALUES[expressionName] || EXPRESSION_VALUES.neutral

  // Áp dụng từng giá trị
  Object.entries(expressionValues).forEach(([exp, value]) => {
    vrm.expressionManager.setValue(exp, value)
  })
} 