import { useState, useEffect } from "react";
import { Badge } from "../types";
import { getBadgeByDesa, getBadgeByInovator, setBadgeForDesa, setBadgeForInovator } from "../services";
import { toast } from "react-toastify";

export function useBadge(id: string, type: "village" | "innovator") {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activeBadge, setActiveBadge] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const res = type === "village" ? await getBadgeByDesa(id) : await getBadgeByInovator(id);
      setBadges(res.badges || []);
      setActiveBadge(res.activeBadge);
    } catch (err: any) {
      console.error("Error fetching badges:", err);
      toast.error(err?.message || "Gagal memuat data gelar");
    } finally {
      setLoading(false);
    }
  };

  const applyBadge = async (badgeId: string | null) => {
    try {
      setActionLoading(badgeId || "remove");
      const res = type === "village" 
        ? await setBadgeForDesa(id, badgeId) 
        : await setBadgeForInovator(id, badgeId);
      setActiveBadge(res.activeBadge);
      toast.success(badgeId ? "Gelar berhasil diterapkan!" : "Gelar dilepas!");
      await fetchBadges();
    } catch (err: any) {
      console.error("Error setting badge:", err);
      toast.error(err?.message || "Gagal memperbarui gelar");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBadges();
    }
  }, [id, type]);

  return { badges, activeBadge, loading, actionLoading, applyBadge, refresh: fetchBadges };
}
