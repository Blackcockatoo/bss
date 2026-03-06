export type SteeringColor = 'red' | 'blue' | 'black';
export type SteeringMode = 'compass' | 'network' | 'geometry';
export type DataSource = 'seed' | 'pet';

export interface NavigationTarget {
  position: number;
  angle: number;
  label: string;
  route: string;
  icon: string;
}

export const NAVIGATION_TARGETS: NavigationTarget[] = [
  { position: 0,  angle: 0,   label: 'Home',      route: '/',              icon: 'Home' },
  { position: 1,  angle: 30,  label: 'Explore',    route: '/scaffold',      icon: 'Map' },
  { position: 2,  angle: 60,  label: 'Pet',        route: '/pet',           icon: 'Swords' },
  { position: 3,  angle: 90,  label: 'Studio Site', route: 'https://bluesnakestudios.com', icon: 'Globe' },
  { position: 4,  angle: 120, label: 'Style',       route: '/visualizer',    icon: 'Sparkles' },
  { position: 5,  angle: 150, label: 'Rewards',     route: '/share',         icon: 'Trophy' },
  { position: 6,  angle: 180, label: 'Shop',         route: '/shop',          icon: 'ShoppingBag' },
  { position: 7,  angle: 210, label: 'Digital DNA',  route: '/digital-dna',   icon: 'Dna' },
  { position: 8,  angle: 240, label: 'Identity',     route: '/identity',      icon: 'Fingerprint' },
  { position: 9,  angle: 270, label: 'Lineage',      route: '/lineage-demo',  icon: 'GitBranch' },
  { position: 10, angle: 300, label: 'Genome Resonance', route: '/genome-resonance', icon: 'Network' },
  { position: 11, angle: 330, label: 'QR Messaging', route: '/qr-messaging',  icon: 'QrCode' },
];

export interface SteeringViewProps {
  color: SteeringColor;
  numberStrings: Record<SteeringColor, string>;
  selectedFeature: number;
  onFeatureSelect: (position: number) => void;
  onFeatureActivate: (position: number) => void;
}
