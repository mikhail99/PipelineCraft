import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Points, PointMaterial, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FontLoader } from 'three-stdlib';
import { TextGeometry } from 'three-stdlib';
import { MeshSurfaceSampler } from 'three-stdlib';
import { Font } from 'three-stdlib';

// 1. Load a font (You can point this to any standard Typeface JSON)
const FONT_URL = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

// 2. Generate Banana Coords (The "Chaos" State)
function getBananaPoints(count: number) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const angle = (t - 0.5) * Math.PI * 0.8;
    const radius = 0.4 + (Math.sin(t * Math.PI) * 0.3);
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;

    points.push(
      Math.cos(angle) * (2 * t - 1) * 3,      // x
      Math.sin(angle) * (2 * t - 1) * 2 + Math.sin(theta) * r, // y
      Math.cos(theta) * r                     // z
    );
  }
  return new Float32Array(points);
}

// 3. Generate Text Coords (The "Order" State)
function getTextPoints(font: Font, text: string, count: number) {
  const geometry = new TextGeometry(text, {
    font: font,
    size: 1.5,
    height: 0.2, // Thickness
    curveSegments: 12,
  });

  geometry.computeBoundingBox();
  // Center the geometry roughly
  const centerOffset = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
  geometry.translate(centerOffset, -0.75, 0);

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

interface MorphingLogoProps {
  onComplete?: () => void;
}

const MorphingLogoInner = ({ onComplete }: MorphingLogoProps) => {
  const font = useLoader(FontLoader, FONT_URL);
  const count = 4000;
  const ref = useRef<THREE.Points>(null);
  const [morphing, setMorphing] = useState(false);
  const [morphProgress, setMorphProgress] = useState(0);

  // Pre-calculate both states
  const bananaCoords = useMemo(() => getBananaPoints(count), []);
  const textCoords = useMemo(() => getTextPoints(font, "AICV", count), [font]);

  // Current positions buffer
  const positions = useMemo(() => new Float32Array(bananaCoords), [bananaCoords]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Get the raw buffer to mutate directly for performance
    const currentPositions = ref.current.geometry.attributes.position.array as Float32Array;

    const lerpSpeed = delta * 4; // Speed of morph

    if (morphing) {
      // Update morph progress
      const newProgress = Math.min(morphProgress + delta * 2, 1);
      setMorphProgress(newProgress);

      // Move towards AICV shape
      for (let i = 0; i < count * 3; i++) {
        const target = textCoords[i];
        currentPositions[i] += (target - currentPositions[i]) * lerpSpeed;
      }

      // Add subtle holographic shimmer when fully morphed
      if (morphProgress > 0.8) { // Start shimmering when mostly morphed
        for (let i = 0; i < count * 3; i += 3) {
          // Create subtle floating motion around the text surface
          const shimmerX = Math.sin(state.clock.elapsedTime * 3 + i * 0.01) * 0.01;
          const shimmerY = Math.cos(state.clock.elapsedTime * 2.5 + i * 0.015) * 0.008;
          const shimmerZ = Math.sin(state.clock.elapsedTime * 4 + i * 0.02) * 0.005;

          currentPositions[i] += shimmerX * delta * 2;
          currentPositions[i + 1] += shimmerY * delta * 2;
          currentPositions[i + 2] += shimmerZ * delta * 2;
        }
      }
    } else {
      // Reset progress
      setMorphProgress(0);

      // "Breathing" animation for the banana
      // We use the original banana coord as the 'anchor' and add noise
      for (let i = 0; i < count * 3; i++) {
        const anchor = bananaCoords[i];
        // Creating a gentle wave effect
        const noise = Math.sin(state.clock.elapsedTime * 2 + i) * 0.005;
        currentPositions[i] = anchor + noise;
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true;

    // Slight rotation for 3D effect
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, morphing ? 0 : state.clock.elapsedTime * 0.2, 0.05);
  });

  const handleClick = () => {
    setMorphing(true);
    if (onComplete) {
      setTimeout(onComplete, 2000); // Trigger completion after 2 seconds
    }
  };

  // Interpolate color from yellow to cyan based on morph progress
  const color = morphing
    ? new THREE.Color().lerpColors(
        new THREE.Color("#FACC15"), // Yellow
        new THREE.Color("#22d3ee"), // Cyan
        morphProgress
      )
    : new THREE.Color("#FACC15"); // Yellow

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
          color={color}
          size={0.04}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* Add bloom effect when morphing (cyan phase) */}
      {morphing && (
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.025}
          />
        </EffectComposer>
      )}
    </>
  );
};

export const MorphingLogo = ({ onComplete }: MorphingLogoProps) => {
  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <Center>
          <MorphingLogoInner onComplete={onComplete} />
        </Center>
      </Canvas>
      <div className="absolute bottom-10 text-slate-500 font-mono text-xs animate-pulse">
        CLICK TO COMPILE
      </div>
    </div>
  );
};
