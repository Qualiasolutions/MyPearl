export interface Shade {
  id: number;
  name: string;
  category: ShadeCategory;
  colorHex: string;
}

export type ShadeCategory = 'Fair' | 'Light' | 'Medium' | 'Medium Deep' | 'Deep';

export const SHADE_DATA: Shade[] = [
  // Fair
  { id: 1, name: 'Ivory Cool', category: 'Fair', colorHex: '#F5E6E0' },
  { id: 2, name: 'Porcelain Neutral', category: 'Fair', colorHex: '#F3E0D8' },
  { id: 3, name: 'Snow Warm', category: 'Fair', colorHex: '#F5E1D5' },
  { id: 4, name: 'Pearl Olive', category: 'Fair', colorHex: '#F0DED2' },
  
  // Light
  { id: 5, name: 'Buff Neutral', category: 'Light', colorHex: '#E8D0C3' },
  { id: 6, name: 'Cream Cool', category: 'Light', colorHex: '#E6CEC0' },
  { id: 7, name: 'Sandy Horizon', category: 'Light', colorHex: '#E3C9B8' },
  { id: 8, name: 'Peach Souk', category: 'Light', colorHex: '#E0C4B0' },
  
  // Medium
  { id: 9, name: 'Honey Khaleeji', category: 'Medium', colorHex: '#D4B5A0' },
  { id: 10, name: 'Desert Caramel', category: 'Medium', colorHex: '#C9A892' },
  { id: 11, name: 'Beige Olive', category: 'Medium', colorHex: '#C0A08A' },
  { id: 12, name: 'Golden Falcon', category: 'Medium', colorHex: '#B89B85' },
  
  // Medium Deep
  { id: 13, name: 'Amber Glow', category: 'Medium Deep', colorHex: '#B08B73' },
  { id: 14, name: 'Chestnut Neutral', category: 'Medium Deep', colorHex: '#A68470' },
  { id: 15, name: 'Toffee Palm', category: 'Medium Deep', colorHex: '#9C7B68' },
  { id: 16, name: 'Cinnamon Glow', category: 'Medium Deep', colorHex: '#8F6F5C' },
  
  // Deep
  { id: 17, name: 'Mocha Desert', category: 'Deep', colorHex: '#7C5B4A' },
  { id: 18, name: 'Cocoa Warm', category: 'Deep', colorHex: '#6B4B3C' },
  { id: 19, name: 'Hazel Golden', category: 'Deep', colorHex: '#5E4235' },
  { id: 20, name: 'Mahogany Oasis', category: 'Deep', colorHex: '#4E3328' },
]; 