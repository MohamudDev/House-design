import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, useProgress } from '@react-three/drei';
import { Box, Loader2, AlertTriangle } from 'lucide-react';

// Improved Error Component
const ModelError = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
    <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-4">
      <AlertTriangle size={32} />
    </div>
    <p className="font-bold text-slate-800">3D View Unavailable</p>
    <p className="text-xs mt-1">This specific model couldn't be rendered. Please check other designs.</p>
  </div>
);

// HTML Loading Overlay OUTSIDE Canvas
const LoadingOverlay = () => {
  const { progress, active } = useProgress();
  
  if (!active) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center p-6 bg-white/95 rounded-2xl shadow-2xl w-56 border border-slate-100">
        <Loader2 className="text-indigo-600 animate-spin mb-4" size={36} />
        <p className="text-slate-800 font-bold text-sm tracking-wide">Loading 3D Model...</p>
        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden shadow-inner">
          <div className="bg-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

const Model = ({ url }) => {
  try {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch (err) {
    console.error("3D Model Loading Error:", err);
    return null; // Let the ErrorBoundary or Suspense handle it
  }
};

const ModelViewer = ({ url }) => {
  if (!url) return <ModelError />;

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-50 rounded-2xl overflow-hidden relative group">
      <LoadingOverlay />
      
      <div className="absolute bottom-4 left-4 z-20 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200 shadow-sm pointer-events-none">
        Rotate (Left Click) • Zoom (Scroll)
      </div>
      
      <Canvas shadows dpr={1} camera={{ position: [5, 5, 5], fov: 45 }} performance={{ min: 0.5 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[512, 512]} />
        <Suspense fallback={null}>
          <Stage environment={null} intensity={0} contactShadow={false} adjustCamera={true}>
            <Model url={url} />
          </Stage>
        </Suspense>
        
        <OrbitControls 
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={1.2}
          zoomSpeed={1.5}
          panSpeed={1.2} 
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.8}
          makeDefault 
        />
      </Canvas>
    </div>
  );
};

export default React.memo(ModelViewer);
