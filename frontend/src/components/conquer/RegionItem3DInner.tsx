'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

// ── こけし ──────────────────────────────────────────────────
function Kokeshi({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 1.0, 32]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.37, 0.37, 0.14, 32]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>
    </group>
  )
}

// ── 馬（三春駒・相馬野馬追） ────────────────────────────────
function Horse({ color }: { color: string }) {
  const legPositions: [number, number, number][] = [
    [-0.3, -0.52, 0.14], [-0.3, -0.52, -0.14],
    [0.28, -0.52, 0.14], [0.28, -0.52, -0.14],
  ]
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.9, 0.52, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0.52, 0.38, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.48, 0.34, 0.34]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.06, 0.06, 0.42, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ── ウルトラマン ────────────────────────────────────────────
function Ultraman() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.36, 0.82, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.07, 0.32]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <capsuleGeometry args={[0.24, 0.22, 8, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
      </mesh>
      {([-0.12, 0.12] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.68, 0.24]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.5} roughness={0.3} />
        </mesh>
      ))}
      {([-0.5, 0.5] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0]} rotation={[0, 0, i === 0 ? 0.3 : -0.3]}>
          <cylinderGeometry args={[0.09, 0.09, 0.68, 16]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// ── 白河だるま ─────────────────────────────────────────────
function Daruma() {
  return (
    <group>
      <mesh scale={[0.9, 1.15, 0.9]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#cc2200" roughness={0.3} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.05, 0.48]} scale={[0.55, 0.65, 0.2]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="white" roughness={0.5} />
      </mesh>
    </group>
  )
}

// ── 赤べこ ─────────────────────────────────────────────────
function Akabeko() {
  return (
    <group>
      <mesh scale={[1.15, 0.85, 0.7]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#cc2200" roughness={0.4} />
      </mesh>
      <mesh position={[0.6, 0.18, 0]} scale={[0.68, 0.68, 0.68]}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshStandardMaterial color="#cc2200" roughness={0.4} />
      </mesh>
    </group>
  )
}

// ── クマ ───────────────────────────────────────────────────
function Bear({ color }: { color: string }) {
  const earPositions: [number, number, number][] = [[-0.28, 0.84, 0], [0.28, 0.84, 0]]
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {earPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0.32]} scale={[0.65, 0.4, 0.2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#c8a070" roughness={0.7} />
      </mesh>
    </group>
  )
}

// ── 手まり ─────────────────────────────────────────────────
function Temari() {
  const ringAngles = [0, Math.PI / 3, Math.PI * 2 / 3]
  const ringColors = ['#e84444', '#4488ee', '#44cc88']
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshStandardMaterial color="#e8b0c0" roughness={0.35} />
      </mesh>
      {ringAngles.map((angle, i) => (
        <mesh key={i} rotation={[angle, 0, 0]}>
          <torusGeometry args={[0.62, 0.052, 16, 64]} />
          <meshStandardMaterial color={ringColors[i]} roughness={0.3} />
        </mesh>
      ))}
      <mesh>
        <torusGeometry args={[0.62, 0.052, 16, 64]} />
        <meshStandardMaterial color="#ee8844" roughness={0.3} />
      </mesh>
    </group>
  )
}

// ── サッカーボール ─────────────────────────────────────────
function SoccerBall() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshStandardMaterial color="white" roughness={0.45} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.64, 1]} />
        <meshBasicMaterial color="#111" wireframe />
      </mesh>
    </group>
  )
}

// ── フラダンサー ───────────────────────────────────────────
function HulaDancer() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.75, 32]} />
        <meshStandardMaterial color="#f97316" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.2, 16, 64]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <sphereGeometry args={[0.27, 32, 32]} />
        <meshStandardMaterial color="#d4956a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.22, 32]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 0.94, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ff69b4" roughness={0.5} />
      </mesh>
    </group>
  )
}

// ── 黄金トロフィー ─────────────────────────────────────────
function Trophy() {
  const handleSides = [-1, 1] as const
  return (
    <group>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.16, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.12} />
      </mesh>
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.5, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.52, 0.26, 0.95, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.12} />
      </mesh>
      {handleSides.map((side, i) => (
        <mesh key={i} position={[side * 0.64, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.2, 0.048, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.12} />
        </mesh>
      ))}
      <mesh position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#fff7a0" emissive="#ffd700" emissiveIntensity={0.5} metalness={0.9} />
      </mesh>
    </group>
  )
}

// ── regionId → Shape マッピング ────────────────────────────
const REGION_COLORS: Record<string, string> = {
  kenpo: '#5a9e7a', koriyama: '#4a72a0', sukagawa: '#4a8898',
  kennan: '#9e5a5a', aizu: '#9e7a3a', okuaizu: '#7a5e25',
  minamiaizu: '#7a5a9e', soma: '#2e8a7e', futaba: '#2a6e8a',
  iwaki: '#7a9e3a', all: '#d4af37',
}

function ItemShape({ regionId }: { regionId: string }) {
  const color = REGION_COLORS[regionId] ?? '#888'
  switch (regionId) {
    case 'kenpo': return <Kokeshi color={color} />
    case 'koriyama': return <Horse color={color} />
    case 'sukagawa': return <Ultraman />
    case 'kennan': return <Daruma />
    case 'aizu': return <Akabeko />
    case 'okuaizu': return <Bear color={color} />
    case 'minamiaizu': return <Temari />
    case 'soma': return <Horse color={color} />
    case 'futaba': return <SoccerBall />
    case 'iwaki': return <HulaDancer />
    case 'all': return <Trophy />
    default: return <Kokeshi color={color} />
  }
}

// ── メインコンポーネント ────────────────────────────────────
type Props = {
  regionId: string
  autoRotate?: boolean
}

export default function RegionItem3DInner({ regionId, autoRotate = true }: Props) {
  return (
    <Canvas camera={{ position: [0, 0.3, 3], fov: 45 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} />
      <pointLight position={[0, 3, 2]} intensity={0.6} color="#fff8e8" />
      <Suspense fallback={null}>
        <ItemShape regionId={regionId} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={3}
        enableZoom={false}
        enablePan={false}
      />
    </Canvas>
  )
}
