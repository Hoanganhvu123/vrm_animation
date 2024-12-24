// Định nghĩa các mouth shapes cơ bản
export const MOUTH_SHAPES = {
  OPEN: 'aa',      // Miệng mở rộng
  NARROW: 'ih',    // Miệng kéo ngang
  ROUND: 'ou',     // Miệng tròn
  CLOSE: 'neutral' // Miệng khép
}

// Mapping âm tiết tiếng Việt với mouth shapes
export const VIETNAMESE_PHONEME_MAP = {
  // Phụ âm đầu
  'b': { shape: MOUTH_SHAPES.ROUND, value: 0.3 },
  'c': { shape: MOUTH_SHAPES.NARROW, value: 0.4 },
  'd': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },
  'đ': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },
  'g': { shape: MOUTH_SHAPES.ROUND, value: 0.4 },
  'h': { shape: MOUTH_SHAPES.OPEN, value: 0.5 },
  'k': { shape: MOUTH_SHAPES.NARROW, value: 0.4 },
  'l': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },
  'm': { shape: MOUTH_SHAPES.ROUND, value: 0.3 },
  'n': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },
  'p': { shape: MOUTH_SHAPES.ROUND, value: 0.3 },
  'q': { shape: MOUTH_SHAPES.ROUND, value: 0.4 },
  'r': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },
  's': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },
  't': { shape: MOUTH_SHAPES.NARROW, value: 0.4 },
  'v': { shape: MOUTH_SHAPES.ROUND, value: 0.3 },
  'x': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },

  // Nguyên âm
  'a': { shape: MOUTH_SHAPES.OPEN, value: 0.6 },
  'ă': { shape: MOUTH_SHAPES.OPEN, value: 0.5 },
  'â': { shape: MOUTH_SHAPES.OPEN, value: 0.5 },
  'e': { shape: MOUTH_SHAPES.NARROW, value: 0.4 },
  'ê': { shape: MOUTH_SHAPES.NARROW, value: 0.4 },
  'i': { shape: MOUTH_SHAPES.NARROW, value: 0.3 },
  'o': { shape: MOUTH_SHAPES.ROUND, value: 0.5 },
  'ô': { shape: MOUTH_SHAPES.ROUND, value: 0.5 },
  'ơ': { shape: MOUTH_SHAPES.ROUND, value: 0.6 },
  'u': { shape: MOUTH_SHAPES.ROUND, value: 0.4 },
  'ư': { shape: MOUTH_SHAPES.ROUND, value: 0.4 },
  'y': { shape: MOUTH_SHAPES.NARROW, value: 0.3 }
}

// Hàm lấy mouth shape cho một ký tự
export const getMouthShape = (char) => {
  const lowerChar = char.toLowerCase()
  return VIETNAMESE_PHONEME_MAP[lowerChar] || { shape: MOUTH_SHAPES.CLOSE, value: 0.1 }
}

// Hàm tách từ thành các âm tiết
export const splitWord = (word) => {
  return word.split('').map(char => getMouthShape(char))
}

// Hàm tách câu thành các từ
export const splitSentence = (text) => {
  return text.split(' ').map(word => ({
    word,
    mouthShapes: splitWord(word)
  }))
} 