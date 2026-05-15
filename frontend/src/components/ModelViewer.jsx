import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, PerspectiveCamera } from '@react-three/drei';
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

// Loading Component
const ModelLoading = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-10">
    <Loader2 className="text-indigo-600 animate-spin mb-3" size={40} />
    <p className="text-slate-500 font-bold text-sm animate-pulse">Building 3D Scene...</p>
  </div>
);

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
      <div className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200 shadow-sm pointer-events-none">
        3D PREVIEW: Rotate (Left Click) • Zoom (Scroll)
      </div>
      
      <Suspense fallback={<ModelLoading />}>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [5, 5, 5], fov: 45 }}>
          <Stage environment="city" intensity={0.5} contactShadow={true} adjustCamera={true}>
            <Model url={url} />
          </Stage>
          <OrbitControls 
            enableDamping={true} 
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.8}
            makeDefault 
          />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default React.memo(ModelViewer);
