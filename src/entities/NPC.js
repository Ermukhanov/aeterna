/**
 * Citizen archetypes & optional CC0 GLTF asset hook (Kenney / Poly Haven).
 * By default AETERNA uses procedural low-poly geometry for zero-download
 * startup and 60+ FPS instancing; drop CC0 `.glb` files into `public/assets/`
 * and use `loadOptionalGLTF` if you want to extend with external meshes.
 */
export const NPC_ARCHETYPES = [
  { id: 'senator', label: 'Senator Romanus', tunic: 0xede2cc, speed: 1.55 },
  { id: 'citizen', label: 'Civis Plebeius', tunic: 0xc98a4b, speed: 1.85 },
  { id: 'merchant', label: 'Mercator', tunic: 0xb85a3a, speed: 1.75 },
  { id: 'matrona', label: 'Matrona', tunic: 0x4c6878, speed: 1.6 },
  { id: 'legionary', label: 'Miles Urbanus', tunic: 0x9a231c, speed: 2.1 },
];

export { Crowd } from './Crowd.js';
