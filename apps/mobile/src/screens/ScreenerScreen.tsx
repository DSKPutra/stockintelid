import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { getThemeColors, useAppStore } from '../store';
import { stockApi } from '../api';

export const ScreenerScreen: React.FC = () => {
  const { theme, setScreen } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  // Filter states
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [minRoe, setMinRoe] = useState('0');
  const [maxPe, setMaxPe] = useState('100');
  const [maxPbv, setMaxPbv] = useState('20');

  // Data states
  const [stocks, setStocks] = useState<any[]>([]);
  const [fundamentals, setFundamentals] = useState<Record<string, any>>({});
  const [groups, setGroups] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScreenerData = async () => {
      try {
        const stockList = await stockApi.getStocks();
        setStocks(stockList);

        const fundMap: Record<string, any> = {};
        for (const s of stockList) {
          const f = await stockApi.getFundamentals(s.ticker);
          fundMap[s.ticker] = f;
        }
        setFundamentals(fundMap);

        const groupList = await stockApi.getGroups();
        setGroups(groupList);

        const sectorList = await stockApi.getSectors();
        setSectors(sectorList);

        setFilteredStocks(stockList);
      } catch (e) {
        console.error('Gagal memuat data screener:', e);
      } finally {
        setLoading(false);
      }
    };
    loadScreenerData();
  }, []);

  const runScreener = () => {
    const minRoeVal = parseFloat(minRoe) || 0;
    const maxPeVal = parseFloat(maxPe) || 999999;
    const maxPbvVal = parseFloat(maxPbv) || 999999;

    const result = stocks.filter((stock) => {
      // Filter Sektor
      if (selectedSector !== 'ALL' && stock.sectorCode !== selectedSector) return false;

      // Filter Grup Pengendali
      if (selectedGroup !== 'ALL') {
        const group = groups.find((g) => g.id === selectedGroup);
        if (!group || !group.tickers.includes(stock.ticker)) return false;
      }

      // Filter Fundamental
      const fund = fundamentals[stock.ticker];
      if (fund) {
        if (fund.roe < minRoeVal) return false;
        // Hanya cek PE jika positif (biar tidak menyaring saham rugi secara salah jika PE bernilai negatif)
        if (fund.per > 0 && fund.per > maxPeVal) return false;
        if (fund.pbv > maxPbvVal) return false;
      } else {
        return false;
      }

      return true;
    });

    setFilteredStocks(result);
  };

  const resetFilters = () => {
    setSelectedSector('ALL');
    setSelectedGroup('ALL');
    setMinRoe('0');
    setMaxPe('100');
    setMaxPbv('20');
    setFilteredStocks(stocks);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Menyiapkan Screener...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>🔍 Stock Screener</Text>
      
      {/* Box Filter */}
      <View style={[styles.filterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.filterCardTitle, { color: colors.textPrimary }]}>Kriteria Penyaringan</Text>
        
        <View style={isLargeScreen ? styles.rowLarge : styles.rowMobile}>
          {/* Sektor */}
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sektor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
              <Pressable
                style={[styles.badge, { backgroundColor: selectedSector === 'ALL' ? colors.primary : colors.cardLight }]}
                onPress={() => setSelectedSector('ALL')}
              >
                <Text style={{ color: selectedSector === 'ALL' ? '#ffffff' : colors.textSecondary, fontSize: 11 }}>SEMUA</Text>
              </Pressable>
              {sectors.map((sec) => (
                <Pressable
                  key={sec.code}
                  style={[styles.badge, { backgroundColor: selectedSector === sec.code ? colors.primary : colors.cardLight }]}
                  onPress={() => setSelectedSector(sec.code)}
                >
                  <Text style={{ color: selectedSector === sec.code ? '#ffffff' : colors.textSecondary, fontSize: 11 }}>{sec.nameId}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Grup Pemilik */}
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Grup Pengendali</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
              <Pressable
                style={[styles.badge, { backgroundColor: selectedGroup === 'ALL' ? colors.primary : colors.cardLight }]}
                onPress={() => setSelectedGroup('ALL')}
              >
                <Text style={{ color: selectedGroup === 'ALL' ? '#ffffff' : colors.textSecondary, fontSize: 11 }}>SEMUA</Text>
              </Pressable>
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  style={[styles.badge, { backgroundColor: selectedGroup === g.id ? colors.primary : colors.cardLight }]}
                  onPress={() => setSelectedGroup(g.id)}
                >
                  <Text style={{ color: selectedGroup === g.id ? '#ffffff' : colors.textSecondary, fontSize: 11 }}>{g.name.split('/')[0]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.inputsGrid}>
          {/* Min ROE */}
          <View style={styles.gridInputItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Min ROE (%)</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={minRoe}
              onChangeText={setMinRoe}
              keyboardType="numeric"
            />
          </View>

          {/* Max PE */}
          <View style={styles.gridInputItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Max PER (x)</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={maxPe}
              onChangeText={setMaxPe}
              keyboardType="numeric"
            />
          </View>

          {/* Max PBV */}
          <View style={styles.gridInputItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Max PBV (x)</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={maxPbv}
              onChangeText={setMaxPbv}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.actionsRow}>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={runScreener}>
            <Text style={styles.btnText}>Terapkan Filter</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.cardLight }]} onPress={resetFilters}>
            <Text style={[styles.btnText, { color: colors.textSecondary }]}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {/* Hasil Screening */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📈 Hasil Screening ({filteredStocks.length} Saham)</Text>
      <View style={[styles.resultsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {filteredStocks.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Tidak ada saham yang memenuhi kriteria filter.</Text>
        ) : (
          <ScrollView horizontal>
            <View style={{ minWidth: 500 }}>
              <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colHeader, { color: colors.textPrimary, width: 80 }]}>Ticker</Text>
                <Text style={[styles.colHeader, { color: colors.textPrimary, width: 140 }]}>Nama Emiten</Text>
                <Text style={[styles.colHeader, { color: colors.textPrimary, width: 60, textAlign: 'right' }]}>PER</Text>
                <Text style={[styles.colHeader, { color: colors.textPrimary, width: 60, textAlign: 'right' }]}>PBV</Text>
                <Text style={[styles.colHeader, { color: colors.textPrimary, width: 60, textAlign: 'right' }]}>ROE</Text>
                <Text style={[styles.colHeader, { color: colors.textPrimary, width: 80, textAlign: 'right' }]}>Market Cap</Text>
              </View>

              {filteredStocks.map((stock) => {
                const f = fundamentals[stock.ticker] || { per: '-', pbv: '-', roe: '-' };
                return (
                  <Pressable
                    key={stock.ticker}
                    style={[styles.tableRow, { borderBottomColor: colors.border }]}
                    onPress={() => setScreen('STOCK_DETAIL', { ticker: stock.ticker })}
                  >
                    <Text style={[styles.tickerText, { color: colors.primary, width: 80 }]}>{stock.ticker}</Text>
                    <Text style={[styles.nameText, { color: colors.textSecondary, width: 140 }]} numberOfLines={1}>{stock.name}</Text>
                    <Text style={[styles.valText, { color: colors.textPrimary, width: 60, textAlign: 'right' }]}>{f.per}x</Text>
                    <Text style={[styles.valText, { color: colors.textPrimary, width: 60, textAlign: 'right' }]}>{f.pbv}x</Text>
                    <Text style={[styles.valText, { color: colors.textPrimary, width: 60, textAlign: 'right' }]}>{f.roe}%</Text>
                    <Text style={[styles.valText, { color: colors.textPrimary, width: 80, textAlign: 'right' }]}>
                      {(stock.marketCap / 1e12).toFixed(1)}T
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
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
  filterCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  filterCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  rowLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowMobile: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  badgeScroll: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  inputsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  gridInputItem: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    height: 36,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 12,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableHeader: {
    borderBottomWidth: 1.5,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tickerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 12,
  },
  valText: {
    fontSize: 12,
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    fontSize: 12,
  },
});
