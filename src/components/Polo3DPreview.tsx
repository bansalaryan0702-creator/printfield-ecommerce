import React, { useRef, useEffect, useState, Suspense, Component, ReactNode, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export interface ArtworkAdjustment {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export const DEFAULT_ADJUSTMENT: ArtworkAdjustment = { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.error('3D error:', e); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D preview could not load</p>
            <button onClick={() => this.setState({ hasError: false })} className="text-xs text-purple-600 font-medium">Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function applyColor(scene: THREE.Group, color: string) {
  const targetColor = new THREE.Color(color);
  const white = new THREE.Color(1, 1, 1);

  const bodyBox = new THREE.Box3().setFromObject(scene);
  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const bodyVol = bodySize.x * bodySize.y * bodySize.z;
  const btnMeshes = new Set<THREE.Mesh>();
  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    if ((c as any).userData?.isArtwork) return;
    const b = new THREE.Box3().setFromObject(c);
    const s = b.getSize(new THREE.Vector3());
    const v = s.x * s.y * s.z;
    const small = v < bodyVol * 0.005;
    const nearTop = b.min.y > bodyBox.max.y - bodySize.y * 0.35;
    const named = (c.name || '').toLowerCase().includes('button') || (c.name || '').toLowerCase().includes('btn');
    if (named || (small && nearTop)) btnMeshes.add(c);
  });

  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    if ((c as any).userData?.isArtwork) return;
    c.castShadow = false;
    c.receiveShadow = false;
    const isBtn = btnMeshes.has(c);
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    mats.forEach((m) => {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.map = null; m.normalMap = null; m.aoMap = null; m.emissiveMap = null;
        m.color.copy(isBtn ? white : targetColor);
        m.roughness = isBtn ? 0.3 : 0.85;
        m.metalness = isBtn ? 0.15 : 0;
        m.needsUpdate = true;
      } else if (m instanceof THREE.MeshPhongMaterial) {
        m.map = null; m.normalMap = null;
        m.color.copy(isBtn ? white : targetColor);
        m.specular.set(isBtn ? 0x444444 : 0x111111);
        m.shininess = isBtn ? 30 : 5;
        m.needsUpdate = true;
      }
    });
  });
}

function centerModel(scene: THREE.Group) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    c.geometry.computeBoundingBox();
    if (c.geometry.boundingBox) {
      box.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld));
    }
  });
  if (box.isEmpty()) box.setFromObject(scene);

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  scene.scale.setScalar(3.0 / maxDim);
  scene.updateMatrixWorld(true);

  const nb = new THREE.Box3();
  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    c.geometry.computeBoundingBox();
    if (c.geometry.boundingBox) {
      nb.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld));
    }
  });
  if (nb.isEmpty()) nb.setFromObject(scene);
  const nc = nb.getCenter(new THREE.Vector3());
  const nm = nb.min;
  scene.position.set(-nc.x, -nm.y, -nc.z);

  scene.updateMatrixWorld(true);
  const finalBox = new THREE.Box3().setFromObject(scene);
  (scene as any).userData.bounds = finalBox;
  (scene as any).userData.size = finalBox.getSize(new THREE.Vector3());
}

function createCurvedPlaneGeometry(width: number, height: number, segments = 24) {
  const geo = new THREE.PlaneGeometry(width, height, segments, segments);
  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const radius = width * 1.15;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const t = Math.max(-1, Math.min(1, x / radius));
    const angle = Math.asin(t);
    posAttr.setXYZ(i, Math.sin(angle) * radius, y, (Math.cos(angle) - 1) * radius);
  }
  geo.computeVertexNormals();
  return geo;
}

function PoloModel({ color, designImage, placement, adjustment, onReady }: {
  color: string;
  designImage?: string | null;
  placement?: string;
  adjustment?: ArtworkAdjustment;
  onReady?: () => void;
}) {
  const { scene } = useGLTF('/polo3d/polo.glb');
  const groupRef = useRef<THREE.Group>(null);
  const didCenter = useRef(false);
  const artworkRef = useRef<THREE.Mesh | null>(null);
  const hitRef = useRef<{ point: THREE.Vector3; normal: THREE.Vector3; planeWorldScale: number } | null>(null);
  const adjRef = useRef(adjustment || DEFAULT_ADJUSTMENT);
  adjRef.current = adjustment || DEFAULT_ADJUSTMENT;

  function toLocal(worldVec: THREE.Vector3) {
    return worldVec.clone().sub(scene.position).divideScalar(scene.scale.x || 1);
  }

  function getShirtMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    scene.traverse(c => { if (c instanceof THREE.Mesh && !(c as any).userData?.isArtwork) meshes.push(c); });
    return meshes;
  }

  function raycastSurface(meshes: THREE.Mesh[], origin: THREE.Vector3, dir: THREE.Vector3) {
    const rc = new THREE.Raycaster();
    rc.set(origin, dir.normalize());
    const hits = rc.intersectObjects(meshes, false);
    if (hits.length === 0 || !hits[0].face) return null;
    const normal = hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld).normalize();
    return { point: hits[0].point, normal };
  }

  function getPlacementRaycast(place: string, bounds: THREE.Box3) {
    const sz = bounds.getSize(new THREE.Vector3());
    const ctr = bounds.getCenter(new THREE.Vector3());
    const depth = Math.min(sz.x, sz.z);
    switch (place) {
      case 'front-chest':
        return { origin: new THREE.Vector3(ctr.x, bounds.min.y + sz.y * 0.55, bounds.max.z + 10), dir: new THREE.Vector3(0, 0, -1), scale: depth * 0.22 };
      case 'back-full':
        return { origin: new THREE.Vector3(ctr.x, bounds.min.y + sz.y * 0.45, bounds.min.z - 10), dir: new THREE.Vector3(0, 0, 1), scale: depth * 0.35 };
      case 'sleeve-left':
        return { origin: new THREE.Vector3(bounds.min.x - 10, bounds.min.y + sz.y * 0.7, ctr.z), dir: new THREE.Vector3(1, 0, 0), scale: depth * 0.18 };
      case 'sleeve-right':
        return { origin: new THREE.Vector3(bounds.max.x + 10, bounds.min.y + sz.y * 0.7, ctr.z), dir: new THREE.Vector3(-1, 0, 0), scale: depth * 0.18 };
      case 'front-full':
      default:
        return { origin: new THREE.Vector3(ctr.x, bounds.min.y + sz.y * 0.45, bounds.max.z + 10), dir: new THREE.Vector3(0, 0, -1), scale: depth * 0.35 };
    }
  }

  // Reposition existing artwork mesh using current adjustment (no texture reload)
  function applyAdjustmentToMesh(mesh: THREE.Mesh, hit: { point: THREE.Vector3; normal: THREE.Vector3; planeWorldScale: number }, adj: ArtworkAdjustment) {
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(hit.normal, up).normalize();
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);
    const adjustedUp = new THREE.Vector3().crossVectors(right, hit.normal).normalize();

    const worldPoint = hit.point.clone().add(hit.normal.clone().multiplyScalar(0.02));
    const offsetXWorld = adj.offsetX * 0.3;
    const offsetYWorld = adj.offsetY * 0.3;
    const finalWorldPoint = worldPoint.clone()
      .add(right.clone().multiplyScalar(offsetXWorld))
      .add(adjustedUp.clone().multiplyScalar(offsetYWorld));

    mesh.position.copy(toLocal(finalWorldPoint));

    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.normal);
    const adjustedRotation = adj.rotation * (Math.PI / 180);
    if (adjustedRotation !== 0) {
      const rotQ = new THREE.Quaternion().setFromAxisAngle(hit.normal, adjustedRotation);
      q.premultiply(rotQ);
    }
    mesh.quaternion.copy(q);

    mesh.scale.setScalar(adj.scale);
  }

  useEffect(() => {
    if (!scene || didCenter.current) return;
    didCenter.current = true;
    centerModel(scene);
    applyColor(scene, color);
    onReady?.();
  }, [scene]);

  useEffect(() => {
    if (!scene || !didCenter.current) return;
    applyColor(scene, color);
  }, [scene, color]);

  // Effect 1: Load texture + create mesh (only when scene/designImage/placement changes)
  useEffect(() => {
    if (!scene || !designImage || !didCenter.current) {
      if (artworkRef.current) artworkRef.current.visible = false;
      return;
    }

    const bounds = (scene as any).userData.bounds as THREE.Box3 | undefined;
    if (!bounds) return;

    const meshes = getShirtMeshes();
    if (meshes.length === 0) return;

    const { origin, dir, scale: planeWorldScale } = getPlacementRaycast(placement || 'front-full', bounds);
    let hit = raycastSurface(meshes, origin, dir);

    // Fallback: if raycast misses, place at center-front of bounds
    if (!hit) {
      const ctr = bounds.getCenter(new THREE.Vector3());
      const frontZ = (placement || '').includes('back') ? bounds.min.z : bounds.max.z;
      const fallbackOrigin = new THREE.Vector3(ctr.x, bounds.min.y + bounds.getSize(new THREE.Vector3()).y * 0.45, frontZ + (placement || '').includes('back') ? -10 : 10);
      const fallbackDir = new THREE.Vector3(0, 0, (placement || '').includes('back') ? 1 : -1);
      hit = raycastSurface(meshes, fallbackOrigin, fallbackDir);
      if (!hit) {
        // Last resort: just place in front of model center
        hit = {
          point: new THREE.Vector3(ctr.x, bounds.min.y + bounds.getSize(new THREE.Vector3()).y * 0.45, bounds.max.z),
          normal: new THREE.Vector3(0, 0, 1),
        };
      }
    }

    hitRef.current = { ...hit, planeWorldScale };

    const invScale = 1 / (scene.scale.x || 1);
    const adjustedScale = planeWorldScale * adjRef.current.scale;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(designImage, (tex) => buildMesh(tex), undefined, () => {
      loader.load(`/api/proxy-image/${designImage.split('/').pop()}`, (tex) => buildMesh(tex), undefined, () => buildMesh(null));
    });

    function buildMesh(texture: THREE.Texture | null) {
      if (artworkRef.current) {
        scene.remove(artworkRef.current);
        artworkRef.current = null;
      }

      const geoSize = (texture ? adjustedScale * 1.2 : 1) * invScale;
      const geo = createCurvedPlaneGeometry(geoSize, geoSize);
      const mat = new THREE.MeshStandardMaterial({
        ...(texture ? { map: texture } : { color: 0xff0000 }),
        transparent: true, alphaTest: texture ? 0.01 : 0,
        side: THREE.FrontSide, depthWrite: true, roughness: 0.95, metalness: 0.0,
        polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6,
      });
      if (!texture) { mat.opacity = 0.8; }
      const mesh = new THREE.Mesh(geo, mat);
      (mesh as any).userData.isArtwork = true;
      mesh.renderOrder = 10;
      scene.add(mesh);
      artworkRef.current = mesh;
      applyAdjustmentToMesh(mesh, hitRef.current!, adjRef.current);
    }

    return () => { if (artworkRef.current) scene.remove(artworkRef.current); artworkRef.current = null; };
  }, [scene, designImage, placement]);

  // Effect 2: Reapply adjustment instantly when sliders move (no texture reload)
  useEffect(() => {
    if (!artworkRef.current || !hitRef.current) return;
    applyAdjustmentToMesh(artworkRef.current, hitRef.current, adjRef.current);
  }, [adjustment?.offsetX, adjustment?.offsetY, adjustment?.scale, adjustment?.rotation]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12 + 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export function Polo3DPreview({
  color, designImage, placement, className = '',
  adjustment, adjustmentMode, onAdjustChange,
}: {
  color: string;
  designImage?: string | null;
  placement?: string;
  className?: string;
  adjustment?: ArtworkAdjustment;
  adjustmentMode?: boolean;
  onAdjustChange?: (adj: ArtworkAdjustment) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const resolvedColor = color && color.startsWith('#') ? color : '#2962a3';
  const adj = adjustment || DEFAULT_ADJUSTMENT;

  useEffect(() => {
    const t = setTimeout(() => { if (!loaded && !error) setError(true); }, 60000);
    return () => clearTimeout(t);
  }, [loaded, error]);

  const setAdj = useCallback((patch: Partial<ArtworkAdjustment>) => {
    onAdjustChange?.({ ...adj, ...patch });
  }, [adj, onAdjustChange]);

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)' }}
        onCreated={() => setLoaded(true)}
        onError={() => setError(true)}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 5]} intensity={0.7} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />

        <Suspense fallback={null}>
          <ErrorBoundary>
            <PoloModel
              color={resolvedColor}
              designImage={designImage}
              placement={placement}
              adjustment={adj}
              onReady={() => setLoaded(true)}
            />
          </ErrorBoundary>
        </Suspense>

        <OrbitControls
          enablePan={false} enableZoom={true}
          minDistance={4} maxDistance={7}
          minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.5}
          target={[0, 1.2, 0]}
          enableDamping={true} dampingFactor={0.05}
        />
      </Canvas>

      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading 3D Preview...</p>
          <p className="text-xs text-gray-400 mt-1">First load may take 15-30 seconds</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D preview could not load</p>
            <p className="text-xs text-gray-400 mb-2">Model may be too large for your connection</p>
            <button onClick={() => { setError(false); setLoaded(false); }} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Retry</button>
          </div>
        </div>
      )}
      {loaded && !error && !adjustmentMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
          Drag to rotate &bull; Scroll to zoom
        </div>
      )}

      {/* Adjustment sliders overlay */}
      {adjustmentMode && loaded && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 pt-10 z-20">
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-xs font-semibold tracking-wide uppercase">Adjust Artwork Position</span>
              <button
                onClick={() => onAdjustChange?.(DEFAULT_ADJUSTMENT)}
                className="text-[10px] text-purple-300 hover:text-white transition-colors"
              >Reset</button>
            </div>

            <SliderRow label="Left / Right" value={adj.offsetX} min={-1} max={1} step={0.01} onChange={v => setAdj({ offsetX: v })} />
            <SliderRow label="Up / Down"   value={adj.offsetY} min={-1} max={1} step={0.01} onChange={v => setAdj({ offsetY: v })} />
            <SliderRow label="Size"        value={adj.scale}   min={0.3} max={3} step={0.01} onChange={v => setAdj({ scale: v })} />
            <SliderRow label="Rotation"    value={adj.rotation} min={-180} max={180} step={1} onChange={v => setAdj({ rotation: v })} />
          </div>
        </div>
      )}
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/70 text-[11px] w-20 shrink-0 text-right">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 accent-purple-500 bg-white/20 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-white text-[11px] w-12 text-right font-mono tabular-nums">
        {step >= 1 ? value.toFixed(0) : step >= 0.1 ? value.toFixed(1) : value.toFixed(2)}
      </span>
    </div>
  );
}

export default Polo3DPreview;
