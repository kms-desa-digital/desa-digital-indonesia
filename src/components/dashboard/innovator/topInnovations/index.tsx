import { useEffect, useState } from "react";
import { Box, Text, Flex, Link, Spinner } from "@chakra-ui/react";
import NextLink from 'next/link';
import { getAuth } from "firebase/auth";
import { paths } from "Consts/path";
import {
  podiumWrapperStyle,
  cardStyle,
  rankText,
  titleText,
  linkText,
  podiumContainerStyle,
} from "./_topInnovationsStyle";

const TopInnovations = () => {
  const [topInnovations, setTopInnovations] = useState<
    { name: string; count: number; rank: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [inovatorProfile, setInovatorProfile] = useState<{ namaInovator?: string } | null>(null);

  useEffect(() => {
    const fetchTopInnovations = async () => {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setLoading(false);
        return console.warn("User not authenticated");
      }

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/innovator/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();

        // Ambil nama inovator (karena di endpoint inovator tidak direturn profilnya secara spesifik di struktur baru, 
        // kita asumsikan 'Inovator' atau biarkan null jika tidak ada)
        setInovatorProfile({ namaInovator: "Inovator" });

        const countInovasi = (data.top3Innovations || []).map((item: any) => ({
          name: item.name || "Unknown",
          count: item.totalKlaim || 0,
        }));

        if (countInovasi.length === 0) {
          setTopInnovations([]);
          setLoading(false);
          return;
        }

        // Sorting & ranking
        const sorted = [...countInovasi].sort((a, b) => {
          if (b.count === a.count) return a.name.localeCompare(b.name);
          return b.count - a.count;
        });

        const topThree = sorted.slice(0, 3);

        // Cek apakah semua count sama
        const allSameCount = topThree.every(item => item.count === topThree[0].count);

        let ranked;

        if (allSameCount) {
          // Semua rank 1
          ranked = topThree.map((item) => ({
            ...item,
            rank: 1,
            label: "1st",
          }));
        } else {
          // Saat nilai count berbeda
          let currentRank = 1;
          let lastCount: number | null = null;

          ranked = topThree.map((item) => {
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

        setTopInnovations(ranked);
      } catch (error) {
        console.error("Error fetching innovations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopInnovations();
  }, []);

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb="10px">
        <Text {...titleText}>Inovasi Unggulan {inovatorProfile?.namaInovator || "Inovator"}</Text>
        <Link as={NextLink} href={paths.DASHBOARD_INNOVATOR_INNOVATION} {...linkText}>
          Lihat Dashboard
        </Link>
      </Flex>

      <Box {...podiumContainerStyle}>
        {loading ? (
          <Flex justify="center" align="center" h="100%">
            <Spinner size="lg" />
          </Flex>
        ) : topInnovations.length === 0 ? (
          <Flex justify="center" align="center" h="100%">
            <Text color="gray.500" fontSize="md">Belum ada data inovasi unggulan</Text>
          </Flex>
        ) : (
          <Flex
            {...podiumWrapperStyle}
            justify="center"
          >
            {topInnovations.map((item, idx, arr) => {
              const allSameRank = arr.every(el => el.rank === arr[0].rank);
              let height = "100px";

              // Tinggi podium
              if (arr.length === 1) {
                height = "120px";
              } else if (arr.length === 2) {
                if (allSameRank) {
                  height = "100px";
                } else {
                  height = item.rank === 1 ? "120px" : "100px";
                }
              } else if (arr.length === 3) {
                if (allSameRank) {
                  height = "100px";
                } else {
                  height =
                    item.rank === 1 ? "120px" :
                      item.rank === 2 ? "100px" : "80px";
                }
              }

              // Urutan/order untuk posisi podium
              let order: number | undefined;
              if (arr.length === 1) {
                // Kasus satu data
                order = 2; // tengah
              } else if (arr.length === 2) {
                // Kasus dua data
                if (allSameRank) {
                  // Data sama, di kiri & kanan
                  order = idx === 0 ? 1 : 3;
                } else {
                  // #1 di kiri, #2 di kanan
                  order = item.rank === 1 ? 1 : 3;
                }
              } else if (arr.length === 3) {
                // Kasus tiga data
                if (allSameRank) {
                  // 3 data #1
                  order = idx + 1; // urut default kiri-tengah-kanan
                } else {
                  const rank1Count = arr.filter(el => el.rank === 1).length;
                  if (rank1Count === 1) {
                    // 1 data #1 di tengah
                    if (item.rank === 1) {
                      order = 2;
                    } else {
                      // 2 data #2: satu di kiri (1) dan satu di kanan (3)
                      const rank2Items = arr.filter(el => el.rank === 2);
                      const thisIndexInRank2 = rank2Items.indexOf(item);
                      order = thisIndexInRank2 === 0 ? 1 : 3;
                    }
                  } else if (rank1Count === 2) {
                    // 2 data #1 di kiri & tengah
                    if (item.rank === 1) {
                      order = arr.indexOf(item) === 0 ? 1 : 2;
                    } else {
                      order = 3; // 1 data #2 di kanan
                    }
                  } else {
                    // Rank 1, 2, 3 berbeda semua
                    order =
                      item.rank === 1
                        ? 2 // tengah
                        : item.rank === 2
                          ? 1 // kiri
                          : 3 // kanan
                  }
                }
              }

              const bgColor =
                item.rank === 1 ? "#244E3B" :
                  item.rank === 2 ? "#347357" : "#568A73";

              return (
                <Flex
                  key={item.name}
                  direction="column"
                  align="center"
                  {...(order ? { order } : {})}
                  mx={arr.length === 1 ? 4 : 2}
                >
                  <Text fontWeight="semibold" mb={2} textAlign="center" fontSize="15">
                    {item.name}
                  </Text>
                  <Box {...cardStyle(item.rank)} height={height} bg={bgColor}>
                    <Text {...rankText}>
                      <Box as="span" fontSize="25" fontWeight="bold">
                        {item.rank}
                      </Box>
                      <Box as="span" fontSize="15" fontWeight="bold">
                        {item.label.slice(-2)}
                      </Box>
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default TopInnovations;
