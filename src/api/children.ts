/**
 * Children/Players API Module
 *
 * Handles child/player profile management for parents.
 *
 * Endpoints (PTP Training Platform REST API):
 * - GET /players - Get all players for current parent
 * - GET /players/:id - Get player details
 * - POST /players - Add a new player
 * - PUT /players/:id - Update a player profile
 * - DELETE /players/:id - Delete a player profile
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import { ChildProfile, AgeBand, SkillLevel, PlayerPosition } from '../types';

/**
 * Child data for creating/updating
 */
export interface ChildData {
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  ageBand: AgeBand;
  skillLevel: SkillLevel;
  position?: PlayerPosition;
  team?: string;
  notes?: string;
  avatarUrl?: string;
}

/**
 * Get all players for the current parent
 *
 * GET /wp-json/ptp/v1/players
 */
export const getChildren = async (): Promise<ChildProfile[]> => {
  if (apiConfig.demoMode) {
    return mockChildren;
  }

  const response = await apiClient.get('/players');
  return (response.data.players || response.data || []).map(mapWordPressChild);
};

/**
 * Get a single player by ID
 *
 * GET /wp-json/ptp/v1/players/:id
 */
export const getChild = async (childId: number): Promise<ChildProfile> => {
  if (apiConfig.demoMode) {
    const child = mockChildren.find((c) => c.id === childId);
    if (!child) throw new Error('Child not found');
    return child;
  }

  const response = await apiClient.get(`/players/${childId}`);
  return mapWordPressChild(response.data);
};

/**
 * Add a new player
 *
 * POST /wp-json/ptp/v1/players
 */
export const addChild = async (data: ChildData): Promise<{ success: boolean; childId: number; message: string }> => {
  if (apiConfig.demoMode) {
    const newChild: ChildProfile = {
      id: Date.now(),
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      ageBand: data.ageBand,
      skillLevel: data.skillLevel,
      position: data.position,
      team: data.team,
      notes: data.notes,
      avatarUrl: data.avatarUrl,
    };
    mockChildren.push(newChild);
    return {
      success: true,
      childId: newChild.id,
      message: 'Player profile created',
    };
  }

  const response = await apiClient.post('/players', {
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth,
    age_band: data.ageBand,
    skill_level: data.skillLevel,
    position: data.position,
    team: data.team,
    notes: data.notes,
    avatar_url: data.avatarUrl,
  });

  return {
    success: response.data.success,
    childId: response.data.child_id,
    message: response.data.message,
  };
};

/**
 * Update a player profile
 *
 * PUT /wp-json/ptp/v1/players/:id
 */
export const updateChild = async (
  childId: number,
  data: Partial<ChildData>
): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    const child = mockChildren.find((c) => c.id === childId);
    if (child) {
      Object.assign(child, {
        firstName: data.firstName ?? child.firstName,
        lastName: data.lastName ?? child.lastName,
        dateOfBirth: data.dateOfBirth ?? child.dateOfBirth,
        ageBand: data.ageBand ?? child.ageBand,
        skillLevel: data.skillLevel ?? child.skillLevel,
        position: data.position ?? child.position,
        team: data.team ?? child.team,
        notes: data.notes ?? child.notes,
        avatarUrl: data.avatarUrl ?? child.avatarUrl,
      });
    }
    return { success: true, message: 'Player profile updated' };
  }

  const response = await apiClient.put(`/players/${childId}`, {
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth,
    age_band: data.ageBand,
    skill_level: data.skillLevel,
    position: data.position,
    team: data.team,
    notes: data.notes,
    avatar_url: data.avatarUrl,
  });

  return response.data;
};

/**
 * Delete a player profile
 *
 * DELETE /wp-json/ptp/v1/players/:id
 */
export const deleteChild = async (childId: number): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    const index = mockChildren.findIndex((c) => c.id === childId);
    if (index !== -1) {
      mockChildren.splice(index, 1);
    }
    return { success: true, message: 'Player profile deleted' };
  }

  const response = await apiClient.delete(`/players/${childId}`);
  return response.data;
};

/**
 * Map WordPress child response to app ChildProfile type
 */
const mapWordPressChild = (wpChild: any): ChildProfile => ({
  id: wpChild.id,
  firstName: wpChild.first_name,
  lastName: wpChild.last_name,
  dateOfBirth: wpChild.date_of_birth,
  ageBand: wpChild.age_band,
  skillLevel: wpChild.skill_level,
  position: wpChild.position,
  team: wpChild.team,
  notes: wpChild.notes,
  avatarUrl: wpChild.avatar_url,
});

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockChildren: ChildProfile[] = [
  {
    id: 1,
    firstName: 'Jake',
    lastName: 'Johnson',
    dateOfBirth: '2014-03-15',
    ageBand: '9-11',
    skillLevel: 'travel',
    position: 'midfielder',
    team: 'Main Line FC U10',
    notes: 'Works hard, needs to improve weak foot',
  },
  {
    id: 2,
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: '2016-08-22',
    ageBand: '6-8',
    skillLevel: 'rec',
    position: 'forward',
    team: 'Radnor Soccer Club',
    notes: 'Very enthusiastic, loves to score goals',
  },
];

export { mockChildren };
