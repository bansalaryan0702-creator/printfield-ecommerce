import React, { useRef, useMemo, Suspense, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls, 
  Environment, 
  Decal, 
  useTexture,
  ContactShadows,
  Center
} from "@react-three/drei";
import * as THREE from "three";
import { ErrorBoundary } from "./ErrorBoundary";

function resolveHexColor(color: string | undefined): string {
  if (!color) return "#ffffff";
  const c = color.toLowerCase().trim();
  const hexMap: Record<string, string> = {
    white: "#ffffff", black: "#1a1a1a", "navy blue": "#1e3a8a", red: "#ef4444",
    green: "#22c55e", "royal blue": "#2563eb", maroon: "#7f1d1d", grey: "#9ca3af",
    yellow: "#eab308", "heather grey": "#d1d5db", "bottle green": "#14532d",
    purple: "#7e22ce", orange: "#f97316", pink: "#ec4899", "light blue": "#38bdf8",
    beige: "#f5f5dc", brown: "#8b4513", teal: "#14b8a6", "olive green": "#4d7c0f",
    mustard: "#fbbf24", charcoal: "#374151"
  };
  return hexMap[c] || (c.startsWith("#") ? c : "#ffffff");
}

function ShirtModel({ color, artworks }: { color?: string; artworks?: Record<string, any> }) {
  const targetHex = useMemo(() => resolveHexColor(color), [color]);
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current && !state.controls) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef} dispose={null} position={[0, -0.5, 0]}>
      {/* Torso */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 1.8, 0.4]} />
        <meshStandardMaterial color={targetHex} roughness={0.8} metalness={0.1} />
        {artworks && artworks['front-full'] && artworks['front-full'].previewUrl && (
          <SafeDecal url={artworks['front-full'].previewUrl} position={[0, 0.2, 0.2]} scale={[0.6, 0.6, 0.6]} />
        )}
        {artworks && artworks['front-chest'] && artworks['front-chest'].previewUrl && (
          <SafeDecal url={artworks['front-chest'].previewUrl} position={[-0.3, 0.5, 0.2]} scale={[0.2, 0.2, 0.2]} />
        )}
      </mesh>

      {/* Left Sleeve */}
      <mesh castShadow receiveShadow position={[-0.8, 1.0, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.6, 0.8, 0.35]} />
        <meshStandardMaterial color={targetHex} roughness={0.8} metalness={0.1} />
        {artworks && artworks['sleeve-left'] && artworks['sleeve-left'].previewUrl && (
          <SafeDecal url={artworks['sleeve-left'].previewUrl} position={[-0.2, 0, 0.18]} rotation={[0, 0, -0.5]} scale={[0.2, 0.2, 0.2]} />
        )}
      </mesh>
      
      {/* Right Sleeve */}
      <mesh castShadow receiveShadow position={[0.8, 1.0, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.6, 0.8, 0.35]} />
        <meshStandardMaterial color={targetHex} roughness={0.8} metalness={0.1} />
        {artworks && artworks['sleeve-right'] && artworks['sleeve-right'].previewUrl && (
          <SafeDecal url={artworks['sleeve-right'].previewUrl} position={[0.2, 0, 0.18]} rotation={[0, 0, 0.5]} scale={[0.2, 0.2, 0.2]} />
        )}
      </mesh>

      {/* Neck hole */}
      <mesh castShadow receiveShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 32]} />
        <meshStandardMaterial color={targetHex} roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}

function SafeDecal({ url, position = [0, 0, 1], rotation = [0, 0, 0], scale = [1, 1, 1] }: { url: string, position?: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number] }) {
  try {
    const texture = useTexture(url);
    if (!texture) return null;
    texture.anisotropy = 16;
    
    return (
      <Decal
        position={position}
        rotation={rotation} 
        scale={scale}
      >
        <meshStandardMaterial
          map={texture}
          transparent
          polygonOffset
          polygonOffsetFactor={-1}
          roughness={0.8}
          metalness={0.1}
        />
      </Decal>
    );
  } catch (err) {
    return null;
  }
}

export function Shirt3DPreview({ color, artworks, activePlacement, isPolo }: { color?: string; artworks?: Record<string, any>; activePlacement?: string; isPolo?: boolean }) {
  const [loading, setLoading] = useState(true);

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full bg-gradient-to-b from-gray-50 to-gray-200 rounded-2xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-purple-600">Loading 3D Shirt...</p>
            </div>
          </div>
        )}
        <Canvas shadows camera={{ position: [0, 1, 4], fov: 45 }} onCreated={() => setLoading(false)}>
          <ambientLight intensity={0.6} />
          <spotLight position={[5, 8, 5]} angle={0.2} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-5, -5, -5]} intensity={0.3} />
          
          <Suspense fallback={null}>
            <Center>
              <ShirtModel color={color} artworks={artworks || {}} />
            </Center>
            <Environment preset="city" />
            <ContactShadows position={[0, -1.0, 0]} opacity={0.5} scale={5} blur={2} far={2} />
          </Suspense>
          <OrbitControls 
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minDistance={2}
            maxDistance={8}
          />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
