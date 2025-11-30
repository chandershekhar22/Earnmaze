export interface Survey {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  pointsReward: number;
  targetResponses: number;
  currentResponses: number;
  category: string;
  status: 'active' | 'inactive' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}