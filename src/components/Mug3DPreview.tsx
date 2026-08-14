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

// Same resolve color helper
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

function MugModel({ color, artworkUrl }: { color?: string; artworkUrl?: string }) {
  const targetHex = useMemo(() => resolveHexColor(color), [color]);
  
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Custom rotation for presentation
  useFrame((state) => {
    if (meshRef.current && !state.controls) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef} dispose={null}>
      {/* Mug Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 2.5, 64]} />
        <meshStandardMaterial 
          color={targetHex} 
          roughness={0.1} 
          metalness={0.1}
        />
        {artworkUrl && (
          <SafeDecal url={artworkUrl} />
        )}
      </mesh>
      
      {/* Mug Inside */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 2.5, 64]} />
        <meshStandardMaterial color={targetHex} roughness={0.1} metalness={0.1} side={THREE.BackSide} />
      </mesh>

      {/* Mug Bottom Inside */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.92, 64]} />
        <meshStandardMaterial color={targetHex} roughness={0.1} metalness={0.1} />
      </mesh>

      {/* Mug Handle */}
      <mesh castShadow receiveShadow position={[1, 0, 0]}>
        <torusGeometry args={[0.7, 0.18, 16, 32, Math.PI]} />
        <meshStandardMaterial color={targetHex} roughness={0.1} metalness={0.1} />
      </mesh>
    </group>
  );
}

function SafeDecal({ url }: { url: string }) {
  try {
    const texture = useTexture(url);
    if (!texture) return null;
    texture.anisotropy = 16;
    
    return (
      <Decal
        position={[0, 0, 1]} // Front
        rotation={[0, 0, 0]} 
        scale={[1.5, 1.5, 1.5]}
      >
        <meshStandardMaterial
          map={texture}
          transparent
          polygonOffset
          polygonOffsetFactor={-1}
          roughness={0.2}
          metalness={0.1}
        />
      </Decal>
    );
  } catch (err) {
    return null;
  }
}

export function Mug3DPreview({ color, artworks }: { color?: string; artworks: Record<string, any> }) {
  const [loading, setLoading] = useState(true);
  
  // Use the first artwork or front placement
  const artworkUrl = artworks['front']?.previewUrl || Object.values(artworks)[0]?.previewUrl;

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full bg-gradient-to-b from-gray-50 to-gray-200 rounded-2xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-purple-600">Loading 3D Mug...</p>
            </div>
          </div>
        )}
        <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }} onCreated={() => setLoading(false)}>
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <Center>
              <MugModel color={color} artworkUrl={artworkUrl} />
            </Center>
            <Environment preset="city" />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2} far={2} />
          </Suspense>
          <OrbitControls 
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2 + 0.2}
            minDistance={4}
            maxDistance={8}
          />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
