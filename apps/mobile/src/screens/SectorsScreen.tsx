import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { getThemeColors, useAppStore } from '../store';
import { stockApi } from '../api';

export const SectorsScreen: React.FC = () => {
  const { theme, setScreen } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  const [sectors, setSectors] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSectorsData = async () => {
      try {
        const sectorList = await stockApi.getSectors();
        setSectors(sectorList);

        const stockList = await stockApi.getStocks();
        setStocks(stockList);

        // Pilih sektor pertama secara default
        if (sectorList.length > 0) {
          setSelectedSector(sectorList[0]!.code);
        }
      } catch (e) {
        console.error('Gagal mengambil data sektoral:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSectorsData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Menganalisis Kinerja Sektoral...</Text>
      </View>
    );
  }

  // Saham yang berada di sektor terpilih
  const selectedSectorStocks = stocks.filter((s) => s.sectorCode === selectedSector);

  // Pewarnaan heatmap dinamis berbasis performa HSL
  const getHeatmapColor = (perf: number) => {
    if (perf > 0) {
      // Hijau: Dari opacity rendah ke penuh berdasarkan performa (max cap di +4%)
      const intensity = Math.min(1, perf / 4);
      return `rgba(16, 185, 129, ${0.1 + intensity * 0.9})`;
    } else {
      // Merah: Dari opacity rendah ke penuh berdasarkan performa (min cap di -4%)
      const intensity = Math.min(1, Math.abs(perf) / 4);
      return `rgba(239, 68, 68, ${0.1 + intensity * 0.9})`;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>📊 Analisis Sektor IDX-IC</Text>

      {/* Grid Heatmap Performa Sektor */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Heatmap Performa Sektoral</Text>
      <View style={styles.heatmapGrid}>
        {sectors.map((sec) => {
          const isSelected = selectedSector === sec.code;
          const bg = getHeatmapColor(sec.performance);

          return (
            <Pressable
              key={sec.code}
              style={[
                styles.heatmapBox,
                {
                  backgroundColor: bg,
                  borderColor: isSelected ? colors.primary : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                  width: isLargeScreen ? '18%' : '30%',
                },
              ]}
              onPress={() => setSelectedSector(sec.code)}
            >
              <Text style={styles.heatmapName}>{sec.nameId}</Text>
              <Text style={styles.heatmapPerf}>
                {sec.performance >= 0 ? '+' : ''}{sec.performance}%
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Rincian Sektor Terpilih */}
      {selectedSector && (
        <View style={styles.detailContainer}>
          {(() => {
            const sec = sectors.find((s) => s.code === selectedSector)!;
            return (
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Sektor {sec.nameId} (${sec.nameEn})</Text>
                    <Text style={[styles.detailSub, { color: colors.textMuted }]}>Bobot Kontribusi IHSG: {sec.contributionIHSG}%</Text>
                  </View>
                  <View style={styles.statsRight}>
                    <Text style={[styles.detailPerf, { color: sec.performance >= 0 ? colors.success : colors.danger }]}>
                      {sec.performance >= 0 ? '+' : ''}{sec.performance}%
                    </Text>
                    <Text style={[styles.detailPe, { color: colors.textSecondary }]}>Rata-rata PE: {sec.avgPe}x</Text>
                  </View>
                </View>

                {/* Info Top Stocks */}
                <View style={styles.bestWorstBox}>
                  <View style={[styles.bwItem, { borderRightColor: colors.border }]}>
                    <Text style={[styles.bwLabel, { color: colors.textMuted }]}>Emiten Terunggul (Best)</Text>
                    <Pressable onPress={() => setScreen('STOCK_DETAIL', { ticker: sec.bestTicker })}>
                      <Text style={[styles.bwTicker, { color: colors.success }]}>🚀 {sec.bestTicker}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.bwItem}>
                    <Text style={[styles.bwLabel, { color: colors.textMuted }]}>Emiten Terlemah (Worst)</Text>
                    <Pressable onPress={() => setScreen('STOCK_DETAIL', { ticker: sec.worstTicker })}>
                      <Text style={[styles.bwTicker, { color: colors.danger }]}>📉 {sec.worstTicker}</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Daftar Emiten */}
                <Text style={[styles.stocksTitle, { color: colors.textPrimary }]}>Daftar Emiten di Sektor Ini ({selectedSectorStocks.length})</Text>
                {selectedSectorStocks.map((stock) => (
                  <Pressable
                    key={stock.ticker}
                    style={[styles.stockRow, { borderBottomColor: colors.border }]}
                    onPress={() => setScreen('STOCK_DETAIL', { ticker: stock.ticker })}
                  >
                    <View style={{ flex: 1.5 }}>
                      <Text style={[styles.tickerText, { color: colors.primary }]}>{stock.ticker}</Text>
                      <Text style={[styles.stockNameText, { color: colors.textSecondary }]} numberOfLines={1}>{stock.name}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={[styles.stockCapText, { color: colors.textPrimary }]}>Rp {(stock.marketCap / 1e12).toFixed(1)} T</Text>
                      <Text style={[styles.stockSubText, { color: colors.textMuted }]}>{stock.subSector}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            );
          })()}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  heatmapBox: {
    padding: 12,
    borderRadius: 8,
    minHeight: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapName: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  heatmapPerf: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
    marginTop: 4,
  },
  detailContainer: {
    marginBottom: 20,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: 12,
    borderBottomColor: '#243452',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statsRight: {
    alignItems: 'flex-end',
  },
  detailPerf: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailPe: {
    fontSize: 11,
    marginTop: 2,
  },
  bestWorstBox: {
    flexDirection: 'row',
    marginVertical: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#243452',
  },
  bwItem: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  bwLabel: {
    fontSize: 10,
  },
  bwTicker: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  stocksTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tickerText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  stockNameText: {
    fontSize: 11,
    marginTop: 1,
  },
  stockCapText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockSubText: {
    fontSize: 10,
    marginTop: 1,
  },
});
