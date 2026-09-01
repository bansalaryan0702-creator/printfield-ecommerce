import React, { useRef, useEffect, useState, Suspense, Component, ReactNode, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

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
  scene.scale.setScalar(2.6 / maxDim);
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
  scene.position.set(-nc.x, -nc.y, -nc.z);

  scene.updateMatrixWorld(true);
  const finalBox = new THREE.Box3().setFromObject(scene);
  (scene as any).userData.bounds = finalBox;
  (scene as any).userData.size = finalBox.getSize(new THREE.Vector3());
}

function getShirtMeshes(scene: THREE.Group): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  scene.traverse((c) => {
    if (c instanceof THREE.Mesh && !(c as any).userData?.isArtwork) {
      meshes.push(c);
    }
  });
  return meshes;
}

function PoloModel({ color, designImage, placement, adjustment, artworks, onReady }: {
  color: string;
  designImage?: string | null;
  placement?: string;
  adjustment?: ArtworkAdjustment;
  artworks?: Record<string, any>;
  onReady?: () => void;
}) {
  const { scene } = useGLTF('/polo3d/polo.glb');
  const groupRef = useRef<THREE.Group>(null);
  const didCenter = useRef(false);
  const artworkMeshesRef = useRef<THREE.Mesh[]>([]);
  const [textures, setTextures] = useState<Record<string, THREE.Texture>>({});
  const activePlacement = placement || 'front-full';
  const adj = adjustment || DEFAULT_ADJUSTMENT;

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

  // Determine active artworks list
  const activeArtworksList = React.useMemo(() => {
    const list: { placementKey: string; url: string }[] = [];
    if (artworks && Object.keys(artworks).length > 0) {
      Object.entries(artworks).forEach(([key, art]) => {
        const url = art?.previewUrl || (typeof art === 'string' ? art : null);
        if (url) list.push({ placementKey: key, url });
      });
    } else if (designImage) {
      list.push({ placementKey: activePlacement, url: designImage });
    }
    return list;
  }, [artworks, designImage, activePlacement]);

  // Load textures for all active artwork placements
  useEffect(() => {
    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    activeArtworksList.forEach(({ placementKey, url }) => {
      loader.load(
        url,
        (tex) => {
          if (!isMounted) return;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.needsUpdate = true;
          setTextures((prev) => ({ ...prev, [placementKey]: tex }));
        },
        undefined,
        () => {
          const filename = url.split('/').pop() || '';
          loader.load(
            `/api/proxy-image/${filename}`,
            (tex) => {
              if (!isMounted) return;
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.generateMipmaps = true;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.needsUpdate = true;
              setTextures((prev) => ({ ...prev, [placementKey]: tex }));
            },
            undefined,
            () => {}
          );
        }
      );
    });

    return () => {
      isMounted = false;
    };
  }, [activeArtworksList]);

  // Project decals on designated locations
  useEffect(() => {
    // 1. Clean up existing decals
    artworkMeshesRef.current.forEach((mesh) => {
      if (mesh.parent) mesh.parent.remove(mesh);
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material?.dispose();
      }
    });
    artworkMeshesRef.current = [];

    if (!scene || !didCenter.current) return;

    const meshes = getShirtMeshes(scene);
    if (meshes.length === 0) return;

    scene.updateMatrixWorld(true);
    const bounds = (scene as any).userData.bounds as THREE.Box3 | undefined;
    if (!bounds) return;

    const sz = bounds.getSize(new THREE.Vector3());
    const ctr = bounds.getCenter(new THREE.Vector3());

    // DEBUG: Print model structure
    console.log('=== POLO MODEL DEBUG ===');
    console.log('Scene bounds:', { minX: bounds.min.x.toFixed(3), maxX: bounds.max.x.toFixed(3), minY: bounds.min.y.toFixed(3), maxY: bounds.max.y.toFixed(3), minZ: bounds.min.z.toFixed(3), maxZ: bounds.max.z.toFixed(3) });
    console.log('Scene center:', { x: ctr.x.toFixed(3), y: ctr.y.toFixed(3), z: ctr.z.toFixed(3) });
    console.log('Scene size:', { x: sz.x.toFixed(3), y: sz.y.toFixed(3), z: sz.z.toFixed(3) });
    console.log('Total meshes:', meshes.length);
    meshes.forEach((m, i) => {
      m.geometry.computeBoundingBox();
      const mb = m.geometry.boundingBox!;
      const mc = mb.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld);
      const ms = mb.getSize(new THREE.Vector3());
      console.log(`Mesh ${i}: name="${m.name || 'unnamed'}", center=(${mc.x.toFixed(3)}, ${mc.y.toFixed(3)}, ${mc.z.toFixed(3)}), size=(${ms.x.toFixed(3)}, ${ms.y.toFixed(3)}, ${ms.z.toFixed(3)}), vertices=${m.geometry.attributes.position.count}`);
    });

    const newDecalMeshes: THREE.Mesh[] = [];

    activeArtworksList.forEach(({ placementKey }) => {
      const tex = textures[placementKey];
      if (!tex) return;

      const isCurrentActive = placementKey === activePlacement;
      const currentAdj = isCurrentActive ? adj : DEFAULT_ADJUSTMENT;

      let worldRayOrigin: THREE.Vector3;
      let worldRayDir: THREE.Vector3;
      let baseWorldWidth: number;

      switch (placementKey) {
        case 'front-chest': {
          // Left chest logo (neat compact badge on the chest, below collar)
          const baseX = ctr.x + sz.x * 0.15 + currentAdj.offsetX * sz.x * 0.12;
          const baseY = ctr.y + sz.y * 0.14 + currentAdj.offsetY * sz.y * 0.12;
          worldRayOrigin = new THREE.Vector3(baseX, baseY, bounds.max.z + 10);
          worldRayDir = new THREE.Vector3(0, 0, -1);
          baseWorldWidth = sz.x * 0.18;
          break;
        }
        case 'back-full':
        case 'back': {
          // Back print (~38% of chest width, center back)
          const baseX = ctr.x - currentAdj.offsetX * sz.x * 0.18;
          const baseY = ctr.y + sz.y * 0.08 + currentAdj.offsetY * sz.y * 0.18;
          worldRayOrigin = new THREE.Vector3(baseX, baseY, bounds.min.z - 10);
          worldRayDir = new THREE.Vector3(0, 0, 1);
          baseWorldWidth = sz.x * 0.38;
          break;
        }
        case 'sleeve-left': {
          // Left sleeve — find the leftmost mesh and place logo at its center
          const leftMesh = meshes.reduce((leftmost, m) => {
            m.geometry.computeBoundingBox();
            const mb = m.geometry.boundingBox!;
            const mCenterX = mb.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld).x;
            const leftX = leftmost ? leftmost.geometry.boundingBox!.getCenter(new THREE.Vector3()).applyMatrix4(leftmost.matrixWorld).x : Infinity;
            return mCenterX < leftX ? m : leftmost;
          }, null as THREE.Mesh | null);
          
          if (leftMesh) {
            leftMesh.geometry.computeBoundingBox();
            const sleeveBounds = leftMesh.geometry.boundingBox!;
            const sleeveCenter = sleeveBounds.getCenter(new THREE.Vector3()).applyMatrix4(leftMesh.matrixWorld);
            worldRayOrigin = new THREE.Vector3(sleeveCenter.x - 10, sleeveCenter.y + currentAdj.offsetY * sz.y * 0.12, sleeveCenter.z - currentAdj.offsetX * sz.z * 0.12);
            worldRayDir = new THREE.Vector3(1, 0, 0);
            baseWorldWidth = sz.x * 0.155;
          } else {
            // Fallback to original method if no left mesh found
            worldRayOrigin = new THREE.Vector3(bounds.min.x - 10, ctr.y + sz.y * 0.20 + currentAdj.offsetY * sz.y * 0.12, ctr.z + sz.z * 0.70 - currentAdj.offsetX * sz.z * 0.12);
            worldRayDir = new THREE.Vector3(1, 0, 0);
            baseWorldWidth = sz.x * 0.155;
          }
          break;
        }
        case 'sleeve-right': {
          // Right sleeve — find the rightmost mesh and place logo at its center
          const rightMesh = meshes.reduce((rightmost, m) => {
            m.geometry.computeBoundingBox();
            const mb = m.geometry.boundingBox!;
            const mCenterX = mb.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld).x;
            const rightX = rightmost ? rightmost.geometry.boundingBox!.getCenter(new THREE.Vector3()).applyMatrix4(rightmost.matrixWorld).x : -Infinity;
            return mCenterX > rightX ? m : rightmost;
          }, null as THREE.Mesh | null);
          
          if (rightMesh) {
            rightMesh.geometry.computeBoundingBox();
            const sleeveBounds = rightMesh.geometry.boundingBox!;
            const sleeveCenter = sleeveBounds.getCenter(new THREE.Vector3()).applyMatrix4(rightMesh.matrixWorld);
            worldRayOrigin = new THREE.Vector3(sleeveCenter.x + 10, sleeveCenter.y + currentAdj.offsetY * sz.y * 0.12, sleeveCenter.z + currentAdj.offsetX * sz.z * 0.12);
            worldRayDir = new THREE.Vector3(-1, 0, 0);
            baseWorldWidth = sz.x * 0.155;
          } else {
            // Fallback to original method if no right mesh found
            worldRayOrigin = new THREE.Vector3(bounds.max.x + 10, ctr.y + sz.y * 0.20 + currentAdj.offsetY * sz.y * 0.12, ctr.z - sz.z * 0.70 + currentAdj.offsetX * sz.z * 0.12);
            worldRayDir = new THREE.Vector3(-1, 0, 0);
            baseWorldWidth = sz.x * 0.155;
          }
          break;
        }
        case 'front-full':
        case 'front':
        case 'generic':
        default: {
          // Full front chest print (~38% of chest width, center chest on body)
          const baseX = ctr.x + currentAdj.offsetX * sz.x * 0.18;
          const baseY = ctr.y + sz.y * 0.02 + currentAdj.offsetY * sz.y * 0.18;
          worldRayOrigin = new THREE.Vector3(baseX, baseY, bounds.max.z + 10);
          worldRayDir = new THREE.Vector3(0, 0, -1);
          baseWorldWidth = sz.x * 0.38;
          break;
        }
      }

      // Raycast in world coordinates
      const rc = new THREE.Raycaster();
      rc.set(worldRayOrigin, worldRayDir.clone().normalize());
      const hits = rc.intersectObjects(meshes, false);

      // DEBUG: Log raycast results
      if (placementKey === 'sleeve-left' || placementKey === 'sleeve-right') {
        console.log(`[${placementKey}] Ray origin: (${worldRayOrigin.x.toFixed(2)}, ${worldRayOrigin.y.toFixed(2)}, ${worldRayOrigin.z.toFixed(2)}), dir: (${worldRayDir.x.toFixed(2)}, ${worldRayDir.y.toFixed(2)}, ${worldRayDir.z.toFixed(2)})`);
        console.log(`[${placementKey}] Hits: ${hits.length}`);
        hits.slice(0, 5).forEach((h, i) => {
          const mesh = h.object as THREE.Mesh;
          console.log(`  Hit ${i}: mesh="${mesh.name || 'unnamed'}", point=(${h.point.x.toFixed(3)}, ${h.point.y.toFixed(3)}, ${h.point.z.toFixed(3)}), distance=${h.distance.toFixed(3)}`);
        });
      }

      let targetMesh: THREE.Mesh;
      let localHitPoint: THREE.Vector3;
      let localNormal: THREE.Vector3;

      if (hits.length > 0 && hits[0].face) {
        const hit = hits[0];
        targetMesh = hit.object as THREE.Mesh;
        const worldHitPoint = hit.point;
        const worldNormal = hit.face.normal.clone().transformDirection(targetMesh.matrixWorld).normalize();

        const targetWorldToLocal = new THREE.Matrix4().copy(targetMesh.matrixWorld).invert();
        localHitPoint = worldHitPoint.clone().applyMatrix4(targetWorldToLocal);
        localNormal = worldNormal.clone().transformDirection(targetWorldToLocal).normalize();
      } else {
        // Fallback: pick the largest body mesh
        targetMesh = meshes.reduce((maxM, m) => {
          const c1 = m.geometry?.attributes?.position?.count || 0;
          const c2 = maxM.geometry?.attributes?.position?.count || 0;
          return c1 > c2 ? m : maxM;
        }, meshes[0]);

        targetMesh.geometry.computeBoundingBox();
        const lb = targetMesh.geometry.boundingBox || new THREE.Box3();
        const fallbackZ = (placementKey === 'back-full' || placementKey === 'back') ? lb.min.z : lb.max.z;
        localHitPoint = new THREE.Vector3(0, 0, fallbackZ);
        localNormal = (placementKey === 'back-full' || placementKey === 'back') ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
      }

      if (!targetMesh.geometry.attributes.normal) {
        targetMesh.geometry.computeVertexNormals();
      }

      // Calculate decal orientation correctly without horizontal/vertical inversion
      const dummy = new THREE.Object3D();
      dummy.position.copy(localHitPoint);
      dummy.lookAt(localHitPoint.clone().add(localNormal));
      dummy.rotateZ((currentAdj.rotation * Math.PI) / 180);
      const orientation = dummy.rotation;

      // Calculate decal width/height in targetMesh local space
      const meshWorldScale = targetMesh.getWorldScale(new THREE.Vector3());
      let finalLocalWidth = (baseWorldWidth * currentAdj.scale) / (meshWorldScale.x || 1);
      let finalLocalHeight = finalLocalWidth;
      const img = tex?.image as any;
      if (img && img.width && img.height) {
        const aspect = img.width / img.height;
        if (aspect >= 1) {
          finalLocalHeight = finalLocalWidth / aspect;
        } else {
          finalLocalWidth = finalLocalHeight * aspect;
        }
      }

      // Depth projector box strictly confined to surface layer
      const depthSize = Math.max(0.04, Math.max(finalLocalWidth, finalLocalHeight) * 0.6);
      const decalSize = new THREE.Vector3(finalLocalWidth, finalLocalHeight, depthSize);

      const savedMatrixWorld = targetMesh.matrixWorld.clone();
      targetMesh.matrixWorld.identity();
      const decalGeo = new DecalGeometry(targetMesh, localHitPoint, orientation, decalSize);
      targetMesh.matrixWorld.copy(savedMatrixWorld);

      const decalMat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.001,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -12,
        polygonOffsetUnits: -12,
        roughness: 0.85,
        metalness: 0.0,
        side: THREE.FrontSide,
      });

      const decalMesh = new THREE.Mesh(decalGeo, decalMat);
      (decalMesh as any).userData.isArtwork = true;
      decalMesh.renderOrder = 20;

      targetMesh.add(decalMesh);
      newDecalMeshes.push(decalMesh);
    });

    artworkMeshesRef.current = newDecalMeshes;

    return () => {
      artworkMeshesRef.current.forEach((mesh) => {
        if (mesh.parent) mesh.parent.remove(mesh);
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      });
      artworkMeshesRef.current = [];
    };
  }, [scene, textures, activeArtworksList, activePlacement, adj.offsetX, adj.offsetY, adj.scale, adj.rotation]);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle idle subtle breathing rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08 + 0.15;
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
  adjustment, adjustmentMode, onAdjustChange, artworks,
}: {
  color: string;
  designImage?: string | null;
  placement?: string;
  className?: string;
  adjustment?: ArtworkAdjustment;
  adjustmentMode?: boolean;
  onAdjustChange?: (adj: ArtworkAdjustment) => void;
  artworks?: Record<string, any>;
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
        camera={{ position: [0, 0, 5.2], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)' }}
        onCreated={() => setLoaded(true)}
        onError={() => setError(true)}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 5]} intensity={0.7} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />

        <Suspense fallback={null}>
          <ErrorBoundary>
            <PoloModel
              color={resolvedColor}
              designImage={designImage}
              placement={placement}
              artworks={artworks}
              adjustment={adj}
              onReady={() => setLoaded(true)}
            />
          </ErrorBoundary>
        </Suspense>

        <OrbitControls
          enablePan={false} enableZoom={true}
          minDistance={3.5} maxDistance={7}
          minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.5}
          target={[0, 0, 0]}
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
