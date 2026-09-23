// Dev-only prototype fixtures for the /design/direction-* art-direction studies.
// Media uses picsum.photos seeds purely to demonstrate media-rich composition in prototypes —
// NOT real game art, NOT shown in production. Routes 404 in production.

export type Game = {
  title: string
  dev: string
  handle: string
  genre: string
  engine: string
  stage: 'Concept' | 'Prototype' | 'Alpha' | 'Beta' | 'Released'
  pitch: string
  updated: string
  cover: string | null // picsum seed url, or null to show the no-media title-plate
  playtest?: boolean
}

const img = (seed: string, w = 800, h = 450) => `https://picsum.photos/seed/${seed}/${w}/${h}`

export const GAMES: Game[] = [
  { title: 'Emberfall Keep', dev: 'Nova Calder', handle: 'demo-nova', genre: 'Action-RPG', engine: 'Godot', stage: 'Alpha', pitch: 'A dark action-RPG in the ruins of a volcanic fortress. Descend through procedurally-seeded floors of fire and shadow.', updated: '13d ago', cover: img('emberfall-keep-glyph'), playtest: true },
  { title: 'Emberreach', dev: 'Lena Voss', handle: 'lena-voss', genre: 'Metroidvania', engine: 'Godot', stage: 'Beta', pitch: 'A metroidvania about a lighthouse keeper reclaiming a drowned coastline.', updated: '1mo ago', cover: img('emberreach-glyph'), playtest: true },
  { title: 'Rift Squad', dev: 'Sam Iqbal', handle: 'sam-iqbal', genre: 'Co-op Shooter', engine: 'Unreal', stage: 'Alpha', pitch: 'A 2-player co-op shooter where you and a friend share one health bar.', updated: '1mo ago', cover: img('rift-squad-glyph'), playtest: true },
  { title: 'Harbor Tides', dev: 'Priya Desai', handle: 'priya-desai', genre: 'Simulation', engine: 'GameMaker', stage: 'Beta', pitch: 'A cozy sailing sim about running supplies between a scattered island community.', updated: '2mo ago', cover: img('harbor-tides-glyph') },
  { title: 'Static Bloom', dev: 'Theo Park', handle: 'theo-park', genre: 'Narrative Horror', engine: 'Unity', stage: 'Prototype', pitch: 'A quiet horror game about a greenhouse that remembers what was planted there.', updated: '2mo ago', cover: null },
  { title: 'Hollow Tide', dev: 'Mira Kasprzak', handle: 'mira', genre: 'Platformer', engine: 'Godot', stage: 'Alpha', pitch: 'A momentum platformer set in a tide that rises with every death.', updated: '3d ago', cover: img('hollow-tide-glyph'), playtest: true },
  { title: 'Paper Circuits', dev: 'Dana Wu', handle: 'dana-wu', genre: 'Puzzle', engine: 'Godot', stage: 'Concept', pitch: 'Wire up impossible machines drawn on graph paper.', updated: '5d ago', cover: null },
  { title: 'Northwind', dev: 'Ivo Serrano', handle: 'ivo', genre: 'Strategy', engine: 'Unity', stage: 'Beta', pitch: 'A weather-driven tactics game where the storm is the other player.', updated: '9d ago', cover: img('northwind-glyph') },
]

export const DEVLOGS = [
  { title: 'Combat Redesign — Why We Threw Away 3 Months of Work', project: 'Emberfall Keep', dev: 'Nova Calder', when: '18d ago', excerpt: 'The original combat system was stamina-based with a momentum meter. Sounds cool. Felt awful. Playtesters kept saying the same thing…' },
  { title: 'Floor 3 rework: the coastline finally feels alive', project: 'Emberreach', dev: 'Lena Voss', when: '1mo ago', excerpt: 'Replaced the placeholder torch lighting with a proper dynamic light pass tied to tide height…' },
  { title: 'Tuning the shared health bar', project: 'Rift Squad', dev: 'Sam Iqbal', when: '1mo ago', excerpt: 'The shared-health hook only works if damage feels attributable. Added a damage-source indicator…' },
  { title: 'The World Takes Shape: Procedural Terrain', project: 'Emberfall Keep', dev: 'Nova Calder', when: '25d ago', excerpt: 'After three weeks of iteration the floor generation finally feels right — anchor rooms first…' },
]

export const DEVELOPER = {
  name: 'Nova Calder', handle: 'demo-nova', role: 'Programmer', location: 'Vancouver, BC', engine: 'Godot',
  bio: 'Solo dev building atmospheric action-RPGs. Currently deep in the caves of Emberfall Keep.',
  open: true, followers: 128, following: 34, since: 'June 2026',
}

export const ATTENTION = [
  { who: 'Alex Rivera', what: 'applied for Audio Designer', when: '2h ago', action: 'Review application' },
  { who: 'Maya Chen', what: 'requested to test Emberfall Keep', when: '5h ago', action: 'Review request' },
]

export const ACTIVITY = [
  { who: 'Jordan Fine', what: 'commented on “Alpha Build is Live”', when: '1d ago' },
  { who: 'Sam Iqbal', what: 'reacted to your devlog', when: '2d ago' },
]

export const stageTint: Record<Game['stage'], string> = {
  Concept: '#6b7280', Prototype: '#7a5c3e', Alpha: '#b45f2e', Beta: '#2f6f57', Released: '#3b5bdb',
}
