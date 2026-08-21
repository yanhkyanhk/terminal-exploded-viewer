"use client";

import { ContactShadows, Grid, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { product, type ModuleNode, type PartNode } from "../domain/product";
import { explodedPosition } from "../explosion/transform";
import { useViewerStore } from "../state/viewer-store";
import type { ReturnTypeOfController } from "./types";
import { sceneRegistry } from "./scene-registry";

interface SceneProps { controller: ReturnTypeOfController; }

function PartObject({ module, part, controller }: { module: ModuleNode; part: PartNode; controller: ReturnTypeOfController }) {
  const ref = useRef<Mesh>(null);
  const level = useViewerStore((state) => state.level);
  const selectedModuleId = useViewerStore((state) => state.selectedModuleId);
  const selectedPartId = useViewerStore((state) => state.selectedPartId);
  const hoveredNodeId = useViewerStore((state) => state.hoveredNodeId);
  const visibleAtPartLevel = level === "PART" && selectedModuleId === module.id;
  const highlighted = hoveredNodeId === part.id || selectedPartId === part.id;

  useEffect(() => {
    if (!ref.current) return;
    sceneRegistry.register(part.id, ref.current);
    return () => sceneRegistry.unregister(part.id);
  }, [part.id]);

  useFrame(() => {
    if (!ref.current) return;
    const state = useViewerStore.getState();
    const progress = state.level === "PART" && state.selectedModuleId === module.id ? state.partProgress : 0;
    const position = explodedPosition(part.position, part.explosion.direction, part.explosion.distance, progress, state.explosionScale);
    ref.current.position.set(...position);
  });

  const stopIfDrag = (event: ThreeEvent<MouseEvent>) => event.delta > 5;
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!visibleAtPartLevel || stopIfDrag(event)) return;
    event.stopPropagation();
    controller.selectPart(module.id, part.id);
  };

  const geometry = part.shape === "cylinder"
    ? <cylinderGeometry args={[part.size[0] / 2, part.size[0] / 2, part.size[2], 36]} />
    : <boxGeometry args={[...part.size]} />;

  return (
    <group>
      <mesh
        ref={ref}
        rotation={part.shape === "cylinder" ? [Math.PI / 2, 0, 0] : undefined}
        userData={{ nodeId: part.id }}
        onClick={handleClick}
        onPointerOver={(event) => {
          if (!visibleAtPartLevel) return;
          event.stopPropagation();
          useViewerStore.getState().setHover(part.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (useViewerStore.getState().hoveredNodeId === part.id) useViewerStore.getState().setHover(null);
          document.body.style.cursor = "default";
        }}
      >
        {geometry}
        <meshStandardMaterial
          color={part.color}
          metalness={part.material.includes("玻璃") ? 0.42 : 0.68}
          roughness={0.28}
          emissive={highlighted ? "#20d9ff" : "#000000"}
          emissiveIntensity={highlighted ? 0.55 : 0}
        />
        {visibleAtPartLevel && (
          <Html position={[0, 0, part.size[2] / 2 + 0.12]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
            <span className={`scene-label part-label ${highlighted ? "selected" : ""}`}>{part.name}</span>
          </Html>
        )}
      </mesh>
    </group>
  );
}

function ModuleObject({ module, controller }: { module: ModuleNode; controller: ReturnTypeOfController }) {
  const ref = useRef<Group>(null);
  const level = useViewerStore((state) => state.level);
  const selectedModuleId = useViewerStore((state) => state.selectedModuleId);
  const hoveredNodeId = useViewerStore((state) => state.hoveredNodeId);
  const isActive = hoveredNodeId === module.id || selectedModuleId === module.id;
  const showModuleLabel = level === "MODULE" || (level === "PART" && selectedModuleId !== module.id);

  useEffect(() => {
    if (!ref.current) return;
    sceneRegistry.register(module.id, ref.current);
    return () => sceneRegistry.unregister(module.id);
  }, [module.id]);

  useFrame(() => {
    if (!ref.current) return;
    const state = useViewerStore.getState();
    const position = explodedPosition(module.position, module.explosion.direction, module.explosion.distance, state.moduleProgress, state.explosionScale);
    ref.current.position.set(...position);
  });

  const handleModuleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return;
    const state = useViewerStore.getState();
    if (state.level === "PRODUCT") {
      event.stopPropagation();
      controller.enterModules();
    } else if (state.level === "MODULE") {
      event.stopPropagation();
      controller.enterModule(module.id);
    }
  };

  return (
    <group
      ref={ref}
      userData={{ nodeId: module.id }}
      onClick={handleModuleClick}
      onPointerOver={(event) => {
        const state = useViewerStore.getState();
        if (state.level === "PART" || state.isAnimating) return;
        event.stopPropagation();
        state.setHover(state.level === "PRODUCT" ? product.id : module.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        const state = useViewerStore.getState();
        if (state.hoveredNodeId === module.id || state.hoveredNodeId === product.id) state.setHover(null);
        document.body.style.cursor = "default";
      }}
    >
      <RoundedBox args={[...module.size]} radius={Math.min(module.size[0], module.size[1]) * 0.08} smoothness={4}>
        <meshStandardMaterial
          color={module.color}
          metalness={0.72}
          roughness={0.3}
          transparent
          opacity={module.id === "frame-module" ? 0.72 : 0.24}
          emissive={isActive ? "#20d9ff" : "#000000"}
          emissiveIntensity={isActive ? 0.35 : 0}
        />
      </RoundedBox>
      {module.parts.map((part) => <PartObject key={part.id} module={module} part={part} controller={controller} />)}
      {showModuleLabel && (
        <Html position={[module.size[0] / 2 + 0.22, 0, 0.25]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <span className={`scene-label ${isActive ? "selected" : ""}`}>{module.name}</span>
        </Html>
      )}
    </group>
  );
}

function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const focusNonce = useViewerStore((state) => state.focusNonce);
  const isAnimating = useViewerStore((state) => state.isAnimating);

  useEffect(() => {
    const state = useViewerStore.getState();
    const selectedModule = product.modules.find((item) => item.id === state.selectedModuleId);
    const target = selectedModule && state.level === "PART"
      ? explodedPosition(selectedModule.position, selectedModule.explosion.direction, selectedModule.explosion.distance, 1, state.explosionScale)
      : ([0, 0, 0] as const);
    const destination = state.level === "PRODUCT"
      ? [7.2, 3.8, 8.4]
      : state.level === "MODULE"
        ? [10.2, 6.1, 12.4]
        : [target[0] + 5.2, target[1] + 3.4, target[2] + 6.1];
    const duration = state.reducedMotion ? 0.01 : 0.72;
    gsap.to(camera.position, { x: destination[0], y: destination[1], z: destination[2], duration, ease: "power2.inOut" });
    if (controls.current) {
      gsap.to(controls.current.target, {
        x: target[0], y: target[1], z: target[2], duration, ease: "power2.inOut",
        onUpdate: () => controls.current?.update(),
      });
    }
  }, [camera, focusNonce]);

  return <OrbitControls ref={controls} makeDefault enabled={!isAnimating} enableDamping minDistance={4.4} maxDistance={20} />;
}

export function ProductScene({ controller }: SceneProps) {
  const productHovered = useViewerStore((state) => state.hoveredNodeId === product.id);
  const ringColor = productHovered ? "#20d9ff" : "#2e6070";

  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 12, 27]} />
      <ambientLight intensity={0.92} />
      <hemisphereLight args={["#ffffff", "#dbe8ec", 1.1]} />
      <directionalLight position={[7, 9, 6]} intensity={2.5} color="#e8fbff" />
      <pointLight position={[-6, 1, 4]} intensity={10} distance={14} color="#20d9ff" />
      <group rotation={[0.08, -0.28, -0.035]}>
        {product.modules.map((module) => <ModuleObject key={module.id} module={module} controller={controller} />)}
        <mesh position={[0, -3.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.008, 8, 96]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.55} />
        </mesh>
      </group>
      <Grid position={[0, -3.25, 0]} args={[24, 24]} cellSize={0.65} cellThickness={0.32} cellColor="#d8e3e8" sectionSize={3.25} sectionThickness={0.55} sectionColor="#b9cbd3" fadeDistance={18} fadeStrength={1.4} infiniteGrid />
      <ContactShadows position={[0, -3.18, 0]} opacity={0.22} scale={14} blur={2.8} far={8} />
      <CameraRig />
    </>
  );
}
