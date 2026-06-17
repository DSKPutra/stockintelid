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
import { formatRupiah, formatPercent } from '@idx/shared';

export const DashboardScreen: React.FC = () => {
  const { theme, setScreen, watchlist, toggleWatchlistLocal } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();

  const [stocks, setStocks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsivitas layout
  const isLargeScreen = windowWidth >= 768;

  useEffect(() => {
    const loadData = async () => {
      try {
        const stockList = await stockApi.getStocks();
        setStocks(stockList);

        const quoteMap: Record<string, any> = {};
        for (const stock of stockList) {
          const q = await stockApi.getQuote(stock.ticker);
          quoteMap[stock.ticker] = q;
        }
        setQuotes(quoteMap);

        const sectorList = await stockApi.getSectors();
        setSectors(sectorList);
      } catch (e) {
        console.error('Gagal mengambil data dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Memuat data bursa IDX...</Text>
      </View>
    );
  }

  // Cari top gainers dan losers
  const quotesList = Object.values(quotes);
  const topGainers = [...quotesList]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 4);

  const topLosers = [...quotesList]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 4);

  // Ambil list saham yang ada di watchlist
  const watchlistStocks = stocks.filter((s) => watchlist.includes(s.ticker));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header IHSG */}
      <View style={[styles.ihsgContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.ihsgLabel, { color: colors.textSecondary }]}>IHSG (Indeks Harga Saham Gabungan)</Text>
          <Text style={[styles.ihsgValue, { color: colors.textPrimary }]}>7.185,34</Text>
        </View>
        <View style={styles.ihsgRight}>
          <Text style={[styles.ihsgChange, { color: colors.success }]}>+38,12 (+0,53%)</Text>
          <Text style={[styles.ihsgTime, { color: colors.textMuted }]}>Terakhir Diperbarui: Hari Ini</Text>
        </View>
      </View>

      {/* Grid Utama (Responsive) */}
      <View style={isLargeScreen ? styles.gridLarge : styles.gridMobile}>
        {/* Watchlist */}
        <View style={[styles.section, isLargeScreen && { flex: 1.5, marginRight: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⭐ Watchlist Saya</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {watchlistStocks.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Watchlist Anda kosong. Cari saham lalu tambahkan ke watchlist.</Text>
            ) : (
              watchlistStocks.map((stock) => {
                const q = quotes[stock.ticker] || { price: 0, changePercent: 0 };
                return (
                  <Pressable
                    key={stock.ticker}
                    style={[styles.stockRow, { borderBottomColor: colors.border }]}
                    onPress={() => setScreen('STOCK_DETAIL', { ticker: stock.ticker })}
                  >
                    <View>
                      <Text style={[styles.tickerText, { color: colors.textPrimary }]}>{stock.ticker}</Text>
                      <Text style={[styles.nameText, { color: colors.textMuted }]} numberOfLines={1}>{stock.name}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.priceText, { color: colors.textPrimary }]}>{formatRupiah(q.price)}</Text>
                      <Text style={[styles.changePercentText, { color: q.changePercent >= 0 ? colors.success : colors.danger }]}>
                        {formatPercent(q.changePercent)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* Top Movers (Gainers / Losers) */}
        <View style={[styles.section, isLargeScreen && { flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🔥 Penggerak Pasar</Text>
          
          {/* Top Gainers */}
          <Text style={[styles.subSectionTitle, { color: colors.success }]}>🚀 Top Gainers</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
            {topGainers.map((q) => {
              const s = stocks.find((x) => x.ticker === q.ticker) || { name: '' };
              return (
                <Pressable
                  key={q.ticker}
                  style={[styles.miniRow, { borderBottomColor: colors.border }]}
                  onPress={() => setScreen('STOCK_DETAIL', { ticker: q.ticker })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tickerMiniText, { color: colors.textPrimary }]}>{q.ticker}</Text>
                    <Text style={[styles.nameMiniText, { color: colors.textMuted }]} numberOfLines={1}>{s.name}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.priceMiniText, { color: colors.textPrimary }]}>{formatRupiah(q.price)}</Text>
                    <Text style={[styles.pctMiniText, { color: colors.success }]}>{formatPercent(q.changePercent)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Top Losers */}
          <Text style={[styles.subSectionTitle, { color: colors.danger }]}>📉 Top Losers</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {topLosers.map((q) => {
              const s = stocks.find((x) => x.ticker === q.ticker) || { name: '' };
              return (
                <Pressable
                  key={q.ticker}
                  style={[styles.miniRow, { borderBottomColor: colors.border }]}
                  onPress={() => setScreen('STOCK_DETAIL', { ticker: q.ticker })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tickerMiniText, { color: colors.textPrimary }]}>{q.ticker}</Text>
                    <Text style={[styles.nameMiniText, { color: colors.textMuted }]} numberOfLines={1}>{s.name}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.priceMiniText, { color: colors.textPrimary }]}>{formatRupiah(q.price)}</Text>
                    <Text style={[styles.pctMiniText, { color: colors.danger }]}>{formatPercent(q.changePercent)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Indeks Sektoral */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📈 Kinerja Sektoral (IDX-IC)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectorScroll}>
          {sectors.map((sec) => (
            <Pressable
              key={sec.code}
              style={[styles.sectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setScreen('SECTORS')}
            >
              <Text style={[styles.sectorName, { color: colors.textPrimary }]}>{sec.nameId}</Text>
              <Text style={[styles.sectorPerf, { color: sec.performance >= 0 ? colors.success : colors.danger }]}>
                {formatPercent(sec.performance)}
              </Text>
              <Text style={[styles.sectorPe, { color: colors.textMuted }]}>PE Rata-rata: {sec.avgPe}x</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
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
  ihsgContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  ihsgLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  ihsgValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ihsgRight: {
    alignItems: 'flex-end',
  },
  ihsgChange: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ihsgTime: {
    fontSize: 10,
    marginTop: 4,
  },
  gridLarge: {
    flexDirection: 'row',
    width: '100%',
  },
  gridMobile: {
    flexDirection: 'column',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tickerText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 220,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  changePercentText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  miniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tickerMiniText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  nameMiniText: {
    fontSize: 10,
    maxWidth: 140,
    marginTop: 1,
  },
  priceMiniText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pctMiniText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 1,
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    fontSize: 12,
  },
  sectorScroll: {
    flexDirection: 'row',
  },
  sectorCard: {
    width: 140,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 12,
  },
  sectorName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectorPerf: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  sectorPe: {
    fontSize: 9,
  },
});
