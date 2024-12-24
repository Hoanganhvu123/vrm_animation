import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { mapTrackName } from './boneMapping'
import { AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack } from 'three'

// Danh sách các VRMA animations
export const VRMA_LIST = {
  DEFAULT: null, // Animation mặc định - đứng yên
  TALKING_01: '/animations/VRMA_01.vrma',
  TALKING_02: '/animations/VRMA_02.vrma',
  TALKING_03: '/animations/VRMA_03.vrma',
  TALKING_04: '/animations/VRMA_04.vrma',
  TALKING_05: '/animations/VRMA_05.vrma',
  TALKING_06: '/animations/VRMA_06.vrma',
  TALKING_07: '/animations/VRMA_07.vrma'
}

// Load VRMA animation
export const loadVRMA = async (path) => {
  try {
    // Lấy tên animation từ path
    const animationName = Object.keys(VRMA_LIST).find(key => VRMA_LIST[key] === path) || 'animation'
    console.log('Loading animation:', animationName)

    // Tạo và cấu hình loader
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    // Load VRMA file bằng GLTFLoader
    const gltf = await new Promise((resolve, reject) => {
      loader.load(path, resolve, undefined, reject)
    })

    // Lấy animation đầu tiên từ file
    const originalAnimation = gltf.animations[0]
    if (!originalAnimation) {
      console.error('No animation found in VRMA file')
      return null
    }

    // Log thông tin animation để debug
    console.log('Original animation:', {
      name: originalAnimation.name,
      duration: originalAnimation.duration,
      tracks: originalAnimation.tracks.map(t => ({
        name: t.name,
        type: t.constructor.name,
        times: Array.from(t.times),
        values: Array.from(t.values)
      }))
    })

    // Map lại tên của các tracks để khớp với VRM
    const newTracks = originalAnimation.tracks.map(track => {
      const mappedName = mapTrackName(track.name)
      const times = Float32Array.from(track.times)
      const values = Float32Array.from(track.values)

      // Tạo track mới với constructor phù hợp
      if (track.name.endsWith('.position')) {
        return new VectorKeyframeTrack(mappedName, times, values)
      } else if (track.name.endsWith('.quaternion')) {
        return new QuaternionKeyframeTrack(mappedName, times, values)
      } else {
        // Clone track với constructor tương ứng
        return new track.constructor(mappedName, times, values, track.interpolation)
      }
    })

    // Tạo animation clip mới với tên đúng
    const animation = new AnimationClip(
      animationName,
      originalAnimation.duration,
      newTracks
    )

    console.log('Created animation:', {
      name: animation.name,
      duration: animation.duration,
      tracks: animation.tracks.map(t => ({
        name: t.name,
        type: t.constructor.name,
        valueSize: t.getValueSize(),
        times: Array.from(t.times),
        values: Array.from(t.values)
      }))
    })

    return animation
  } catch (error) {
    console.error('Error loading VRMA:', error)
    return null
  }
} 