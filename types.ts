export enum ShapeType {
  SPHERE = 'Quantum Sphere',
  HEART = 'Anatomical Heart',
  SATURN = 'Saturn Rings',
  LOTUS = 'Zen Lotus',
  HELIX = 'DNA Helix',
  TREE = 'Quantum Tree',
  SINGULARITY = 'The Singularity',
  EXPLOSION = 'Big Bang'
}

export interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  noise: number;
}

export interface HandGesture {
  leftPinch: number; // 0 to 1
  rightPinch: number; // 0 to 1
  handDistance: number; // Normalized distance
  handsDetected: boolean;
  // Normalized screen coordinates (0 to 1) for 3D mapping
  leftHandPos: { x: number; y: number } | null; 
  rightHandPos: { x: number; y: number } | null;
}

export interface CuratorInsight {
  title: string;
  scientificPrinciple: string;
  poeticTruth: string;
}

export const PRESETS = {
  [ShapeType.SPHERE]: { count: 5000, size: 0.15, speed: 0.5, noise: 0.1 },
  [ShapeType.HEART]: { count: 6000, size: 0.12, speed: 0.2, noise: 0.05 },
  [ShapeType.SATURN]: { count: 8000, size: 0.08, speed: 0.8, noise: 0.2 },
  [ShapeType.LOTUS]: { count: 5000, size: 0.1, speed: 0.3, noise: 0.1 },
  [ShapeType.HELIX]: { count: 5000, size: 0.15, speed: 0.4, noise: 0.1 },
  [ShapeType.TREE]: { count: 7000, size: 0.15, speed: 0.3, noise: 0.1 },
  [ShapeType.SINGULARITY]: { count: 10000, size: 0.06, speed: 2.5, noise: 0.05 },
  [ShapeType.EXPLOSION]: { count: 4000, size: 0.2, speed: 2.0, noise: 0.5 },
};

export const COLORS = [
  '#ffffff', // Pure Light
  '#00ffcc', // Cyan/Teal
  '#ff0066', // Magenta/Pink
  '#ffcc00', // Gold
  '#9933ff', // Violet
  '#ff3333', // Red
];