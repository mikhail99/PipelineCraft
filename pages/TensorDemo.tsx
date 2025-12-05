import React from 'react';
import { TensorMorph } from '../components/demo/TensorMorph';

const TensorDemo: React.FC = () => {
  const handleComplete = () => {
    console.log('Tensor morphing sequence completed!');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Tensor Sensing Demo
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            A three-phase morphing animation representing "Signal to Structure":
            Raw noise → Tensor compression → AICV intelligence
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <TensorMorph onComplete={handleComplete} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-slate-800 rounded-lg p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-4">The Three Phases:</h2>
            <div className="text-left text-slate-300 space-y-3">
              <div className="border-l-4 border-gray-500 pl-4">
                <p><strong className="text-gray-400">Phase 1: The Noise (Raw Data)</strong></p>
                <p>Chaotic cloud of grey/white particles representing raw sensor input and noise reduction challenges.</p>
              </div>
              <div className="border-l-4 border-cyan-500 pl-4">
                <p><strong className="text-cyan-400">Phase 2: The Tensor (Compression)</strong></p>
                <p>Particles snap into a perfect 3D grid cube that rotates, representing tensor algebra and data compression.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <p><strong className="text-blue-400">Phase 3: The Intelligence (AICV)</strong></p>
                <p>Cube unfolds into AICV text with holographic shimmer, representing machine learning and AI processing.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-600">
              <h3 className="text-lg font-semibold text-white mb-2">Technical Features:</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• <strong>Square voxels</strong> instead of round particles for hardware/data aesthetic</li>
                <li>• <strong>Sensor interference</strong> - mouse movement creates distortion waves</li>
                <li>• <strong>Brownian motion</strong> - noise reduction simulation</li>
                <li>• <strong>Bloom effects</strong> for tensor and final phases</li>
                <li>• <strong>Holographic shimmer</strong> on final AICV text</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TensorDemo;
