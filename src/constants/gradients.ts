export interface GradientPreset {
  id: string;
  name: string;
  colors: [string, string, ...string[]];
  textColor: string;
}

export const GRADIENTS: GradientPreset[] = [
  {
    id: 'gradient-sunset',
    name: 'Peach Sunset',
    colors: ['#FF416C', '#FF4B2B'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-midnight',
    name: 'Midnight Purple',
    colors: ['#8E2DE2', '#4A00E0'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-ocean',
    name: 'Ocean Breeze',
    colors: ['#02AAB0', '#00CDAC'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-emerald',
    name: 'Neon Emerald',
    colors: ['#11998E', '#38EF7D'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-bubblegum',
    name: 'Bubblegum',
    colors: ['#e1eec3', '#f05053'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-glass',
    name: 'Frost Slate',
    colors: ['#3A6073', '#3A6073'], // Solid fallback but used with opacity
    textColor: '#ffffff',
  },
  {
    id: 'gradient-carbon',
    name: 'Carbon Steel',
    colors: ['#1F1C2C', '#928DAB'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-cyberpunk',
    name: 'Cyberpunk Glow',
    colors: ['#F857A6', '#FF5858'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-cosmic',
    name: 'Cosmic Violet',
    colors: ['#120136', '#400082', '#03001e'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-minimal-dark',
    name: 'Pure Charcoal',
    colors: ['#121212', '#1C1C1C'],
    textColor: '#b0b4ba',
  },
  {
    id: 'gradient-minimal-light',
    name: 'Off-White Grid',
    colors: ['#F5F7FA', '#E4E8F0'],
    textColor: '#60646C',
  },
  {
    id: 'gradient-aurora',
    name: 'Aurora Borealis',
    colors: ['#00c6ff', '#0072ff', '#8E2DE2'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-coral',
    name: 'Neon Coral',
    colors: ['#f857a6', '#ff5858'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-lavender',
    name: 'Soft Lavender',
    colors: ['#eecda3', '#ef629f'],
    textColor: '#ffffff',
  },
  {
    id: 'gradient-mystic',
    name: 'Mystic Glow',
    colors: ['#7F00FF', '#FF007F'],
    textColor: '#ffffff',
  }
];

export function getGradientColors(id: string): [string, string, ...string[]] {
  const gradient = GRADIENTS.find((g) => g.id === id);
  return gradient ? gradient.colors : ['#FF416C', '#FF4B2B'];
}
