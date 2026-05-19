import { useEffect, useState } from "react";
import { useAuthToken } from "Hooks/useAuthToken";
import { getInnovation } from "Services/innovationServices";
import { getClaims } from "Services/villageServices";
import { podiumStyles } from "./_topVillagesStyle";

type TopItem = {
  id: string;
  name: string;
  count: number;
  rank: number;
  label: string;
};

const TopVillages = () => {
  const [topVillages, setTopVillages] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inovatorProfile, setInovatorProfile] = useState<{ namaInovator?: string } | null>(null);
  const { token, isLoaded: authLoaded } = useAuthToken();

  useEffect(() => {
    const fetchTopVillages = async () => {
      if (!authLoaded) return;
      setLoading(true);

      if (!token) {
        setTopVillages([]);
        setLoading(false);
        return;
      }

      try {
        // Dapatkan profil innovator milik user saat ini via dashboard API
        const dashRes = await fetch('/api/innovator/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!dashRes.ok) {
          setTopVillages([]);
          setLoading(false);
          return;
        }

        const dashData = await dashRes.json();
        const myProfile = dashData.innovator;

        if (!myProfile) {
          setTopVillages([]);
          setLoading(false);
          return;
        }

        const inovatorId = myProfile._id?.toString();
        setInovatorProfile(myProfile);

        // Fetch innovations by this innovator via MongoDB API
        const innovationRes = await getInnovation();
        const allInnovations = innovationRes.innovations || [];
        const myInnovations = allInnovations.filter(
          (i: any) => i.innovatorId === inovatorId
        );

        if (myInnovations.length === 0) {
          setTopVillages([]);
          setLoading(false);
          return;
        }

        const inovasiIds = myInnovations.map((i: any) => i._id || i.id);

        // Fetch all claims via MongoDB API and filter client-side
        const claimsRes = await getClaims();
        const allClaims = (claimsRes as any).claims || [];
        const relevantClaims = allClaims.filter(
          (claim: any) => claim.inovasiId && inovasiIds.includes(claim.inovasiId)
        );

        // Count occurrences per desaId
        const countMap: Record<string, { namaDesa: string; count: number }> = {};
        relevantClaims.forEach((claim: any) => {
          const desaId = claim.desaId;
          const namaDesa = claim.namaDesa;
          if (desaId && namaDesa) {
            if (!countMap[desaId]) {
              countMap[desaId] = { namaDesa, count: 0 };
            }
            countMap[desaId].count++;
          }
        });

        const sorted = Object.entries(countMap)
          .sort((a, b) => {
            if (b[1].count === a[1].count) {
              return a[1].namaDesa.localeCompare(b[1].namaDesa);
            }
            return b[1].count - a[1].count;
          })
          .slice(0, 3)
          .map(([desaId, value]) => ({
            id: desaId,
            name: value.namaDesa,
            count: value.count,
          }));

        if (sorted.length === 0) {
          setTopVillages([]);
          setLoading(false);
          return;
        }

        const allSameCount = sorted.every(item => item.count === sorted[0].count);
        let ranked: TopItem[];

        if (allSameCount) {
          ranked = sorted.map(item => ({
            ...item,
            rank: 1,
            label: "1st"
          }));
        } else {
          let currentRank = 1;
          let lastCount: number | null = null;

          ranked = sorted.map((item) => {
            if (lastCount !== null && item.count !== lastCount) {
              currentRank++;
            }
            lastCount = item.count;
            return {
              ...item,
              rank: currentRank,
              label: `${currentRank}${["st", "nd", "rd"][currentRank - 1] || "th"}`
            };
          });
        }

        setTopVillages(ranked);
      } catch (error) {
        console.error("Error fetching top villages:", error);
        setTopVillages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopVillages();
  }, [authLoaded, token]);

  // Urutan podium versi 2, tapi style versi 1
  let podiumOrder: TopItem[] = [];
  const allSameRank = topVillages.every(el => el.rank === topVillages[0]?.rank);

  if (topVillages.length === 1) {
    podiumOrder = [topVillages[0]];
  } else if (topVillages.length === 2) {
    if (allSameRank) {
      podiumOrder = [topVillages[0], topVillages[1]];
    } else {
      podiumOrder = [
        topVillages.find(i => i.rank === 1)!,
        topVillages.find(i => i.rank === 2)!
      ];
    }
  } else if (topVillages.length === 3) {
    if (allSameRank) {
      podiumOrder = [...topVillages];
    } else {
      const rank1Count = topVillages.filter(el => el.rank === 1).length;
      if (rank1Count === 1) {
        const rank1 = topVillages.find(el => el.rank === 1)!;
        const rank2Items = topVillages.filter(el => el.rank === 2);
        podiumOrder = [rank2Items[0], rank1, rank2Items[1]];
      } else if (rank1Count === 2) {
        const rank1Items = topVillages.filter(el => el.rank === 1);
        const rank2 = topVillages.find(el => el.rank === 2)!;
        podiumOrder = [rank1Items[0], rank1Items[1], rank2];
      } else {
        podiumOrder = [
          topVillages.find(el => el.rank === 2)!,
          topVillages.find(el => el.rank === 1)!,
          topVillages.find(el => el.rank === 3)!
        ];
      }
    }
  }

  const getBarColor = (rank: number) => {
    switch (rank) {
      case 1: return podiumStyles.colors.first;
      case 2: return podiumStyles.colors.second;
      case 3: return podiumStyles.colors.third;
      default: return "#ccc";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "15px" }}>
      <h2 style={podiumStyles.title}>
        Desa Unggulan {inovatorProfile?.namaInovator || ""}
      </h2>
      <div style={podiumStyles.container}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          podiumOrder.map((item) => {
            if (!item) return null;

            // Tinggi bar versi 2
            let height = 100;
            if (topVillages.length === 1) height = 100;
            else if (topVillages.length === 2) {
              if (allSameRank) height = 100;
              else height = item.rank === 1 ? 100 : 80;
            }
            else if (topVillages.length === 3) {
              if (allSameRank) height = 100;
              else height = item.rank === 1 ? 100 : item.rank === 2 ? 80 : 60;
            }

            return (
              <div key={item.name} style={podiumStyles.item}>
                <div style={podiumStyles.name}>{item.name}</div>
                <div
                  style={{
                    ...podiumStyles.barBase,
                    backgroundColor: getBarColor(item.rank),
                    height: `${height}px`,
                    position: "relative",
                    boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <div style={podiumStyles.rankLabel}>
                    <span style={{ fontSize: "18pt" }}>{item.rank}</span>
                    <span style={{ fontSize: "10pt" }}>
                      {item.label.replace(/[0-9]/g, "")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div
        style={{
          width: "90%",
          borderBottom: "2px solid #244E3B",
          marginTop: "-2px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
        }}
      />
    </div>
  );
};

export default TopVillages;