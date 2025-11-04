"use client";

/*
  Bus3D component

  Notes:
  - To replace the default procedural bus with the Sketchfab Mercedes-Benz Tourismo model
    download the model from Sketchfab (only if the model's license allows export/download).
    Sketchfab does not provide a direct glTF URL for arbitrary models; you'll need to export
    the glTF/GLB file and place it in the `public/models/mercedes-tourismo/` folder of this
    project (example path: `public/models/mercedes-tourismo/scene.gltf`).

  - After placing the exported glTF/GLB file, pass its path to the component via the
    `modelPath` prop (or use the default path `/models/mercedes-tourismo/scene.gltf`).

  Example usage in JSX:
    <Bus3D modelPath="/models/mercedes-tourismo/scene.gltf" />

*/

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import { useTheme } from '@/contexts/ThemeContext';
import * as THREE from 'three';

function ThreeDText({ text = 'BUS TRAVEL', fontSize = 0.9 }: { text?: string; fontSize?: number }) {
  const ref = useRef<THREE.Group>(null);
  const { theme } = useTheme();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      <Text
        fontSize={fontSize}
        maxWidth={6}
        lineHeight={1}
        letterSpacing={-0.02}
        anchorX="center"
        anchorY="middle"
        color={theme === 'dark' ? '#60A5FA' : '#1E40AF'}
      >
        {text}
        <meshStandardMaterial metalness={0.6} roughness={0.2} emissive={theme === 'dark' ? '#0ea5e9' : '#ffffff'} emissiveIntensity={0.02} />
      </Text>
    </group>
  );
}

// Note: GLTF loader removed — Bus3D now uses 3D text only. If you later
// want to load external models, re-add useGLTF import from @react-three/drei
// and implement a ModelFromGLTF component.

export default function Bus3D({ text }: { text?: string }) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lower DPR on mobile for better performance
  const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1.4) : Math.min(window.devicePixelRatio || 1, 2);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: isMobile ? [0, 1.2, 5] : [0, 1.5, 6], fov: 45 }}
        dpr={dpr}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={theme === 'dark' ? 0.4 : 0.8} />
        <directionalLight position={[5, 10, 5]} intensity={theme === 'dark' ? 0.8 : 1.2} />
        <pointLight position={[-10, -10, -10]} intensity={theme === 'dark' ? 0.2 : 0.4} />

  <ThreeDText text={text} fontSize={isMobile ? 0.7 : 0.9} />

        <OrbitControls
          // allow pinch-to-zoom on mobile, but disable panning
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          // slower auto-rotate for mobile to keep things calm
          autoRotate
          autoRotateSpeed={isMobile ? 0.6 : 1}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
          // touch action should work by default; ensure rotate on touch is enabled
        />

        <Environment preset={theme === 'dark' ? 'night' : 'sunset'} />
      </Canvas>
    </div>
  );
}
