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

function CapModel({ color, artworkUrl }: { color?: string; artworkUrl?: string }) {
  const targetHex = useMemo(() => resolveHexColor(color), [color]);
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current && !state.controls) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef} dispose={null} position={[0, -0.5, 0]}>
      {/* Cap Crown (Dome) */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={targetHex} roughness={0.8} metalness={0.1} side={THREE.DoubleSide} />
        {artworkUrl && (
          <SafeDecal url={artworkUrl} />
        )}
      </mesh>

      {/* Cap Visor */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0.8]} rotation={[-0.2, 0, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.05, 32, 1, false, Math.PI * 0.25, Math.PI * 0.5]} />
        <meshStandardMaterial color={targetHex} roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Top Button */}
      <mesh castShadow receiveShadow position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={targetHex} roughness={0.8} metalness={0.1} />
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
        position={[0, 0.5, 1]} // Front of the cap crown
        rotation={[0, 0, 0]} 
        scale={[0.8, 0.8, 0.8]}
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

export function Cap3DPreview({ color, artworks }: { color?: string; artworks: Record<string, any> }) {
  const [loading, setLoading] = useState(true);
  const artworkUrl = artworks['front']?.previewUrl || Object.values(artworks)[0]?.previewUrl;

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full bg-gradient-to-b from-gray-50 to-gray-200 rounded-2xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-purple-600">Loading 3D Cap...</p>
            </div>
          </div>
        )}
        <Canvas shadows camera={{ position: [0, 1, 5], fov: 45 }} onCreated={() => setLoading(false)}>
          <ambientLight intensity={0.6} />
          <spotLight position={[5, 8, 5]} angle={0.2} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-5, -5, -5]} intensity={0.3} />
          
          <Suspense fallback={null}>
            <Center>
              <CapModel color={color} artworkUrl={artworkUrl} />
            </Center>
            <Environment preset="city" />
            <ContactShadows position={[0, -1.0, 0]} opacity={0.5} scale={5} blur={2} far={2} />
          </Suspense>
          <OrbitControls 
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minDistance={3}
            maxDistance={8}
          />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
