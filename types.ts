export type AppState = 'landing' | 'camera' | 'capturing' | 'analyzing' | 'result';

export interface FlowerResult {
  flowerName: string;
  emoji: string;
  description: string;
  trait: string;
  funFact: string;
  color: string; // hex color for theming
}
