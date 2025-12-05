import React from 'react';
import { MorphingLogo } from '../components/demo/MorphingLogo';

const MorphingLogoDemo: React.FC = () => {
  const handleComplete = () => {
    console.log('Morphing animation completed!');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Morphing Logo Demo
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            A particle-based morphing animation that transitions from a chaotic "banana" shape
            to the text "AICV" on click. Built with Three.js and React Three Fiber.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <MorphingLogo onComplete={handleComplete} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-4">How it works:</h2>
            <div className="text-left text-slate-300 space-y-2">
              <p><strong>State A (Banana):</strong> Particles arranged in a chaotic, organic shape</p>
              <p><strong>State B (AICV):</strong> Particles distributed evenly over 3D text geometry</p>
              <p><strong>The Morph:</strong> Linear interpolation between positions on click</p>
              <p><strong>Animation:</strong> Breathing effect in banana state, smooth transition to text</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MorphingLogoDemo;
