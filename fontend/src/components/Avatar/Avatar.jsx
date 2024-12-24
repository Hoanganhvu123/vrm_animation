import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin, VRMHumanBoneName } from '@pixiv/three-vrm'
import { useControls, button } from 'leva'
import { splitSentence, MOUTH_SHAPES } from '../../modules/facial/mouthShapes'
import { loadVRMA, VRMA_LIST } from '../../animations/vrmaLoader'
import { AnimationMixer } from 'three'
import * as THREE from 'three'

const VRMAvatar = ({ expression, animation, audio, text }) => {
  const { scene, camera } = useThree()
  const [gltf, setGltf] = useState()
  const [progress, setProgress] = useState(0)
  const avatar = useRef()
  const [bonesStore, setBones] = useState({})
  const audioRef = useRef(null)
  const lastTime = useRef(0)
  const [mixer, setMixer] = useState(null)
  const [currentAction, setCurrentAction] = useState(null)

  const mouthRef = useRef({
    isMoving: false,
    currentWordIndex: 0,
    currentCharIndex: 0,
    charDuration: 0.15, // Thời gian cho m���i ký tự
    words: [], // Lưu các từ và mouth shapes
    startTime: 0
  })

  // Controls cho biểu cảm khuôn mặt và tư thế
  const controls = useControls('Avatar Controls', {
    Head: { 
      value: 0, 
      min: -0.4, 
      max: 0.4,
      label: 'Head Rotation'
    },
    leftArm: { 
      value: 0,
      min: 0,  // Tay thẳng xuống
      max: 0.8, // Nâng lên một chút
      label: 'Left Arm'
    },
    rightArm: { 
      value: 0,
      min: 0,  // Tay thẳng xuống
      max: 0.8, // Nâng lên một chút
      label: 'Right Arm'
    },
    neutral: { 
      value: 1, 
      min: 0, 
      max: 1,
      label: 'Neutral Expression'
    },
    angry: { 
      value: 0, 
      min: 0, 
      max: 1,
      label: 'Angry'
    }, 
    happy: { 
      value: 0, 
      min: 0, 
      max: 0.6, // Giới hạn happy expression
      label: 'Happy'
    },
    sad: { 
      value: 0, 
      min: 0, 
      max: 1,
      label: 'Sad'
    },
    surprised: { 
      value: 0, 
      min: 0, 
      max: 1,
      label: 'Surprised'
    },
    relaxed: { 
      value: 0, 
      min: 0, 
      max: 1,
      label: 'Relaxed'
    }
  }, { 
    collapsed: false // Mở rộng controls mặc định
  })

  // State cho VRMA animations
  const [currentVRMA, setCurrentVRMA] = useState(null)
  const [isPlayingVRMA, setIsPlayingVRMA] = useState(false)
  const vrmaRef = useRef(null)

  // Controls cho animations
  const animationControls = useControls('Animations', {
    selectAnimation: {
      options: Object.keys(VRMA_LIST),
      value: 'DEFAULT', // Mặc định là DEFAULT
      label: 'Select Animation'
    },
    playAnimation: button(() => {
      if (animationControls.selectAnimation === 'DEFAULT') {
        // Nếu là DEFAULT thì stop animation hiện tại
        if (currentAction) {
          currentAction.stop()
          setCurrentAction(null)
        }
        return
      }

      if (!currentAction) {
        console.warn('No animation loaded')
        return
      }
      
      try {
        console.log('Replaying animation:', currentAction.getClip().name)
        currentAction.reset()
        currentAction.play()
      } catch (error) {
        console.error('Error playing animation:', error)
      }
    }),
    stopAnimation: button(() => {
      if (currentAction) {
        currentAction.stop()
        setCurrentAction(null)
        console.log('Stopped animation')
      }
    })
  })

  // Effect xử lý khi có expression mới
  useEffect(() => {
    if (expression?.facial) {
      // Reset tất cả expressions về 0
      controls.neutral = 0
      controls.angry = 0
      controls.happy = 0
      controls.sad = 0
      controls.surprised = 0
      controls.relaxed = 0

      // Set expression từ backend lên 1
      const expressionName = expression.facial.toLowerCase()
      if (controls[expressionName] !== undefined) {
        controls[expressionName] = 1
        console.log('Set expression:', expressionName)
      }
    }
  }, [expression])

  // Effect xử lý khi có text mới
  useEffect(() => {
    if (text) {
      mouthRef.current.words = splitSentence(text)
      mouthRef.current.currentWordIndex = 0
      mouthRef.current.currentCharIndex = 0
      console.log('Processed text:', mouthRef.current.words)
    }
  }, [text])

  // Effect xử lý khi có audio mới
  useEffect(() => {
    if (audio) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      try {
        audioRef.current = new Audio(audio)
        
        audioRef.current.onplay = () => {
          mouthRef.current.isMoving = true
          mouthRef.current.startTime = lastTime.current
          console.log('Started mouth animation')
        }

        audioRef.current.onended = () => {
          mouthRef.current.isMoving = false
          // Reset về neutral
          if (controls) {
            controls.neutral = 1
            controls.happy = 0
            controls.angry = 0
            controls.sad = 0
            controls.surprised = 0
            controls.relaxed = 0
          }
          // Reset mouth shapes
          Object.values(MOUTH_SHAPES).forEach(shape => {
            avatar.current?.expressionManager.setValue(shape, 0)
          })
          console.log('Stopped mouth animation')
        }

        audioRef.current.play()

      } catch (error) {
        console.error('Error setting up audio:', error)
      }
    }
  }, [audio])

  // Load VRM
  useEffect(() => {
    if (!gltf) {
      const loader = new GLTFLoader()
      loader.register((parser) => {
        return new VRMLoaderPlugin(parser)
      })

      loader.load(
        '/three-vrm-girl.vrm',
        (gltf) => {
          setGltf(gltf)
          const vrm = gltf.userData.vrm
          avatar.current = vrm
          vrm.lookAt.target = camera
          
          // Log bones
          console.log('=== BONES ===')
          Object.values(VRMHumanBoneName).forEach(boneName => {
            const node = vrm.humanoid.getRawBoneNode(boneName)
            console.log(`${boneName}:`, node ? 'Found' : 'Not found')
          })
          console.log('=== END BONES ===')

          const hips = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Hips)
          hips.position.set(0, 1, 0)
          hips.rotation.y = Math.PI
          
          gltf.scene.scale.set(1.2, 1.2, 1.2)

          const bones = {
            head: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head),
            neck: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Neck),
            hips: hips,
            spine: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Spine),
            chest: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Chest),
            upperChest: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.UpperChest),
            leftShoulder: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.LeftShoulder),
            leftUpperArm: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.LeftUpperArm),
            rightShoulder: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.RightShoulder),
            rightUpperArm: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.RightUpperArm)
          }

          setBones(bones)
        },
        (xhr) => {
          setProgress((xhr.loaded / xhr.total) * 100)
        },
        (error) => {
          console.error('Error loading VRM:', error)
        }
      )
    }
  }, [scene, gltf, camera])

  // Effect để tạo mixer khi load xong VRM
  useEffect(() => {
    if (gltf) {
      const newMixer = new AnimationMixer(gltf.scene)
      setMixer(newMixer)
    }
  }, [gltf])

  // Effect để load VRMA khi chọn animation
  useEffect(() => {
    const loadAnimation = async () => {
      if (!mixer || !gltf) return

      try {
        const animationName = animationControls.selectAnimation
        
        // Nếu là DEFAULT thì stop animation hiện tại và return
        if (animationName === 'DEFAULT') {
          if (currentAction) {
            currentAction.stop()
            setCurrentAction(null)
          }
          return
        }

        const vrmaPath = VRMA_LIST[animationName]
        console.log('Loading animation:', animationName, 'from path:', vrmaPath)
        
        const animationClip = await loadVRMA(vrmaPath)
        
        if (animationClip) {
          // Stop action cũ nếu có
          if (currentAction) {
            console.log('Stopping previous animation:', currentAction.getClip().name)
            currentAction.stop()
          }
          
          // Tạo action mới
          const action = mixer.clipAction(animationClip)
          console.log('Created new action for:', animationClip.name)
          
          action.setEffectiveWeight(1)
          action.setLoop(THREE.LoopRepeat, Infinity)
          action.clampWhenFinished = true
          
          // Set state và play ngay lập tức
          action.reset()
          setCurrentAction(action)
        }
      } catch (error) {
        console.error('Error loading animation:', error)
      }
    }

    loadAnimation()
  }, [mixer, gltf, animationControls.selectAnimation])

  // Effect để play animation khi currentAction thay đổi
  useEffect(() => {
    if (currentAction) {
      console.log('Playing animation:', currentAction.getClip().name)
      currentAction.play()
    }
  }, [currentAction])

  // Animation frame
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    lastTime.current = t

    if (avatar.current) {
      // Update VRM
      avatar.current.update(delta)

      // Update animation mixer TRƯỚC KHI update VRM
      if (mixer) {
        mixer.update(delta)
      }

      // Animate mouth if audio is playing
      if (mouthRef.current.isMoving && mouthRef.current.words.length > 0) {
        const elapsed = t - mouthRef.current.startTime
        const wordIndex = Math.floor(elapsed / (mouthRef.current.charDuration * 2))
        const currentWord = mouthRef.current.words[wordIndex]

        if (currentWord) {
          const charIndex = Math.floor((elapsed % (mouthRef.current.charDuration * 2)) / mouthRef.current.charDuration)
          const mouthShape = currentWord.mouthShapes[charIndex]

          if (mouthShape) {
            // Reset all mouth shapes
            Object.values(MOUTH_SHAPES).forEach(shape => {
              avatar.current.expressionManager.setValue(shape, 0)
            })
            // Set current mouth shape
            avatar.current.expressionManager.setValue(mouthShape.shape, mouthShape.value)
          }
        }
      }

      // Set biểu cảm từ controls
      if (avatar.current?.expressionManager) {
        // Reset tất cả biểu cảm về 0 trước
        avatar.current.expressionManager.setValue('neutral', 0)
        avatar.current.expressionManager.setValue('angry', 0)
        avatar.current.expressionManager.setValue('happy', 0)
        avatar.current.expressionManager.setValue('sad', 0)
        avatar.current.expressionManager.setValue('surprised', 0)
        avatar.current.expressionManager.setValue('relaxed', 0)

        // Set biểu cảm mới
        if (controls.neutral > 0) avatar.current.expressionManager.setValue('neutral', controls.neutral)
        if (controls.angry > 0) avatar.current.expressionManager.setValue('angry', controls.angry)
        if (controls.happy > 0) avatar.current.expressionManager.setValue('happy', controls.happy)
        if (controls.sad > 0) avatar.current.expressionManager.setValue('sad', controls.sad)
        if (controls.surprised > 0) {
          avatar.current.expressionManager.setValue('surprised', controls.surprised)
          // Thêm các morph targets liên quan đến surprised
          avatar.current.expressionManager.setValue('eyeWide', controls.surprised * 0.7)
          avatar.current.expressionManager.setValue('mouthO', controls.surprised * 0.8)
        }
        if (controls.relaxed > 0) avatar.current.expressionManager.setValue('relaxed', controls.relaxed)
      }

      // Animation nháy mắt
      const blinkDelay = 10
      const blinkFrequency = 3
      if (Math.round(t * blinkFrequency) % blinkDelay === 0) {
        avatar.current.expressionManager.setValue('blink', 1 - Math.abs(Math.sin(t * blinkFrequency * Math.PI)))
      }

      // Xử lý chuyển động xương
      if (avatar.current && animationControls.selectAnimation === 'DEFAULT') {
        // Idle animation khi ở trạng thái DEFAULT
        const idleTime = t * 0.8 // Tăng tốc độ chuyển động
        const randomFactor = Math.sin(t * 0.3) * 0.5 // Tăng yếu tố ngẫu nhiên

        // 1. Chuyển động đầu mạnh và phức tạp hơn
        if (bonesStore.head) {
          const headNodding = Math.sin(idleTime * 0.7) * 0.15 // Gật đầu mạnh hơn
          const headTilting = Math.sin(idleTime * 0.5) * 0.12 // Nghiêng đầu mạnh hơn
          const headTwisting = Math.sin(idleTime * 0.3) * 0.1 // Xoay đầu mạnh hơn
          const randomHead = Math.sin(idleTime * 0.9 + randomFactor) * 0.08 // Thêm chuyển động ngẫu nhiên mạnh
          
          bonesStore.head.rotation.x = headNodding + (controls.Head * Math.PI) + randomHead
          bonesStore.head.rotation.z = headTilting + Math.sin(idleTime * 0.4) * 0.06
          bonesStore.head.rotation.y = headTwisting + Math.sin(idleTime * 0.6) * 0.08
        }

        // 2. Chuyển động cổ và thân mạnh hơn
        if (bonesStore.neck) {
          const neckTwist = Math.sin(idleTime * 0.6) * 0.1
          bonesStore.neck.rotation.y = neckTwist
          bonesStore.neck.rotation.z = Math.sin(idleTime * 0.4) * 0.08
        }

        if (bonesStore.spine) {
          const spineSwaying = Math.sin(idleTime * 0.4) * 0.12 // Lắc lư mạnh hơn
          const spineBending = Math.sin(idleTime * 0.3) * 0.08 // Cúi người
          const randomSpine = Math.sin(idleTime * 0.8 + randomFactor) * 0.06
          
          bonesStore.spine.rotation.x = spineBending // Thêm chuyển động cúi người
          bonesStore.spine.rotation.y = spineSwaying + randomSpine
          bonesStore.spine.rotation.z = Math.sin(idleTime * 0.5) * 0.06 // Nghiêng người mạnh hơn
        }

        // 3. Chuyển động vai phức tạp hơn
        if (bonesStore.leftShoulder) {
          const shoulderMovement = Math.sin(idleTime * 0.7) * 0.1
          const shoulderRoll = Math.sin(idleTime * 0.5) * 0.08
          const randomShoulder = Math.sin(idleTime * 0.9 + randomFactor) * 0.06
          
          bonesStore.leftShoulder.rotation.x = shoulderMovement + randomShoulder
          bonesStore.leftShoulder.rotation.y = Math.sin(idleTime * 0.6) * 0.08
          bonesStore.leftShoulder.rotation.z = shoulderRoll
        }
        if (bonesStore.rightShoulder) {
          const shoulderMovement = Math.sin(idleTime * 0.7 + Math.PI) * 0.1
          const shoulderRoll = Math.sin(idleTime * 0.5 + Math.PI) * 0.08
          const randomShoulder = Math.sin(idleTime * 0.9 + randomFactor + Math.PI) * 0.06
          
          bonesStore.rightShoulder.rotation.x = shoulderMovement + randomShoulder
          bonesStore.rightShoulder.rotation.y = Math.sin(idleTime * 0.6 + Math.PI) * 0.08
          bonesStore.rightShoulder.rotation.z = shoulderRoll
        }

        // 4. Chuyển động tay tự nhiên và mạnh hơn
        if (bonesStore.leftUpperArm) {
          const armIdle = Math.sin(idleTime * 0.6) * 0.08
          const armSwing = Math.sin(idleTime * 0.4) * 0.06
          const randomArm = Math.sin(idleTime * 1.1 + randomFactor) * 0.05
          
          bonesStore.leftUpperArm.rotation.z = (controls.leftArm * Math.PI / 2) + armIdle + randomArm
          bonesStore.leftUpperArm.rotation.x = armSwing
          bonesStore.leftUpperArm.rotation.y = Math.sin(idleTime * 0.7) * 0.04
        }
        if (bonesStore.rightUpperArm) {
          const armIdle = Math.sin(idleTime * 0.6 + Math.PI) * 0.08
          const armSwing = Math.sin(idleTime * 0.4 + Math.PI) * 0.06
          const randomArm = Math.sin(idleTime * 1.1 + randomFactor + Math.PI) * 0.05
          
          bonesStore.rightUpperArm.rotation.z = (-controls.rightArm * Math.PI / 2) + armIdle + randomArm
          bonesStore.rightUpperArm.rotation.x = armSwing
          bonesStore.rightUpperArm.rotation.y = Math.sin(idleTime * 0.7 + Math.PI) * 0.04
        }

        // 5. Chuyển động hông mạnh và phức tạp hơn
        if (bonesStore.hips) {
          const hipsMovement = Math.sin(idleTime * 0.4) * 0.08
          const hipsTwist = Math.sin(idleTime * 0.3) * 0.06
          const randomHips = Math.sin(idleTime * 0.7 + randomFactor) * 0.04
          
          bonesStore.hips.position.y = 1 + Math.abs(hipsMovement + randomHips) // Nhún mạnh hơn
          bonesStore.hips.rotation.y = hipsTwist // Xoay hông mạnh hơn
          bonesStore.hips.rotation.z = Math.sin(idleTime * 0.5) * 0.05 // Nghiêng hông mạnh hơn
          bonesStore.hips.rotation.x = Math.sin(idleTime * 0.6) * 0.04 // Thêm chuyển động trước sau
        }

        // 6. Chuyển động ngực và thở mạnh hơn
        if (bonesStore.chest) {
          const breathingMovement = Math.sin(idleTime * 0.8) * 0.06
          const chestTwist = Math.sin(idleTime * 0.5) * 0.04
          
          bonesStore.chest.rotation.x = breathingMovement
          bonesStore.chest.rotation.y = chestTwist
          bonesStore.chest.position.z = Math.sin(idleTime * 0.8) * 0.03
        }
      }
    }
  })

  return (
    <>
      {gltf ? (
        <primitive object={gltf.scene} />
      ) : (
        <Html center>{progress} % loaded</Html>
      )}
    </>
  )
}

export const Avatar = ({ expression, animation, audio, text }) => {
  return (
    <Canvas 
      camera={{ 
        position: [0, 1.5, 2],
        fov: 35
      }}
    >
      <ambientLight intensity={0.65} />
      <spotLight position={[0, 2, -1]} intensity={0.4} />
      <Suspense fallback={null}>
        <VRMAvatar 
          expression={expression}
          animation={animation}
          audio={audio}
          text={text}
        />
      </Suspense>
      <OrbitControls 
        target={[0, 1.5, 0]}
        minPolarAngle={Math.PI/3}
        maxPolarAngle={Math.PI/1.8}
        enablePan={false}
        minDistance={1}
        maxDistance={3}
      />
    </Canvas>
  )
} 