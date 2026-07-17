import api from "@/services/api";
import { BadgeEvaluationResponse } from "./types";

export const getBadgeByDesa = (id: string): Promise<BadgeEvaluationResponse> =>
  api.get(`/villages/${id}/badges`);

export const getBadgeByInovator = (id: string): Promise<BadgeEvaluationResponse> =>
  api.get(`/innovator/${id}/badges`);

export const setBadgeForDesa = (id: string, badgeId: string | null): Promise<BadgeEvaluationResponse> =>
  api.patch(`/villages/${id}/badges`, { badgeId });

export const setBadgeForInovator = (id: string, badgeId: string | null): Promise<BadgeEvaluationResponse> =>
  api.patch(`/innovator/${id}/badges`, { badgeId });

export const getBadgesAdminSummary = (): Promise<any> =>
  api.get(`/admin/badges`);

export const getBadgesAdminUsers = (params: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<any> =>
  api.get(`/admin/badges/users`, { params });
