import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin, VRMHumanBoneName } from '@pixiv/three-vrm'
import { BlendShapeController } from './BlendShapeController'

// Constants for expressions and animations
const MOUTH_OPEN_WEIGHT = 0.3    // Độ mở miệng max 50%
const MOUTH_FREQUENCY = 3     // Tần số chuyển động miệng
const MIN_BLINK_INTERVAL = 3000  // 3 seconds
const MAX_BLINK_INTERVAL = 7000  // 7 seconds
const BLINK_DURATION = 150       // 150ms cho mỗi lần chớp mắt
const DEFAULT_EXPRESSION = "neutral"
const EXPRESSION_WEIGHT = 1.0

const VRMAvatar = ({ expression, speech, audio, text, duration }) => {
  const { scene, camera } = useThree()
  const [gltf, setGltf] = useState()
  const [progress, setProgress] = useState(0)
  const avatar = useRef()
  const blendShapeController = useRef(null)
  const audioRef = useRef(null)
  const lipSyncInterval = useRef(null)
  const lastBlinkTime = useRef(0)
  const blinkInterval = useRef(MIN_BLINK_INTERVAL)
  const isBlinking = useRef(false)

  // Load VRM Model
  useEffect(() => {
    if (!gltf) {
      const loader = new GLTFLoader()
      loader.register((parser) => {
        return new VRMLoaderPlugin(parser)
      })

      loader.load(
        '/three-vrm-girl.vrm',
        (gltf) => {
          const vrm = gltf.userData.vrm
          avatar.current = vrm
          
          // Setup VRM
          vrm.lookAt.target = camera
          
          const hips = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Hips)
          hips.position.set(0, 0.7, 0)
          hips.rotation.y = Math.PI
          gltf.scene.scale.set(1.2, 1.2, 1.2)

          // Initialize BlendShapeController
          blendShapeController.current = new BlendShapeController(vrm)
          
          // Log available expressions
          console.log('🎭 VRM Expressions:', Object.values(vrm.expressionManager.expressions).map(
            exp => ({name: exp.expressionName, type: exp.type})
          ))
          
          setGltf(gltf)
          console.log('🤖 VRM Model loaded successfully')
        },
        (xhr) => setProgress((xhr.loaded / xhr.total) * 100),
        (error) => console.error('❌ Error loading VRM:', error)
      )
    }
  }, [scene, gltf, camera])

  // Set expression
  const setExpression = (name, weight = EXPRESSION_WEIGHT) => {
    if (!avatar.current?.expressionManager?.expressions) return
    
    // Reset all expressions first
    Object.values(avatar.current.expressionManager.expressions).forEach(exp => {
      exp.weight = 0
    })

    // Find and set target expression
    const targetExp = Object.values(avatar.current.expressionManager.expressions)
      .find(exp => exp.expressionName === name)
    
    if (targetExp) {
      console.log(`🎭 Setting expression: ${name} = ${weight}`)
      targetExp.weight = weight
    } else {
      console.warn(`⚠️ Expression not found: ${name}`)
      // Fallback to neutral
      const neutral = Object.values(avatar.current.expressionManager.expressions)
        .find(exp => exp.expressionName === DEFAULT_EXPRESSION)
      if (neutral) neutral.weight = EXPRESSION_WEIGHT
    }
  }

  // Set mouth shape
  const setMouthShape = (shape) => {
    if (!avatar.current?.expressionManager?.expressions) return

    // Find mouth shape expression
    const mouthExp = Object.values(avatar.current.expressionManager.expressions)
      .find(exp => exp.expressionName === shape)
    
    if (mouthExp) {
      console.log(`🗣️ Setting mouth: ${shape} = ${MOUTH_OPEN_WEIGHT}`)
      mouthExp.weight = MOUTH_OPEN_WEIGHT
    }
  }

  // Handle expressions
  useEffect(() => {
    if (!avatar.current) return
    
    if (expression?.name) {
      setExpression(expression.name)
    } else {
      setExpression(DEFAULT_EXPRESSION)
    }
  }, [expression])

  // Handle Audio & Speech
  const handleAudioAndSpeech = async (audioData, speechData) => {
    if (!audioData || !speechData || !avatar.current) return

    try {
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current)
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      audioRef.current = new Audio(audioData)
      
      audioRef.current.onplay = () => {
        const startTime = Date.now()
        
        lipSyncInterval.current = setInterval(() => {
          const currentTime = (Date.now() - startTime) / 1000
          
          const currentSyllable = speechData.find(
            s => currentTime >= parseFloat(s.start) && currentTime <= parseFloat(s.end)
          )

          if (currentSyllable?.mouth) {
            // Tính toán smooth weight dựa trên thời gian
            const progress = (currentTime - parseFloat(currentSyllable.start)) / 
                            (parseFloat(currentSyllable.end) - parseFloat(currentSyllable.start))
            
            // Sử dụng sin để tạo chuyển động mượt mà
            const smoothWeight = MOUTH_OPEN_WEIGHT * 
              (0.5 + 0.5 * Math.sin(progress * MOUTH_FREQUENCY * Math.PI))

            // Log để debug
            console.log(`🎭 Mouth progress: ${progress.toFixed(2)}, weight: ${smoothWeight.toFixed(2)}`)
            
            // Set mouth shape với smooth weight
            const mouthExp = Object.values(avatar.current.expressionManager.expressions)
              .find(exp => exp.expressionName === currentSyllable.mouth)
            
            if (mouthExp) {
              mouthExp.weight = smoothWeight
            }
          } else {
            // Reset mouth khi không có syllable
            Object.values(avatar.current.expressionManager.expressions).forEach(exp => {
              if (exp.expressionName.includes('mouth')) {
                exp.weight = 0
              }
            })
          }
          
          if (currentTime > parseFloat(duration)) {
            clearInterval(lipSyncInterval.current)
            setExpression(DEFAULT_EXPRESSION)
          }
        }, 1000 / 60) // Update 60 lần/giây để siêu mượt
      }

      audioRef.current.onended = () => {
        if (lipSyncInterval.current) {
          clearInterval(lipSyncInterval.current)
        }
        setExpression(DEFAULT_EXPRESSION)
      }

      await audioRef.current.play()
    } catch (error) {
      console.error('❌ Audio/Speech error:', error)
      setExpression(DEFAULT_EXPRESSION)
    }
  }

  // Handle audio & speech
  useEffect(() => {
    if (audio && speech) {
      handleAudioAndSpeech(audio, speech)
    }
  }, [audio, speech, duration])

  // Animation Frame
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    if (avatar.current) {
      // Update VRM
      avatar.current.update(delta)

      // Random eye blinking - sử dụng Math.sin để làm mượt
      const blinkFrequency = 3 // Tần số nháy mắt
      const blinkDelay = 10 // Độ trễ giữa các lần nháy
      
      if (Math.round(t * blinkFrequency) % blinkDelay === 0) {
        const blinkExp = Object.values(avatar.current.expressionManager.expressions)
          .find(exp => exp.expressionName === 'blink')
        
        if (blinkExp) {
          // Sử dụng sin để tạo chuyển động mượt mà cho nháy mắt
          blinkExp.weight = 1 - Math.abs(Math.sin(t * blinkFrequency * Math.PI))
        }
      }

      // Thêm idle mouth movement khi không nói
      if (!audioRef.current?.currentTime) {
        const idleMouthExp = Object.values(avatar.current.expressionManager.expressions)
          .find(exp => exp.expressionName === 'aa')
        
        if (idleMouthExp) {
          // Tạo chuyển động nhẹ cho miệng khi idle
          const idleWeight = 0.1 * (0.5 + 0.5 * Math.sin(t * 0.5 * Math.PI))
          idleMouthExp.weight = idleWeight
        }
      }
    }
  })

  return gltf ? <primitive object={gltf.scene} /> : <Html center>{progress}% loaded</Html>
}

// Main Avatar Component
export const Avatar = (props) => {
  return (
    <Canvas camera={{ position: [0, 1.2, 1.8], fov: 30 }}>
      <ambientLight intensity={0.65} />
      <spotLight position={[0, 2, -1]} intensity={0.4} />
      <Suspense fallback={null}>
        <VRMAvatar {...props} />
      </Suspense>
      <OrbitControls 
        target={[0, 1.2, 0]}
        minPolarAngle={Math.PI/3}
        maxPolarAngle={Math.PI/1.8}
        enablePan={false}
        minDistance={1}
        maxDistance={2.5}
      />
    </Canvas>
  )
} 