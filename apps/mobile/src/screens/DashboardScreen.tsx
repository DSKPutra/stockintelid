import React, { useEffect, useState, useRef } from 'react';
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

export const DashboardScreen: React.FC = () => {
  const { theme, setScreen, watchlist } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Investor View state
  const [activeInvestor, setActiveInvestor] = useState<string | null>(null);
  const [investorProfile, setInvestorProfile] = useState<any | null>(null);
  const [loadingInvestor, setLoadingInvestor] = useState(false);

  // Main data states
  const [stocks, setStocks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Debounce ref
  const debounceTimeout = useRef<any>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
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
        console.error('Gagal memuat data dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Debounced Universal Search
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/stocks/search-universal?q=${encodeURIComponent(searchQuery)}`)
          .then((r) => r.json());
        setSearchResults(res);
      } catch (e) {
        console.error('Universal search error:', e);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchQuery]);

  // Load Investor Profile
  const loadInvestor = async (name: string) => {
    setLoadingInvestor(true);
    setActiveInvestor(name);
    setSearchQuery('');
    setSearchResults([]);
    try {
      const res = await fetch(`http://localhost:4000/api/stocks/investors/${encodeURIComponent(name)}`)
        .then((r) => r.json());
      setInvestorProfile(res);
    } catch (e) {
      console.error('Investor profile fetch error:', e);
    } finally {
      setLoadingInvestor(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Mengakses StockIntelID...</Text>
      </View>
    );
  }

  // Jika sedang melihat profil investor tertentu
  if (activeInvestor) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.cardLight }]}
          onPress={() => {
            setActiveInvestor(null);
            setInvestorProfile(null);
          }}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>← Kembali ke Dashboard</Text>
        </Pressable>

        {loadingInvestor || !investorProfile ? (
          <View style={styles.centerDetail}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Memuat portofolio {activeInvestor}...</Text>
          </View>
        ) : (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>👤 Profil Investor: {investorProfile.name}</Text>
            
            {/* Agregasi Aset */}
            <View style={[styles.statsGrid, { marginVertical: 16 }]}>
              <View style={[styles.statBox, { backgroundColor: colors.cardLight, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Jumlah Kepemilikan Ticker</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{investorProfile.holdings.length} Emiten</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.cardLight, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Estimasi Aset</Text>
                <Text style={[styles.statValue, { color: colors.secondary }]}>
                  Rp {(investorProfile.holdings.reduce((sum: number, h: any) => sum + h.marketVal, 0) / 1e9).toFixed(1)} Miliar
                </Text>
              </View>
            </View>

            <Text style={[styles.subSectionTitle, { color: colors.textPrimary }]}>Daftar Portofolio Saham</Text>
            {investorProfile.holdings.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Tidak ada saham tercatat atas nama ini.</Text>
            ) : (
              investorProfile.holdings.map((h: any) => (
                <Pressable
                  key={h.ticker}
                  style={[styles.stockRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setActiveInvestor(null);
                    setScreen('STOCK_DETAIL', { ticker: h.ticker });
                  }}
                >
                  <View>
                    <Text style={[styles.tickerText, { color: colors.primary }]}>{h.ticker}</Text>
                    <Text style={[styles.nameText, { color: colors.textSecondary }]} numberOfLines={1}>{h.stockName}</Text>
                    <Text style={[styles.smallText, { color: colors.textMuted }]}>
                      Tipe: {h.holderType} ({h.localForeign === 'L' ? 'Lokal' : 'Asing'})
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.priceText, { color: colors.textPrimary }]}>{h.pct}%</Text>
                    <Text style={[styles.smallText, { color: colors.textMuted }]}>
                      Rp {(h.marketVal / 1e9).toFixed(1)}M
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // Agregasi untuk Dashboard
  const watchlistStocks = stocks.filter((s) => watchlist.includes(s.ticker));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar Universal */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="Cari emiten (BREN), investor (Lo Kheng Hong), atau konglomerasi..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searching && (
          <ActivityIndicator style={styles.searchLoader} size="small" color={colors.primary} />
        )}

        {/* Hasil Search Universal */}
        {searchResults.length > 0 && (
          <View style={[styles.searchDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {searchResults.map((res: any, idx: number) => (
              <Pressable
                key={idx}
                style={[styles.searchResultRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  if (res.type === 'ticker') {
                    setScreen('STOCK_DETAIL', { ticker: res.id });
                    setSearchQuery('');
                  } else if (res.type === 'group') {
                    setScreen('OWNERSHIP', { groupId: res.id });
                    setSearchQuery('');
                  } else if (res.type === 'investor') {
                    loadInvestor(res.id);
                  }
                }}
              >
                <View>
                  <Text style={[styles.searchResultTitle, { color: colors.textPrimary }]}>{res.title}</Text>
                  <Text style={[styles.searchResultSubtitle, { color: colors.textMuted }]}>{res.subtitle}</Text>
                </View>
                <View style={[styles.searchBadge, { backgroundColor: res.type === 'ticker' ? colors.primary : res.type === 'group' ? colors.secondary : colors.warning }]}>
                  <Text style={styles.searchBadgeText}>{res.type.toUpperCase()}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Hot Searches */}
      <View style={styles.hotSearchesRow}>
        <Text style={[styles.hotLabel, { color: colors.textMuted }]}>Pencarian Populer: </Text>
        {[
          { label: 'BREN', type: 'ticker', id: 'BREN' },
          { label: 'Lo Kheng Hong', type: 'investor', id: 'Lo Kheng Hong' },
          { label: 'Barito', type: 'group', id: 'barito' },
          { label: 'BBCA', type: 'ticker', id: 'BBCA' },
        ].map((h, idx) => (
          <Pressable
            key={idx}
            style={[styles.hotBadge, { backgroundColor: colors.cardLight }]}
            onPress={() => {
              if (h.type === 'ticker') setScreen('STOCK_DETAIL', { ticker: h.id });
              else if (h.type === 'group') setScreen('OWNERSHIP', { groupId: h.id });
              else if (h.type === 'investor') loadInvestor(h.id);
            }}
          >
            <Text style={[styles.hotBadgeText, { color: colors.primary }]}>{h.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Market Statistics Cards */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📈 Kinerja Pasar & Statistik Kepemilikan</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>IHSG Indeks</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>7,185.34</Text>
          <Text style={[styles.statChange, { color: colors.success }]}>+0.53%</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Investor Terdaftar KSEI</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>12.8 Juta</Text>
          <Text style={[styles.statChange, { color: colors.secondary }]}>+12.4% YTD</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Breakdown Investor Saham</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>54.2% Lokal</Text>
          <Text style={[styles.statChange, { color: colors.danger }]}>45.8% Asing</Text>
        </View>
      </View>

      {/* Grid Utama (Watchlist & Hot Investors) */}
      <View style={isLargeScreen ? styles.gridLarge : styles.gridMobile}>
        {/* Watchlist */}
        <View style={[styles.section, isLargeScreen && { flex: 1.5, marginRight: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⭐ Watchlist Saya</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {watchlistStocks.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Watchlist Anda kosong. Cari emiten di pencarian untuk menambahkan.</Text>
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
                      <Text style={[styles.priceText, { color: colors.textPrimary }]}>Rp {q.price}</Text>
                      <Text style={[styles.changePercentText, { color: q.changePercent >= 0 ? colors.success : colors.danger }]}>
                        {q.changePercent >= 0 ? '+' : ''}{q.changePercent}%
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* Top Foreign Investors & Konglomerat */}
        <View style={[styles.section, isLargeScreen && { flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🔥 Investor Utama & Institusi</Text>
          
          <Text style={[styles.subSectionTitle, { color: colors.secondary }]}>🏢 Top Foreign/Institutional Investors</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
            {[
              { name: 'Government of Norway', type: 'Foreign Gov' },
              { name: 'Vanguard Emerging Markets Index Fund', type: 'Foreign MF' },
              { name: 'BPJS Ketenagakerjaan', type: 'Local Pension' },
              { name: 'Lo Kheng Hong', type: 'Local Retailer UBO' },
            ].map((inv) => (
              <Pressable
                key={inv.name}
                style={[styles.miniRow, { borderBottomColor: colors.border }]}
                onPress={() => loadInvestor(inv.name)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tickerMiniText, { color: colors.textPrimary }]}>{inv.name}</Text>
                  <Text style={[styles.nameMiniText, { color: colors.textMuted }]}>{inv.type}</Text>
                </View>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>Detail →</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Indeks Sektoral */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📈 Kinerja Sektoral IDX-IC</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectorScroll}>
          {sectors.map((sec) => (
            <Pressable
              key={sec.code}
              style={[styles.sectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setScreen('SECTORS')}
            >
              <Text style={[styles.sectorName, { color: colors.textPrimary }]}>{sec.nameId}</Text>
              <Text style={[styles.sectorPerf, { color: sec.performance >= 0 ? colors.success : colors.danger }]}>
                {sec.performance >= 0 ? '+' : ''}{sec.performance}%
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
  centerDetail: {
    padding: 40,
    alignItems: 'center',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 8,
    zIndex: 10,
  },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 13,
  },
  searchDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    maxHeight: 250,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchResultSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  searchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  searchBadgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  hotSearchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 20,
  },
  hotLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  hotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginVertical: 4,
  },
  hotBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  statChange: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 220,
  },
  smallText: {
    fontSize: 10,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  changePercentText: {
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  nameMiniText: {
    fontSize: 10,
    marginTop: 1,
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectorPerf: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  sectorPe: {
    fontSize: 9,
  },
  // Investor Detail view styles
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 16,
  },
  backText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
