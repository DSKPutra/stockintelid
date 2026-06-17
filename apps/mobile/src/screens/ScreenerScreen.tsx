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
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [minFloat, setMinFloat] = useState('0');
  const [maxFloat, setMaxFloat] = useState('100');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort states
  const [sortBy, setSortBy] = useState<string>('freeFloatPct');
  const [sortDesc, setSortDesc] = useState<boolean>(false); // ascending by default for low risk or float, but let's togglable

  // Data states
  const [screenerData, setScreenerData] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [data, sectorList] = await Promise.all([
          stockApi.getFloatScreener(),
          stockApi.getSectors(),
        ]);
        setScreenerData(data);
        setSectors(sectorList);
      } catch (e) {
        console.error('Failed to load float screener data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Filter and sort screener data local
    const minF = parseFloat(minFloat) || 0;
    const maxF = parseFloat(maxFloat) || 100;

    let result = screenerData.filter((item) => {
      // Sector Filter
      if (selectedSector !== 'ALL' && item.sectorCode !== selectedSector) return false;

      // Risk Level Filter
      if (selectedRisk !== 'ALL' && item.riskLevel !== selectedRisk) return false;

      // Free Float Pct Filter
      if (item.freeFloatPct < minF || item.freeFloatPct > maxF) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTicker = item.ticker.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesHolder = item.topHolder.toLowerCase().includes(q);
        if (!matchesTicker && !matchesName && !matchesHolder) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });

    setFilteredData(result);
  }, [screenerData, selectedSector, selectedRisk, minFloat, maxFloat, searchQuery, sortBy, sortDesc]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true); // default descending for numeric/percentages
    }
  };

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case 'High':
        return { bg: `${colors.danger}15`, text: colors.danger, border: `${colors.danger}30` };
      case 'Medium':
        return { bg: `${colors.warning}15`, text: colors.warning, border: `${colors.warning}30` };
      case 'Low':
      default:
        return { bg: `${colors.success}15`, text: colors.success, border: `${colors.success}30` };
    }
  };

  const resetFilters = () => {
    setSelectedSector('ALL');
    setSelectedRisk('ALL');
    setMinFloat('0');
    setMaxFloat('100');
    setSearchQuery('');
    setSortBy('freeFloatPct');
    setSortDesc(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>Menghitung Estimasi Free-Float KSEI...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>📊 KSEI Free Float Screener</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Skrining saham berdasarkan porsi kepemilikan masyarakat (Free Float) menggunakan metode MSCI (Strategic vs Portfolio Holders).
        </Text>
        <View style={[styles.disclaimerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            💡 **Metode MSCI Free Float**: Pemegang saham strategis (Pengendali, Direksi, Korporat, Pemerintah, Foundation) diklasifikasikan sebagai *Strategic (non-free float)*. Investor ritel, reksa dana, asuransi, broker, dan dana pensiun diklasifikasikan sebagai *Portfolio (free float)*.
          </Text>
        </View>
      </View>

      {/* Filter Card */}
      <View style={[styles.filterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.filterCardTitle, { color: colors.textPrimary }]}>⚙️ Filter Kriteria</Text>

        <View style={isLargeScreen ? styles.rowLarge : styles.rowMobile}>
          {/* Sektor */}
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sektor Saham</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
              <Pressable
                style={[
                  styles.badge,
                  { backgroundColor: selectedSector === 'ALL' ? colors.primary : `${colors.primary}10` },
                ]}
                onPress={() => setSelectedSector('ALL')}
              >
                <Text style={{ color: selectedSector === 'ALL' ? '#ffffff' : colors.textPrimary, fontSize: 11, fontWeight: '600' }}>SEMUA</Text>
              </Pressable>
              {sectors.map((sec) => (
                <Pressable
                  key={sec.code}
                  style={[
                    styles.badge,
                    { backgroundColor: selectedSector === sec.code ? colors.primary : `${colors.primary}10` },
                  ]}
                  onPress={() => setSelectedSector(sec.code)}
                >
                  <Text style={{ color: selectedSector === sec.code ? '#ffffff' : colors.textPrimary, fontSize: 11, fontWeight: '600' }}>{sec.nameId}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={isLargeScreen ? styles.rowLarge : styles.rowMobile}>
          {/* Tingkat Risiko Free Float */}
          <View style={[styles.filterItem, { marginRight: 16 }]}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Tingkat Risiko Free Float</Text>
            <View style={styles.riskBadgeContainer}>
              {['ALL', 'Low', 'Medium', 'High'].map((risk) => {
                const isActive = selectedRisk === risk;
                return (
                  <Pressable
                    key={risk}
                    style={[
                      styles.riskBadge,
                      {
                        backgroundColor: isActive ? colors.primary : `${colors.primary}10`,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedRisk(risk)}
                  >
                    <Text style={{ color: isActive ? '#ffffff' : colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
                      {risk === 'ALL' ? 'SEMUA' : risk === 'Low' ? 'Low (≥40%)' : risk === 'Medium' ? 'Medium (20-40%)' : 'High (<20%)'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Search bar inside filters */}
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Cari Emiten / Pemilik Terbesar</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background, height: 38 }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari BBCA, Salim, dll..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Input Ranges */}
        <View style={styles.inputsGrid}>
          <View style={styles.gridInputItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Min Free Float (%)</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={minFloat}
              onChangeText={setMinFloat}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.gridInputItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Max Free Float (%)</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={maxFloat}
              onChangeText={setMaxFloat}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.actionsRow, { flex: 2, justifyContent: 'flex-end', marginTop: 18 }]}>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary, minWidth: 100 }]} onPress={resetFilters}>
              <Text style={[styles.btnText, { textAlign: 'center' }]}>Reset Filter</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Screener Results */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📈 Hasil Screening ({filteredData.length} Saham)</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>*Klik nama kolom untuk mengurutkan</Text>
      </View>

      <View style={[styles.resultsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {filteredData.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Tidak ada saham yang memenuhi kriteria filter.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ minWidth: 780 }}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Pressable style={[{ width: 80 }]} onPress={() => toggleSort('ticker')}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary }]}>
                    Ticker {sortBy === 'ticker' ? (sortDesc ? '▼' : '▲') : ''}
                  </Text>
                </Pressable>
                
                <Pressable style={[{ width: 180 }]} onPress={() => toggleSort('name')}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary }]}>
                    Nama Perusahaan {sortBy === 'name' ? (sortDesc ? '▼' : '▲') : ''}
                  </Text>
                </Pressable>

                <Pressable style={[{ width: 110 }]} onPress={() => toggleSort('strategicPct')}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, textAlign: 'right' }]}>
                    Strategic Holders {sortBy === 'strategicPct' ? (sortDesc ? '▼' : '▲') : ''}
                  </Text>
                </Pressable>

                <Pressable style={[{ width: 110 }]} onPress={() => toggleSort('freeFloatPct')}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, textAlign: 'right' }]}>
                    Free Float (%) {sortBy === 'freeFloatPct' ? (sortDesc ? '▼' : '▲') : ''}
                  </Text>
                </Pressable>

                <Pressable style={[{ width: 80, alignItems: 'center' }]} onPress={() => toggleSort('riskLevel')}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, textAlign: 'center', width: '100%' }]}>
                    Risiko {sortBy === 'riskLevel' ? (sortDesc ? '▼' : '▲') : ''}
                  </Text>
                </Pressable>

                <Pressable style={[{ width: 120 }]} onPress={() => toggleSort('topHolder')}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, marginLeft: 10 }]}>
                    Pemegang Terbesar {sortBy === 'topHolder' ? (sortDesc ? '▼' : '▲') : ''}
                  </Text>
                </Pressable>

                <Pressable style={[{ width: 100 }]} onPress={() => toggleSort('marketCap')}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, textAlign: 'right' }]}>
                    Mkt Cap {sortBy === 'marketCap' ? (sortDesc ? '▼' : '▲') : ''}
                  </Text>
                </Pressable>
              </View>

              {/* Table Body */}
              {filteredData.map((item) => {
                const rStyle = getRiskBadgeStyles(item.riskLevel);
                return (
                  <Pressable
                    key={item.ticker}
                    style={[styles.tableRow, { borderBottomColor: colors.border }]}
                    onPress={() => setScreen('STOCK_DETAIL', { ticker: item.ticker })}
                  >
                    <Text style={[styles.tickerText, { color: colors.primary, width: 80 }]}>{item.ticker}</Text>
                    <Text style={[styles.nameText, { color: colors.textSecondary, width: 180 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.valText, { color: colors.textSecondary, width: 110, textAlign: 'right' }]}>
                      {item.strategicPct.toFixed(2)}%
                    </Text>
                    <Text style={[styles.valText, { color: colors.textPrimary, fontWeight: '700', width: 110, textAlign: 'right' }]}>
                      {item.freeFloatPct.toFixed(2)}%
                    </Text>
                    
                    {/* Risk Badge */}
                    <View style={[{ width: 80, alignItems: 'center' }]}>
                      <View style={[styles.riskBadgeLabel, { backgroundColor: rStyle.bg, borderColor: rStyle.border }]}>
                        <Text style={{ color: rStyle.text, fontSize: 10, fontWeight: 'bold' }}>{item.riskLevel}</Text>
                      </View>
                    </View>

                    <Text style={[styles.valText, { color: colors.textSecondary, width: 120, marginLeft: 10 }]} numberOfLines={1}>
                      {item.topHolder}
                    </Text>

                    <Text style={[styles.valText, { color: colors.textPrimary, width: 100, textAlign: 'right' }]}>
                      {(item.marketCap / 1e12).toFixed(1)}T
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <View style={{ height: 60 }} />
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  disclaimerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
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
  riskBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  inputsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  gridInputItem: {
    flex: 1,
    marginRight: 12,
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
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
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
    paddingBottom: 8,
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
  riskBadgeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    fontSize: 12,
  },
});
