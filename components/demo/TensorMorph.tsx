import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FontLoader, TextGeometry, MeshSurfaceSampler } from 'three-stdlib';

const FONT_URL = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

// 1. PHASE 1: CHAOS (Simulating "Noise Reduction" challenge)
function getNoisePoints(count: number) {
  const points = [];
  for (let i = 0; i < count; i++) {
    // Spread widely
    points.push(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
  }
  return new Float32Array(points);
}

// 2. PHASE 2: TENSOR GRID (Simulating "Compression" & "Tensor Algebra")
function getGridPoints(count: number) {
  const points = [];
  // Calculate distinct points for a cubic grid
  const dim = Math.floor(Math.pow(count, 1/3));
  const gap = 0.5; // Spacing between voxels
  const offset = (dim * gap) / 2;

  for (let x = 0; x < dim; x++) {
    for (let y = 0; y < dim; y++) {
      for (let z = 0; z < dim; z++) {
        points.push(
          x * gap - offset,
          y * gap - offset,
          z * gap - offset
        );
      }
    }
  }
  // Fill remaining points to match count (hidden inside)
  const remainder = count - (dim * dim * dim);
  for(let i=0; i<remainder; i++) points.push(0,0,0);

  return new Float32Array(points);
}

// 3. PHASE 3: LOGO (The "Machine Learning Layer")
function getTextPoints(font: any, text: string, count: number) {
  const geometry = new TextGeometry(text, {
    font: font,
    size: 1.2,
    height: 0.2,
    curveSegments: 12,
  });

  geometry.computeBoundingBox();
  const centerOffset = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
  geometry.translate(centerOffset, -0.6, 0);

  const mesh = new THREE.Mesh(geometry);
  const sampler = new MeshSurfaceSampler(mesh).build();
  const tempPosition = new THREE.Vector3();
  const points = [];

  for (let i = 0; i < count; i++) {
    sampler.sample(tempPosition);
    points.push(tempPosition.x, tempPosition.y, tempPosition.z);
  }
  return new Float32Array(points);
}

interface TensorMorphProps {
  onComplete?: () => void;
}

const TensorMorphInner = ({ onComplete }: TensorMorphProps) => {
  const font = useLoader(FontLoader, FONT_URL);
  const count = 5000; // High density for "Sensing" look
  const ref = useRef<THREE.Points>(null);

  // State: 0 = Noise, 1 = Tensor, 2 = Logo
  const [phase, setPhase] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const noiseCoords = useMemo(() => getNoisePoints(count), []);
  const gridCoords = useMemo(() => getGridPoints(count), []); // The Cube
  const textCoords = useMemo(() => getTextPoints(font, "AICV", count), [font]);

  const positions = useMemo(() => new Float32Array(noiseCoords), [noiseCoords]);

  // Mouse move effect for "Sensor Interference"
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: -(event.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const currentPositions = ref.current.geometry.attributes.position.array as Float32Array;

    // Speed of morph
    const lerpSpeed = delta * 3.5;

    // Determine Target based on Phase
    let targetBuffer;
    if (phase === 0) targetBuffer = noiseCoords;
    else if (phase === 1) targetBuffer = gridCoords;
    else targetBuffer = textCoords;

    for (let i = 0; i < count * 3; i++) {
      // 1. LERP to target position
      currentPositions[i] += (targetBuffer[i] - currentPositions[i]) * lerpSpeed;

      // 2. Add "Sensor Noise" (Brownian motion)
      // This matches the "Noise Reduction" concept on the slide
      const noiseIntensity = phase === 1 ? 0.005 : 0.02; // Stable in Tensor mode, chaotic otherwise
      currentPositions[i] += (Math.random() - 0.5) * noiseIntensity;

      // 3. Add mouse interference effect (Sensor Calibration)
      if (phase === 0 || phase === 1) {
        const interferenceStrength = 0.1;
        const distance = Math.sqrt(mousePos.x * mousePos.x + mousePos.y * mousePos.y);
        const wave = Math.sin(distance * 10 - state.clock.elapsedTime * 5) * interferenceStrength;
        currentPositions[i] += wave * Math.exp(-distance * 2); // Exponential falloff
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true;

    // Rotate the TENSOR/CUBE slowly
    if (phase === 1) {
        ref.current.rotation.y += delta * 0.2;
        ref.current.rotation.x += delta * 0.1;
    } else {
        // Reset rotation for text
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, 0, delta * 2);
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, delta * 2);
    }

    // Add subtle shimmer to final AICV text
    if (phase === 2) {
      for (let i = 0; i < count * 3; i += 3) {
        const shimmerX = Math.sin(state.clock.elapsedTime * 3 + i * 0.01) * 0.005;
        const shimmerY = Math.cos(state.clock.elapsedTime * 2.5 + i * 0.015) * 0.003;
        const shimmerZ = Math.sin(state.clock.elapsedTime * 4 + i * 0.02) * 0.002;

        currentPositions[i] += shimmerX * delta;
        currentPositions[i + 1] += shimmerY * delta;
        currentPositions[i + 2] += shimmerZ * delta;
      }
    }
  });

  const handleClick = () => {
      if (phase < 2) setPhase(phase + 1);
      else if (onComplete) onComplete();
  };

  // Color Logic:
  // Phase 0 (Noise) = Grey/White (Raw)
  // Phase 1 (Tensor) = Cyan/Blue (Processed)
  // Phase 2 (Text) = White/Blue Gradient (Final)
  const getColor = () => {
    if (phase === 0) return "#8899ac"; // Grey/White for raw noise
    if (phase === 1) return "#22d3ee"; // Cyan/Blue for tensor
    return "#ffffff"; // White for final AICV text
  };

  return (
    <>
      <Points
        ref={ref}
        positions={positions}
        stride={3}
        onClick={handleClick}
      >
        <PointMaterial
          transparent
          color={getColor()}
          size={0.06}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          // Square shape makes it look like voxels/data (no texture = GL_POINTS squares)
          map={null}
        />
      </Points>

      {/* Add bloom effect for tensor and final phases */}
      {phase >= 1 && (
        <EffectComposer>
          <Bloom
            intensity={phase === 1 ? 0.8 : 0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.025}
          />
        </EffectComposer>
      )}
    </>
  );
};

export const TensorMorph = ({ onComplete }: TensorMorphProps) => {
  const [currentPhase, setCurrentPhase] = useState(0);

  const handlePhaseComplete = () => {
    if (currentPhase < 2) {
      setCurrentPhase(currentPhase + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center relative">
      <div className="absolute top-10 text-cyan-500/50 font-mono text-xs tracking-[0.3em] z-10 border border-cyan-500/30 px-4 py-1 rounded">
        TENSOR SENSING CALIBRATION
      </div>

      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
         {/* Optional: Add light to give depth to the cube */}
        <ambientLight intensity={0.5} />
        <TensorMorphInner onComplete={handlePhaseComplete} />
      </Canvas>

      <div className="absolute bottom-10 text-slate-500 font-mono text-xs animate-pulse">
        CLICK TO PROCESS SIGNAL
      </div>
    </div>
  );
};
