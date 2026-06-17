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
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { getThemeColors, useAppStore } from '../store';
import { stockApi } from '../api';

export const OwnershipScreen: React.FC = () => {
  const { theme, selectedGroupId, setScreen } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const list = await stockApi.getGroups();
        setGroups(list);
      } catch (e) {
        console.error('Gagal mengambil grup kepemilikan:', e);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    const loadGroupDetail = async () => {
      if (!selectedGroupId) return;
      setLoadingDetail(true);
      try {
        const detail = await stockApi.getGroup(selectedGroupId);
        setSelectedGroupDetail(detail);
      } catch (e) {
        console.error('Gagal mengambil detail grup:', e);
      } finally {
        setLoadingDetail(false);
      }
    };
    loadGroupDetail();
  }, [selectedGroupId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Memuat data kepemilikan konglomerasi...</Text>
      </View>
    );
  }

  // Merender Diagram Treemap Menggunakan SVG
  const renderTreemap = () => {
    if (!selectedGroupDetail || !selectedGroupDetail.stocks || selectedGroupDetail.stocks.length === 0) return null;

    const stocksList = selectedGroupDetail.stocks;
    const totalMc = stocksList.reduce((sum: number, s: any) => sum + s.marketCap, 0);

    const containerHeight = 160;
    const containerWidth = isLargeScreen ? windowWidth - 360 : windowWidth - 32;

    let currentX = 0;
    const treemapRects = stocksList.map((stock: any, i: number) => {
      const share = stock.marketCap / totalMc;
      const rectWidth = share * containerWidth;
      const x = currentX;
      currentX += rectWidth;

      return {
        ticker: stock.ticker,
        x,
        y: 0,
        width: rectWidth,
        height: containerHeight,
        pct: (share * 100).toFixed(1),
        marketCap: (stock.marketCap / 1e12).toFixed(1),
      };
    });

    return (
      <View style={styles.treemapContainer}>
        <Text style={[styles.visualTitle, { color: colors.textPrimary }]}>📊 Visualisasi Distribusi Kapitalisasi Pasar Grup</Text>
        <Svg width={containerWidth} height={containerHeight} style={{ borderRadius: 8, overflow: 'hidden' }}>
          {treemapRects.map((r: any, idx: number) => {
            // Skema warna gradasi biru/ungu
            const fillColors = ['#2563eb', '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa'];
            const fill = fillColors[idx % fillColors.length];

            // Hanya tampilkan teks jika kotak cukup lebar
            const showText = r.width > 50;

            return (
              <React.Fragment key={r.ticker}>
                <Rect
                  x={r.x}
                  y={r.y}
                  width={r.width - 2} // Beri margin kecil antar kotak
                  height={r.height}
                  fill={fill}
                  onPress={() => setScreen('STOCK_DETAIL', { ticker: r.ticker })}
                />
                {showText && (
                  <>
                    <SvgText
                      x={r.x + r.width / 2}
                      y={r.height / 2 - 5}
                      fontSize="12"
                      fontWeight="bold"
                      fill="#ffffff"
                      textAnchor="middle"
                    >
                      {r.ticker}
                    </SvgText>
                    <SvgText
                      x={r.x + r.width / 2}
                      y={r.height / 2 + 12}
                      fontSize="9"
                      fill="#e0e7ff"
                      textAnchor="middle"
                    >
                      {r.pct}%
                    </SvgText>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>🏢 Grup Pengendali Konglomerasi IDX</Text>

      {/* Grid Utama Layout */}
      <View style={isLargeScreen ? styles.gridLarge : styles.gridMobile}>
        {/* Kolom Kiri: Daftar Grup */}
        <View style={[styles.column, isLargeScreen && { flex: 1, marginRight: 16 }]}>
          <Text style={[styles.columnTitle, { color: colors.textSecondary }]}>Pilih Konglomerasi</Text>
          {groups.map((g) => (
            <Pressable
              key={g.id}
              style={[
                styles.groupCard,
                {
                  backgroundColor: selectedGroupId === g.id ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setScreen('OWNERSHIP', { groupId: g.id })}
            >
              <Text style={[styles.groupName, { color: selectedGroupId === g.id ? '#ffffff' : colors.textPrimary }]}>
                {g.name}
              </Text>
              <Text style={[styles.groupOwner, { color: selectedGroupId === g.id ? '#e0e7ff' : colors.textMuted }]}>
                UBO: {g.ultimateOwner}
              </Text>
              <Text style={[styles.groupCap, { color: selectedGroupId === g.id ? '#ffffff' : colors.textSecondary }]}>
                Market Cap: Rp {(g.totalMarketCap / 1e12).toFixed(1)} T
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Kolom Kanan: Detail Grup */}
        <View style={[styles.column, isLargeScreen && { flex: 1.8 }]}>
          {loadingDetail ? (
            <View style={styles.centerDetail}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : selectedGroupDetail ? (
            <ScrollView style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{selectedGroupDetail.name}</Text>
              <Text style={[styles.detailOwner, { color: colors.textMuted }]}>Ultimate Beneficial Owner: {selectedGroupDetail.ultimateOwner}</Text>
              
              <Text style={[styles.detailDesc, { color: colors.textSecondary }]}>{selectedGroupDetail.description}</Text>

              {/* Tampilkan Grafik Treemap */}
              {renderTreemap()}

              {/* Tampilkan Daftar Emiten Terkait */}
              <Text style={[styles.emitenTitle, { color: colors.textPrimary }]}>Emiten Dalam Grup ({selectedGroupDetail.stocks.length})</Text>
              {selectedGroupDetail.stocks.map((stock: any) => (
                <Pressable
                  key={stock.ticker}
                  style={[styles.stockRow, { borderBottomColor: colors.border }]}
                  onPress={() => setScreen('STOCK_DETAIL', { ticker: stock.ticker })}
                >
                  <View>
                    <Text style={[styles.tickerText, { color: colors.primary }]}>{stock.ticker}</Text>
                    <Text style={[styles.stockNameText, { color: colors.textSecondary }]} numberOfLines={1}>{stock.name}</Text>
                    <Text style={[styles.stockSectorText, { color: colors.textMuted }]}>{stock.subSector}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.marketCapText, { color: colors.textPrimary }]}>Rp {(stock.marketCap / 1e12).toFixed(1)} T</Text>
                    <Text style={styles.viewLinkText}>Lihat Analisa →</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyDetail, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textMuted }}>Silakan pilih salah satu grup di sebelah kiri untuk melihat detail analisa.</Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ height: 40 }} />
    </View>
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
  centerDetail: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gridLarge: {
    flexDirection: 'row',
  },
  gridMobile: {
    flexDirection: 'column',
  },
  column: {
    marginBottom: 20,
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  groupName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  groupOwner: {
    fontSize: 10,
    marginTop: 2,
  },
  groupCap: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailOwner: {
    fontSize: 11,
    marginTop: 2,
  },
  detailDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 16,
  },
  treemapContainer: {
    marginVertical: 12,
  },
  visualTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emitenTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 10,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tickerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stockNameText: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 220,
  },
  stockSectorText: {
    fontSize: 10,
    marginTop: 2,
  },
  marketCapText: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewLinkText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyDetail: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
});
