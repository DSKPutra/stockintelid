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

export const MutualFundsScreen: React.FC = () => {
  const { theme, setScreen } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoading(true);
        const data = await stockApi.getMutualFunds();
        setFunds(data);
        if (data.length > 0) {
          setSelectedFundId(data[0]!.id);
        }
      } catch (e) {
        console.error('Gagal mengambil data reksa dana:', e);
      } finally {
        setLoading(false);
      }
    };
    loadFunds();
  }, []);

  const selectedFund = funds.find((f) => f.id === selectedFundId);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>Memproses Data Portofolio Reksa Dana...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>📈 Tracking Portofolio Reksa Dana Saham</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Pantau daftar reksa dana saham terbesar di Indonesia beserta porsi kepemilikan saham mayoritas dalam portofolio mereka.
        </Text>
      </View>

      <View style={isLargeScreen ? styles.gridLarge : styles.gridMobile}>
        {/* Kolom Kiri: Daftar Reksa Dana */}
        <View style={[styles.column, isLargeScreen && { width: 280, marginRight: 16 }]}>
          <Text style={[styles.columnTitle, { color: colors.textMuted }]}>PILIH REKSA DANA</Text>
          {funds.map((f) => {
            const isActive = selectedFundId === f.id;
            return (
              <Pressable
                key={f.id}
                style={[
                  styles.fundCard,
                  {
                    backgroundColor: isActive ? `${colors.primary}15` : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedFundId(f.id)}
              >
                <Text style={[styles.fundName, { color: colors.textPrimary }]}>{f.name}</Text>
                <Text style={[styles.fundManager, { color: colors.textMuted }]}>Manager: {f.manager.split(' ')[1] || f.manager}</Text>
                <View style={styles.fundMeta}>
                  <Text style={[styles.fundAum, { color: colors.textSecondary }]}>
                    AUM: <Text style={{ color: colors.primary, fontWeight: '700' }}>Rp {(f.aum / 1000).toFixed(1)} T</Text>
                  </Text>
                  <Text style={[styles.holdingsCount, { color: colors.textSecondary }]}>
                    {f.holdings.length} Holdings
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Kolom Kanan: Detail Portofolio Holdings */}
        <View style={[styles.column, isLargeScreen && { flex: 1 }]}>
          {selectedFund ? (
            <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{selectedFund.name}</Text>
                  <Text style={[styles.detailManager, { color: colors.textSecondary }]}>
                    Manajer Investasi: <Text style={{ color: colors.secondary, fontWeight: '700' }}>{selectedFund.manager}</Text>
                  </Text>
                </View>
                <View style={[styles.aumBadge, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                    AUM Rp {(selectedFund.aum / 1000).toFixed(1)}T
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💼 Top Equity Holdings</Text>
              <View style={[styles.tableContainer, { borderColor: colors.border }]}>
                <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, width: 80 }]}>Ticker</Text>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, flex: 1 }]}>Nama Saham</Text>
                  <Text style={[styles.colHeader, { color: colors.textPrimary, width: 100, textAlign: 'right' }]}>Bobot (%)</Text>
                </View>

                {selectedFund.holdings.map((h: any) => (
                  <Pressable
                    key={h.ticker}
                    style={[styles.tableRow, { borderBottomColor: colors.border }]}
                    onPress={() => setScreen('STOCK_DETAIL', { ticker: h.ticker })}
                  >
                    <Text style={[styles.tickerText, { color: colors.primary, width: 80 }]}>{h.ticker}</Text>
                    <Text style={[styles.stockNameText, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
                      {h.stockName}
                    </Text>
                    <Text style={[styles.pctText, { color: colors.textPrimary, width: 100, textAlign: 'right' }]}>
                      {h.pct.toFixed(1)}%
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.disclaimerBox, { borderColor: colors.border }]}>
                <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
                  💡 **Analisis Aliran Reksa Dana**: Perubahan persentase holding reksa dana dapat menunjukkan arah dana institusi (*smart money*). Ketika manajer investasi besar mulai memindahkan porsi kas ke saham tertentu, hal itu sering memicu penguatan harga saham (akumulasi).
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyDetail, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textMuted }}>Pilih salah satu reksa dana untuk melihat rincian top holdings.</Text>
            </View>
          )}
        </View>
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
  gridLarge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gridMobile: {
    flexDirection: 'column',
  },
  column: {
    marginBottom: 20,
  },
  columnTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
  },
  fundCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  fundName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  fundManager: {
    fontSize: 11,
    marginTop: 2,
  },
  fundMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    borderTopColor: '#cccccc33',
  },
  fundAum: {
    fontSize: 11,
  },
  holdingsCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc22',
    paddingBottom: 14,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailManager: {
    fontSize: 12,
    marginTop: 4,
  },
  aumBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tickerText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  stockNameText: {
    fontSize: 12,
  },
  pctText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  disclaimerBox: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
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
