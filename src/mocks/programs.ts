/**
 * Mock Programs Data
 *
 * Sample data for development and demo purposes.
 */

export interface MockProgram {
  id: number;
  title: string;
  type: 'camp' | 'clinic';
  date: string;
  city: string;
  state: string;
  price: number;
  spotsLeft: number;
  totalSpots: number;
  mainImageUrl: string;
  description: string;
}

export const mockPrograms: MockProgram[] = [
  {
    id: 1,
    title: 'Winter Skills Clinic',
    type: 'clinic',
    date: 'Jan 15, 2025',
    city: 'Austin',
    state: 'TX',
    price: 75,
    spotsLeft: 8,
    totalSpots: 20,
    mainImageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    description: 'Intensive skills training focusing on ball control, passing, and shooting techniques.',
  },
  {
    id: 2,
    title: 'Goalkeeper Training Clinic',
    type: 'clinic',
    date: 'Jan 22, 2025',
    city: 'Dallas',
    state: 'TX',
    price: 85,
    spotsLeft: 5,
    totalSpots: 12,
    mainImageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    description: 'Specialized training for goalkeepers of all skill levels.',
  },
  {
    id: 3,
    title: 'Speed & Agility Clinic',
    type: 'clinic',
    date: 'Feb 5, 2025',
    city: 'Houston',
    state: 'TX',
    price: 65,
    spotsLeft: 12,
    totalSpots: 24,
    mainImageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
    description: 'Improve your speed, agility, and footwork with our NCAA-trained coaches.',
  },
  {
    id: 4,
    title: 'Summer Soccer Camp',
    type: 'camp',
    date: 'Jun 10-14, 2025',
    city: 'Austin',
    state: 'TX',
    price: 350,
    spotsLeft: 25,
    totalSpots: 50,
    mainImageUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
    description: 'Full week of soccer training, games, and fun for players ages 8-14.',
  },
  {
    id: 5,
    title: 'Elite Development Camp',
    type: 'camp',
    date: 'Jul 7-11, 2025',
    city: 'San Antonio',
    state: 'TX',
    price: 450,
    spotsLeft: 10,
    totalSpots: 30,
    mainImageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800',
    description: 'Advanced training camp for competitive players looking to take their game to the next level.',
  },
];

export default mockPrograms;
