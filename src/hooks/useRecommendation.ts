import { useState, useEffect } from "react";
import api from "Services/api";

export function useRecommendations(
  innovationId: string,
  topN: number = 4
): { data: any; loading: boolean; error?: string } {
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setLoading(true);
    api
      .post<any>("/recommendations", {
        innovation_id: innovationId,
        top_n: topN,
      })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [innovationId, topN]);

  return { data, loading, error };
}
