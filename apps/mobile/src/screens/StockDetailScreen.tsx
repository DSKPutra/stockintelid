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
import { Chart } from '../components/Chart';

type TabType = 'CHART' | 'FUNDAMENTAL' | 'FINANCIALS' | 'OWNERSHIP' | 'ACTIONS';

export const StockDetailScreen: React.FC = () => {
  const { theme, selectedTicker, setScreen, watchlist, toggleWatchlistLocal } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  const [activeTab, setActiveTab] = useState<TabType>('CHART');
  const [timeframe, setTimeframe] = useState('30d');

  // States
  const [stock, setStock] = useState<any | null>(null);
  const [quote, setQuote] = useState<any | null>(null);
  const [ohlcv, setOhlcv] = useState<any[]>([]);
  const [fundamentals, setFundamentals] = useState<any | null>(null);
  const [financials, setFinancials] = useState<any | null>(null);
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [disclosures, setDisclosures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isFavorited = watchlist.includes(selectedTicker);

  useEffect(() => {
    const loadStockDetails = async () => {
      setLoading(true);
      try {
        const info = await stockApi.getStock(selectedTicker);
        setStock(info);

        const q = await stockApi.getQuote(selectedTicker);
        setQuote(q);

        const ohlcvData = await stockApi.getOHLCV(selectedTicker, timeframe);
        setOhlcv(ohlcvData);

        const fund = await stockApi.getFundamentals(selectedTicker);
        setFundamentals(fund);

        const fin = await stockApi.getFinancials(selectedTicker);
        setFinancials(fin);

        const holders = await stockApi.getShareholders(selectedTicker);
        setShareholders(holders);

        const corpActions = await stockApi.getCorporateActions(selectedTicker);
        setActions(corpActions);

        const disc = await stockApi.getDisclosures(selectedTicker);
        setDisclosures(disc);
      } catch (e) {
        console.error('Gagal memuat detail saham:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStockDetails();
  }, [selectedTicker, timeframe]);

  if (loading || !stock) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Memuat data emiten {selectedTicker}...</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'CHART':
        return (
          <View>
            <View style={styles.timeframeRow}>
              {['30d', '90d', '1y'].map((tf) => (
                <Pressable
                  key={tf}
                  style={[
                    styles.tfButton,
                    { backgroundColor: timeframe === tf ? colors.primary : colors.card },
                  ]}
                  onPress={() => setTimeframe(tf)}
                >
                  <Text style={[styles.tfText, { color: timeframe === tf ? '#ffffff' : colors.textSecondary }]}>
                    {tf.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Chart data={ohlcv} />
            <Text style={[styles.chartNotice, { color: colors.textMuted }]}>
              💡 Geser kursor di atas grafik untuk melihat data harga pembukaan (O), tertinggi (H), terendah (L), penutupan (C), dan volume.
            </Text>
          </View>
        );

      case 'FUNDAMENTAL':
        if (!fundamentals) return null;
        return (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Snapshot Rasio Keuangan</Text>
            <View style={styles.metricsGrid}>
              {[
                { label: 'PER (Price to Earnings)', value: `${fundamentals.per}x` },
                { label: 'PBV (Price to Book)', value: `${fundamentals.pbv}x` },
                { label: 'ROE (Return on Equity)', value: `${fundamentals.roe}%` },
                { label: 'DER (Debt to Equity)', value: `${fundamentals.der}x` },
                { label: 'EPS (Earnings Per Share)', value: `Rp ${fundamentals.eps}` },
                { label: 'Dividend Yield', value: `${fundamentals.dividendYield}%` },
                { label: 'Net Profit Margin', value: `${fundamentals.netMargin}%` },
                { label: 'Market Cap', value: `Rp ${(fundamentals.marketCap / 1e12).toFixed(1)} T` },
              ].map((m, idx) => (
                <View key={idx} style={[styles.metricBox, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{m.label}</Text>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{m.value}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.sourceText, { color: colors.textMuted }]}>Sumber: {fundamentals.source}</Text>
          </View>
        );

      case 'FINANCIALS':
        if (!financials) return null;
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colHeader, { color: colors.textPrimary, width: 140 }]}>Metrik Keuangan (Rp M)</Text>
                {financials.periods.map((p: any) => (
                  <Text key={p.period} style={[styles.colHeaderVal, { color: colors.textPrimary }]}>{p.period}</Text>
                ))}
              </View>

              {[
                { label: 'Pendapatan (Revenue)', key: 'revenue' },
                { label: 'Laba Bersih (Net Income)', key: 'netIncome' },
                { label: 'Total Aset', key: 'totalAssets' },
                { label: 'Total Liabilitas', key: 'totalLiabilities' },
                { label: 'Total Ekuitas', key: 'totalEquity' },
                { label: 'Arus Kas Operasi', key: 'operatingCashFlow' },
              ].map((row, idx) => (
                <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.colLabel, { color: colors.textSecondary, width: 140 }]}>{row.label}</Text>
                  {financials.periods.map((p: any) => (
                    <Text key={p.period} style={[styles.colVal, { color: colors.textPrimary }]}>
                      Rp {p[row.key]}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        );

      case 'OWNERSHIP':
        return (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Pemegang Saham Pengendali & Publik</Text>
            {shareholders.map((sh, idx) => (
              <View key={idx} style={[styles.holderRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1.5 }}>
                  <Text style={[styles.holderName, { color: colors.textPrimary }]}>{sh.holderName}</Text>
                  {sh.groupId && (
                    <Pressable
                      style={[styles.groupBadge, { backgroundColor: colors.cardLight }]}
                      onPress={() => setScreen('OWNERSHIP', { groupId: sh.groupId })}
                    >
                      <Text style={[styles.groupBadgeText, { color: colors.primary }]}>🔗 Grup {sh.groupId.toUpperCase()}</Text>
                    </Pressable>
                  )}
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[styles.holderPct, { color: colors.textPrimary }]}>{sh.pct}%</Text>
                  <Text style={[styles.holderShares, { color: colors.textMuted }]}>{(sh.shares / 1e6).toFixed(1)}M lembar</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'ACTIONS':
        return (
          <View>
            {/* Aksi Korporasi */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📅 Aksi Korporasi Terbaru</Text>
              {actions.length === 0 ? (
                <Text style={{ color: colors.textSecondary, padding: 8 }}>Tidak ada aksi korporasi terbaru</Text>
              ) : (
                actions.map((act) => (
                  <View key={act.id} style={[styles.actionRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.actionBadge, { backgroundColor: act.type === 'DIVIDEND' ? colors.success : colors.primary }]}>
                      <Text style={styles.actionBadgeText}>{act.type}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.actionDate, { color: colors.textMuted }]}>{act.date}</Text>
                      <Text style={[styles.actionDesc, { color: colors.textPrimary }]}>{act.description}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Keterbukaan Informasi */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📢 Keterbukaan Informasi</Text>
              {disclosures.map((disc) => (
                <View key={disc.id} style={[styles.discRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.discDate, { color: colors.textMuted }]}>{disc.date}</Text>
                  <Text style={[styles.discTitle, { color: colors.textPrimary }]}>{disc.title}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Emiten */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.tickerTitle, { color: colors.textPrimary }]}>{stock.ticker}</Text>
            <Pressable
              onPress={() => toggleWatchlistLocal(stock.ticker)}
              style={styles.starButton}
            >
              <Text style={{ fontSize: 22, color: isFavorited ? colors.warning : colors.textMuted }}>
                {isFavorited ? '★' : '☆'}
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.stockName, { color: colors.textSecondary }]}>{stock.name}</Text>
          <Text style={[styles.stockSector, { color: colors.textMuted }]}>
            {stock.sectorCode.toUpperCase()} • {stock.subSector}
          </Text>
        </View>

        {quote && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.priceTitle, { color: colors.textPrimary }]}>Rp {quote.price}</Text>
            <Text style={[styles.changeText, { color: quote.changePercent >= 0 ? colors.success : colors.danger }]}>
              {quote.changePercent >= 0 ? '+' : ''}{quote.change} ({quote.changePercent}%)
            </Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsScroll, { borderBottomColor: colors.border }]}>
        {[
          { id: 'CHART', label: 'Chart' },
          { id: 'FUNDAMENTAL', label: 'Fundamental' },
          { id: 'FINANCIALS', label: 'Laporan Keuangan' },
          { id: 'OWNERSHIP', label: 'Kepemilikan' },
          { id: 'ACTIONS', label: 'Aksi & Berita' },
        ].map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.tabItem,
              { borderBottomColor: activeTab === tab.id ? colors.primary : 'transparent' },
            ]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>{renderTabContent()}</View>

      <View style={styles.bottomSpacer} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tickerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  starButton: {
    marginLeft: 10,
    padding: 4,
  },
  stockName: {
    fontSize: 14,
    marginTop: 4,
  },
  stockSector: {
    fontSize: 12,
    marginTop: 2,
  },
  priceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tabsScroll: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabContentContainer: {
    marginBottom: 40,
  },
  timeframeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tfButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tfText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  chartNotice: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricBox: {
    width: '50%',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  metricLabel: {
    fontSize: 10,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sourceText: {
    fontSize: 9,
    marginTop: 12,
    textAlign: 'right',
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minWidth: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderBottomWidth: 1.5,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  colHeaderVal: {
    fontSize: 11,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
  colLabel: {
    fontSize: 11,
  },
  colVal: {
    fontSize: 11,
    width: 80,
    textAlign: 'right',
  },
  holderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  holderName: {
    fontSize: 13,
    fontWeight: '600',
  },
  groupBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  holderPct: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  holderShares: {
    fontSize: 10,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    width: 80,
    alignItems: 'center',
  },
  actionBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionDate: {
    fontSize: 10,
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  discRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  discDate: {
    fontSize: 10,
  },
  discTitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
