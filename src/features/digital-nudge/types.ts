export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  target: number;
}

export interface BadgeEvaluationResponse {
  activeBadge: string | null;
  badges: Badge[];
}
