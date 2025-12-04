import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, HandGesture, ParticleConfig } from '../types';

interface ParticleSystemProps {
  shape: ShapeType;
  color: string;
  gesture: HandGesture;
  config: ParticleConfig;
  audioAnalyser?: React.MutableRefObject<AnalyserNode | null>;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// Create a soft glow texture programmatically
const generateTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ shape, color, gesture, config, audioAnalyser }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const leftCursorRef = useRef<THREE.Mesh>(null);
  const rightCursorRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  const particleTexture = useMemo(() => generateTexture(), []);

  // Audio Data Buffer
  const audioDataArray = useMemo(() => new Uint8Array(128), []);

  // Base positions
  const particles = useMemo(() => {
    const data = new Float32Array(config.count * 3);
    const randoms = new Float32Array(config.count * 3);
    
    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;
      randoms[i3] = (Math.random() - 0.5) * 2;
      randoms[i3 + 1] = (Math.random() - 0.5) * 2;
      randoms[i3 + 2] = (Math.random() - 0.5) * 2;
      
      // Init random sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 2 + Math.random();
      
      data[i3] = r * Math.sin(phi) * Math.cos(theta);
      data[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      data[i3 + 2] = r * Math.cos(phi);
    }
    return { data, randoms };
  }, [config.count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const { leftPinch, rightPinch, handDistance, handsDetected, leftHandPos, rightHandPos } = gesture;
    
    // --- Audio Analysis ---
    let audioEnergy = 0;
    let highFreqEnergy = 0;
    if (audioAnalyser && audioAnalyser.current) {
        audioAnalyser.current.getByteFrequencyData(audioDataArray);
        // Bass/Mid for expansion
        let sum = 0;
        for(let i=0; i<30; i++) sum += audioDataArray[i];
        audioEnergy = sum / 30 / 255; // 0 to 1
        
        // Highs for sparkle
        let highSum = 0;
        for(let i=80; i<120; i++) highSum += audioDataArray[i];
        highFreqEnergy = highSum / 40 / 255;
    }

    // --- Cursor Mapping ---
    let leftTarget = null;
    let rightTarget = null;

    if (leftHandPos && leftCursorRef.current) {
        const x = (1 - leftHandPos.x - 0.5) * viewport.width;
        const y = -(leftHandPos.y - 0.5) * viewport.height;
        leftCursorRef.current.position.set(x, y, 1);
        leftTarget = new THREE.Vector3(x, y, 0);
    }

    if (rightHandPos && rightCursorRef.current) {
        const x = (1 - rightHandPos.x - 0.5) * viewport.width;
        const y = -(rightHandPos.y - 0.5) * viewport.height;
        rightCursorRef.current.position.set(x, y, 1);
        rightTarget = new THREE.Vector3(x, y, 0);
    }

    if (leftCursorRef.current) leftCursorRef.current.visible = !!leftHandPos;
    if (rightCursorRef.current) rightCursorRef.current.visible = !!rightHandPos;

    // --- Physics Parameters ---
    // Audio boosts expansion
    const baseExpansion = handsDetected ? Math.max(0.2, handDistance * 3) : 1 + Math.sin(time * 0.2) * 0.1;
    const expansion = baseExpansion + (audioEnergy * 1.5); // Music pumps the size
    
    const chaos = handsDetected ? leftPinch * 3 : 0.1 + (highFreqEnergy * 0.5);
    const rotationSpeed = (handsDetected ? (1 - rightPinch) * 0.5 : 0.05) + (audioEnergy * 0.1);
    const targetColor = new THREE.Color(color);

    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;
      
      // 1. Get Base Shape Position
      let bx = particles.data[i3];
      let by = particles.data[i3 + 1];
      let bz = particles.data[i3 + 2];
      const rx = particles.randoms[i3];
      const ry = particles.randoms[i3 + 1];
      const rz = particles.randoms[i3 + 2];

      if (shape === ShapeType.HEART) {
        const t = (i / config.count) * Math.PI * 2;
        const scale = 0.15;
        const rVar = 1 - Math.abs(rx) * 0.5; 
        bx = scale * 16 * Math.pow(Math.sin(t), 3) * rVar;
        by = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * rVar;
        bz = rz * scale * 4;
      } else if (shape === ShapeType.SATURN) {
          const ring = i > config.count * 0.2;
          if (ring) {
            const angle = (i / config.count) * Math.PI * 20;
            const dist = 3 + Math.abs(rx);
            bx = Math.cos(angle) * dist;
            bz = Math.sin(angle) * dist;
            by = ry * 0.1;
          } else {
             const theta = i * 0.1; 
             const phi = Math.acos((i/config.count)*2 - 1);
             const r = 1.2;
             bx = r * Math.sin(phi) * Math.cos(theta);
             by = r * Math.sin(phi) * Math.sin(theta);
             bz = r * Math.cos(phi);
          }
      } else if (shape === ShapeType.HELIX) {
         const t = (i / config.count) * Math.PI * 12;
         const radius = 1.2;
         bx = Math.cos(t) * radius;
         bz = Math.sin(t) * radius;
         by = (i / config.count) * 10 - 5;
         if (i % 2 === 0) {
             bx = Math.cos(t + Math.PI) * radius;
             bz = Math.sin(t + Math.PI) * radius;
         }
      } else if (shape === ShapeType.LOTUS) {
         const k = 5;
         const t = (i / config.count) * Math.PI * 10;
         const r = Math.cos(k * t) * 3;
         bx = r * Math.cos(t);
         bz = r * Math.sin(t);
         by = Math.abs(r) * 0.5 - 1.5;
      } else if (shape === ShapeType.TREE) {
         if (i % 5 === 0) {
            bx = rx * 4;
            bz = rz * 4;
            const fallSpeed = 0.8;
            by = 3 - ((time * fallSpeed + Math.abs(ry) * 5) % 6);
         } else {
            const t = i / config.count;
            const spiralTurns = 12;
            const height = 4;
            const maxWidth = 1.8;
            const yPos = t * height - (height/2);
            const r = (1 - t) * maxWidth; 
            const angle = t * Math.PI * 2 * spiralTurns;
            bx = Math.cos(angle) * r;
            bz = Math.sin(angle) * r;
            by = yPos - 0.5;
            bx += rx * 0.15;
            bz += rz * 0.15;
            by += ry * 0.15;
         }
      } else if (shape === ShapeType.SINGULARITY) {
          // Accretion Disk Math
          const angle = (i / config.count) * Math.PI * 40 + time * (1 + Math.random());
          // Logarithmic spiral distribution
          const r = 0.5 + Math.pow(Math.random(), 2) * 4; 
          bx = Math.cos(angle) * r;
          bz = Math.sin(angle) * r;
          // Warping near center
          by = (Math.sin(r * 2 - time * 2) * 0.2) / r; 
          
          // Event horizon glow center
          if (r < 1) {
             by += (Math.random() - 0.5) * 0.5;
          }
      } else if (shape === ShapeType.EXPLOSION) {
         // sphere base
      }

      // 2. Apply Wave/Noise
      let x = bx + rx * chaos * Math.sin(time * 2 + i);
      let y = by + ry * chaos * Math.cos(time * 1.5 + i);
      let z = bz + rz * chaos * Math.sin(time + i);

      // 3. Apply Expansion
      if (shape === ShapeType.EXPLOSION) {
          const exp = (time * config.speed) % 5;
          x = rx * exp * 5;
          y = ry * exp * 5;
          z = rz * exp * 5;
      } else if (shape !== ShapeType.TREE && shape !== ShapeType.SINGULARITY) {
          x *= expansion;
          y *= expansion;
          z *= expansion;
      } else if (shape === ShapeType.TREE) {
         const treeBreath = 1 + Math.sin(time) * 0.05 + (audioEnergy * 0.2);
         x *= treeBreath;
         y *= treeBreath;
         z *= treeBreath;
      } else if (shape === ShapeType.SINGULARITY) {
          // Singularity breathes heavily with audio
          const eventHorizon = 1 + audioEnergy * 0.5;
          x *= eventHorizon;
          z *= eventHorizon;
          y *= (1 + audioEnergy * 2); // Spikes vertically
      }

      // 4. Global Rotation
      const cosR = Math.cos(time * rotationSpeed);
      const sinR = Math.sin(time * rotationSpeed);
      const rotX = x * cosR - z * sinR;
      const rotZ = x * sinR + z * cosR;
      const rotY = y;

      // 5. ATTRACTION PHYSICS
      if (leftTarget || rightTarget) {
          const pVec = new THREE.Vector3(rotX, rotY, rotZ);
          
          if (leftTarget) {
              const dist = pVec.distanceTo(leftTarget);
              if (dist < 2.5) {
                  pVec.lerp(leftTarget, 0.1 * (1 - dist/2.5));
                  pVec.x += Math.sin(time * 10) * 0.05;
              }
          }
          if (rightTarget) {
              const dist = pVec.distanceTo(rightTarget);
              if (dist < 2.5) {
                  pVec.lerp(rightTarget, 0.1 * (1 - dist/2.5));
                  pVec.x -= Math.sin(time * 10) * 0.05;
              }
          }
          tempObject.position.copy(pVec);
      } else {
          tempObject.position.set(rotX, rotY, rotZ);
      }

      // Scale
      let scale = config.size * (1 + Math.sin(time * 3 + i) * 0.3); 
      // Audio beat scale
      scale *= (1 + audioEnergy * 2);
      
      if (shape === ShapeType.TREE && i % 5 === 0) scale *= 0.5;
      if (shape === ShapeType.SINGULARITY && i % 10 === 0) scale *= 3; // Occasional massive stars

      tempObject.scale.set(scale, scale, scale);
      
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      // Color
      if (shape === ShapeType.TREE) {
         if (i % 5 === 0) tempColor.set('#ffffff');
         else {
             const type = i % 4;
             if (type === 0) tempColor.set('#0f6b36'); 
             else if (type === 1) tempColor.set('#ff0033'); 
             else if (type === 2) tempColor.set('#ffd700'); 
             else tempColor.set('#00ff66'); 
         }
         const blink = 1 + Math.sin(time * 8 + i * 132) * 0.5 + audioEnergy * 2;
         tempColor.multiplyScalar(blink);
      } else if (shape === ShapeType.SINGULARITY) {
          // Event Horizon Colors: Black center, accretion disk colors
          const dist = Math.sqrt(rotX*rotX + rotZ*rotZ);
          if (dist < 0.8) {
              tempColor.set('#000000'); // Void
          } else {
              tempColor.set(targetColor);
              // Shift hue based on radius - Doppler effect visualization
              tempColor.offsetHSL((2 - dist) * 0.1 + audioEnergy, 0, 0); 
              // Brightness boost from audio
              tempColor.multiplyScalar(1 + audioEnergy * 3);
          }
      } else {
        tempColor.set(targetColor);
        const dist = Math.sqrt(rotX*rotX + rotY*rotY);
        // Audio changes Hue slightly
        tempColor.offsetHSL(dist * 0.02 + (audioEnergy * 0.2), 0, 0);
        // Audio boosts brightness
        tempColor.multiplyScalar(1 + audioEnergy); 
      }
      
      meshRef.current.setColorAt(i, tempColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
        <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, config.count]}
        frustumCulled={false} 
        >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
            map={particleTexture}
            toneMapped={false} 
            transparent 
            opacity={0.8} 
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
        />
        </instancedMesh>

        {/* Cursors Pulse to Audio */}
        <mesh ref={leftCursorRef} visible={false}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="white" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
            <pointLight distance={3} intensity={2} color={color} />
        </mesh>
        
        <mesh ref={rightCursorRef} visible={false}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="white" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
            <pointLight distance={3} intensity={2} color={color} />
        </mesh>
    </>
  );
};