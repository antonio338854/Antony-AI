// FIX: Added a triple-slash directive to explicitly load @react-three/fiber types,
// which resolves errors with JSX elements like <mesh>, <boxGeometry>, etc.
/// <reference types="@react-three/fiber" />

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Sky, Text } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useStore } from '../hooks/useStore';
import type { Block, } from '../types';
import { BlockType } from '../types';

// Constants
const WORLD_SIZE = 32;
const PLAYER_SPEED = 5;
const JUMP_FORCE = 6;
const CUBE_MATERIALS = {
  [BlockType.GRASS]: new THREE.MeshStandardMaterial({ color: '#569434' }),
  [BlockType.DIRT]: new THREE.MeshStandardMaterial({ color: '#8a5a2b' }),
  [BlockType.STONE]: new THREE.MeshStandardMaterial({ color: '#808080' }),
  [BlockType.WOOD]: new THREE.MeshStandardMaterial({ color: '#6f4f28' }),
  [BlockType.LEAVES]: new THREE.MeshStandardMaterial({ color: '#228B22', transparent: true, opacity: 0.8 }),
};


// Player Component
const Player: React.FC = () => {
    const { camera } = useThree();
    const { forward, backward, left, right, jump } = useStore((state) => state);
    const bodyRef = useRef<RapierRigidBody>(null);

    useFrame(() => {
        if (!bodyRef.current) return;
        
        const velocity = bodyRef.current.linvel();
        const frontVector = new THREE.Vector3(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0));
        const sideVector = new THREE.Vector3((left ? 1 : 0) - (right ? 1 : 0), 0, 0);

        const direction = new THREE.Vector3()
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(PLAYER_SPEED)
            .applyEuler(camera.rotation);
        
        bodyRef.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

        // Simple check for being on the ground to allow jump
        const world = bodyRef.current.parent();
        const origin = bodyRef.current.translation();
        const ray = world.castRay(new THREE.Ray(origin, { x: 0, y: -1, z: 0 }), 1.1, true);
        if (jump && ray) {
            bodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
        }
    });

    return (
        <RigidBody ref={bodyRef} colliders="cuboid" mass={1} type="dynamic" position={[0, 2, 0]} enabledRotations={[false, false, false]}>
            <CuboidCollider args={[0.4, 0.9, 0.4]} />
        </RigidBody>
    );
};

// World Component
const World: React.FC<{ blocks: Block[]; onAddBlock: (pos: [number, number, number]) => void; onRemoveBlock: (id: string) => void }> = ({ blocks, onAddBlock, onRemoveBlock }) => {
    const { camera } = useThree();
    const fire = useStore((state) => state.fire);
    const setControls = useStore((state) => state.set);
    const [lastShot, setLastShot] = useState(0);

    useEffect(() => {
        if (fire && Date.now() - lastShot > 200) { // 200ms cooldown
            setLastShot(Date.now());
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
            const intersects = raycaster.intersectObjects(camera.parent?.children ?? [], false);
            
            if (intersects.length > 0) {
                const intersect = intersects[0];
                if (intersect.object.userData.id) {
                    onRemoveBlock(intersect.object.userData.id);
                }
            }
            setControls({ fire: false });
        }
    }, [fire, camera, onRemoveBlock, setControls, lastShot]);
    
    return (
        <>
            {blocks.map(({ id, pos, type }) => (
                <RigidBody key={id} type="fixed" colliders="cuboid" position={pos}>
                    <mesh material={CUBE_MATERIALS[type]} userData={{ id }}>
                        <boxGeometry />
                    </mesh>
                </RigidBody>
            ))}
        </>
    );
};


// HUD Component
const Hud: React.FC = () => {
    const setControls = useStore((state) => state.set);
    const joystickRef = useRef<HTMLDivElement>(null);
    const isMobile = useMemo(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyW') setControls({ forward: true });
            if (e.code === 'KeyS') setControls({ backward: true });
            if (e.code === 'KeyA') setControls({ left: true });
            if (e.code === 'KeyD') setControls({ right: true });
            if (e.code === 'Space') setControls({ jump: true });
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'KeyW') setControls({ forward: false });
            if (e.code === 'KeyS') setControls({ backward: false });
            if (e.code === 'KeyA') setControls({ left: false });
            if (e.code === 'KeyD') setControls({ right: false });
            if (e.code === 'Space') setControls({ jump: false });
        };
        const handleMouseDown = () => setControls({ fire: true });

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);

        if (isMobile && joystickRef.current) {
            const options = {
                zone: joystickRef.current,
                mode: 'static' as const,
                position: { left: '50%', top: '50%' },
                color: 'rgba(255, 255, 255, 0.5)',
            };
            const manager = (window as any).nipplejs.create(options);
            manager.on('move', (_: any, data: any) => {
                const { angle, force } = data;
                if (force > 0.2) {
                    setControls({
                        forward: angle.degree > 45 && angle.degree < 135,
                        backward: angle.degree > 225 && angle.degree < 315,
                        right: angle.degree <= 45 || angle.degree >= 315,
                        left: angle.degree >= 135 && angle.degree <= 225,
                    });
                }
            });
            manager.on('end', () => {
                setControls({ forward: false, backward: false, left: false, right: false });
            });
        }
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
        };
    }, [setControls, isMobile]);

    return (
        <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-4xl select-none">+</div>
            {isMobile && (
                <>
                    <div ref={joystickRef} className="absolute bottom-[10%] left-[10%] w-32 h-32 pointer-events-auto"></div>
                    <button 
                        onTouchStart={() => setControls({ fire: true })}
                        className="absolute bottom-[10%] right-[10%] w-24 h-24 bg-red-500/50 rounded-full pointer-events-auto border-2 border-white/50 active:bg-red-500/80"
                    >
                      <span className="text-white text-xl font-bold">FIRE</span>
                    </button>
                </>
            )}
        </div>
    );
};


const Game: React.FC = () => {
    const [blocks, setBlocks] = useState<Block[]>([]);

    useEffect(() => {
        // Generate initial world
        const world: Block[] = [];
        for (let x = -WORLD_SIZE / 2; x < WORLD_SIZE / 2; x++) {
            for (let z = -WORLD_SIZE / 2; z < WORLD_SIZE / 2; z++) {
                // Base layer of stone
                world.push({ id: `${x}-0-${z}`, pos: [x, 0, z], type: BlockType.STONE });
                // Dirt layer
                world.push({ id: `${x}-1-${z}`, pos: [x, 1, z], type: BlockType.DIRT });
                // Grass on top
                world.push({ id: `${x}-2-${z}`, pos: [x, 2, z], type: BlockType.GRASS });
            }
        }
        // Add a simple "tree"
        world.push({ id: `0-3-0`, pos: [0, 3, 0], type: BlockType.WOOD });
        world.push({ id: `0-4-0`, pos: [0, 4, 0], type: BlockType.WOOD });
        world.push({ id: `0-5-0`, pos: [0, 5, 0], type: BlockType.LEAVES });
        world.push({ id: `1-4-0`, pos: [1, 4, 0], type: BlockType.LEAVES });
        world.push({ id: `-1-4-0`, pos: [-1, 4, 0], type: BlockType.LEAVES });
        world.push({ id: `0-4-1`, pos: [0, 4, 1], type: BlockType.LEAVES });
        world.push({ id: `0-4--1`, pos: [0, 4, -1], type: BlockType.LEAVES });

        setBlocks(world);
    }, []);

    const handleAddBlock = (pos: [number, number, number]) => {
        const newBlock: Block = {
            id: `${pos[0]}-${pos[1]}-${pos[2]}`,
            pos,
            type: BlockType.STONE, // Default add stone
        };
        setBlocks(prev => [...prev, newBlock]);
    };

    const handleRemoveBlock = (id: string) => {
        setBlocks(prev => prev.filter(block => block.id !== id));
    };
    
    return (
        <div className="w-screen h-screen">
            <Hud />
            <Canvas shadows>
                <Sky sunPosition={[100, 100, 20]} />
                <ambientLight intensity={0.6} />
                <directionalLight
                    castShadow
                    position={[10, 20, 5]}
                    intensity={1.5}
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                 <Suspense fallback={null}>
                    <Text
                        position={[0, 8, -WORLD_SIZE/2 - 2]}
                        fontSize={2}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        rotation={[-0.2, 0, 0]}
                    >
                       VoxelVerse Shooter
                    </Text>
                </Suspense>
                <Physics gravity={[0, -25, 0]}>
                    <Player />
                    <World blocks={blocks} onAddBlock={handleAddBlock} onRemoveBlock={handleRemoveBlock} />
                </Physics>
                <PointerLockControls />
            </Canvas>
        </div>
    );
};

export default Game;
