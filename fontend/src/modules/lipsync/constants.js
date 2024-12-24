// Các mouth shapes có sẵn trong VRM
export const MOUTH_SHAPES = {
  AA: 'aa',   // Miệng mở rộng như khi nói "ah"
  IH: 'ih',   // Miệng hơi mở như khi nói "ih"
  OU: 'ou',   // Miệng tròn như khi nói "ou"
  EE: 'ee',   // Miệng kéo ngang như khi nói "ee"
  OH: 'oh'    // Miệng tròn nhỏ như khi nói "oh"
}

// Map từ phoneme sang mouth shape
export const PHONEME_TO_MOUTH = {
  'X': MOUTH_SHAPES.AA,  // Silent
  'A': MOUTH_SHAPES.AA,  // "car", "hat"
  'E': MOUTH_SHAPES.EE,  // "bee", "see"
  'I': MOUTH_SHAPES.IH,  // "hit", "sit"
  'O': MOUTH_SHAPES.OH,  // "go", "boat"
  'U': MOUTH_SHAPES.OU,  // "blue", "you"
  'B': MOUTH_SHAPES.OU,  // "be", "buy"
  'default': MOUTH_SHAPES.AA
} 