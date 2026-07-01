export type ChildLifestyle = 'basic' | 'comfortable' | 'premium' | 'international';

export interface ChildCostOutput {
  isActive: boolean;
  childAge?: number;
  food: number;
  education: number;
  englishSkills: number;
  healthcare: number;
  clothesSupplies: number;
  travelExperience: number;
  universityFund: number;
  postGradSupport: number;
  totalMonthly: number;
  totalYearly: number;
  notes: string[];
}
