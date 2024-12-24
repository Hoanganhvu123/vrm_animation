import { VRMHumanBoneName } from '@pixiv/three-vrm'

// Chỉ giữ lại các bone chính và đã xác nhận có trong model
const BONE_MAP = {
  // Core bones
  'hips': VRMHumanBoneName.Hips,
  'spine': VRMHumanBoneName.Spine,
  'chest': VRMHumanBoneName.Chest,
  'upperChest': VRMHumanBoneName.UpperChest,
  'neck': VRMHumanBoneName.Neck,
  'head': VRMHumanBoneName.Head,
  
  // Arms
  'leftShoulder': VRMHumanBoneName.LeftShoulder,
  'leftUpperArm': VRMHumanBoneName.LeftUpperArm,
  'leftLowerArm': VRMHumanBoneName.LeftLowerArm,
  'leftHand': VRMHumanBoneName.LeftHand,
  
  'rightShoulder': VRMHumanBoneName.RightShoulder, 
  'rightUpperArm': VRMHumanBoneName.RightUpperArm,
  'rightLowerArm': VRMHumanBoneName.RightLowerArm,
  'rightHand': VRMHumanBoneName.RightHand,

  // Legs
  'leftUpperLeg': VRMHumanBoneName.LeftUpperLeg,
  'leftLowerLeg': VRMHumanBoneName.LeftLowerLeg,
  'leftFoot': VRMHumanBoneName.LeftFoot,
  'leftToes': VRMHumanBoneName.LeftToes,
  
  'rightUpperLeg': VRMHumanBoneName.RightUpperLeg,
  'rightLowerLeg': VRMHumanBoneName.RightLowerLeg,
  'rightFoot': VRMHumanBoneName.RightFoot,
  'rightToes': VRMHumanBoneName.RightToes,

  // Eyes
  'leftEye': VRMHumanBoneName.LeftEye,
  'rightEye': VRMHumanBoneName.RightEye
}

export const mapTrackName = (trackName) => {
  // Tách tên bone và property
  const [boneName, ...rest] = trackName.split('.')
  const property = rest.join('.')

  // Map tên bone, nếu không có trong map thì giữ nguyên tên gốc
  const mappedBone = BONE_MAP[boneName] || boneName

  // Log để debug
  console.log(`Mapping bone: ${boneName} -> ${mappedBone}`)

  return `${mappedBone}.${property}`
} 