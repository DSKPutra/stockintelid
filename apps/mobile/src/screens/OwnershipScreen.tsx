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
import Svg, { Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
import { getThemeColors, useAppStore } from '../store';
import { stockApi } from '../api';

interface GraphNode {
  id: string;
  label: string;
  type: 'ubo' | 'group' | 'ticker';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
}

export const OwnershipScreen: React.FC = () => {
  const { theme, selectedGroupId, setScreen } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  const [groups, setGroups] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Network Graph state for current Group
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const graphHeight = 260;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [groupList, sectorList] = await Promise.all([
          stockApi.getGroups(),
          stockApi.getSectors(),
        ]);
        setGroups(groupList);
        setSectors(sectorList);
      } catch (e) {
        console.error('Gagal mengambil data grup/sektor:', e);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
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

  // Run force-directed simulation for Group Network Graph when detail changes
  useEffect(() => {
    if (!selectedGroupDetail || !selectedGroupDetail.stocks) return;

    const detail = selectedGroupDetail;
    const canvasWidth = isLargeScreen ? windowWidth - 360 : windowWidth - 32;
    const centerX = canvasWidth / 2;
    const centerY = graphHeight / 2;

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. UBO Node (center)
    const uboId = `ubo_${detail.id}`;
    nodes.push({
      id: uboId,
      label: detail.ultimateOwner,
      type: 'ubo',
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      radius: 20,
      color: colors.secondary, // Teal
    });

    // 2. Group Node (offsetted)
    const groupId = `group_${detail.id}`;
    nodes.push({
      id: groupId,
      label: detail.name.split(' ')[0] || detail.name,
      type: 'group',
      x: centerX + (Math.random() - 0.5) * 40,
      y: centerY - 40,
      vx: 0,
      vy: 0,
      radius: 16,
      color: colors.primary, // Violet
    });
    links.push({ source: uboId, target: groupId });

    // 3. Ticker Nodes
    const stocksList = detail.stocks || [];
    stocksList.forEach((s: any, idx: number) => {
      const angle = (idx / stocksList.length) * Math.PI * 2;
      const radiusDist = 80 + Math.random() * 20;

      nodes.push({
        id: s.ticker,
        label: s.ticker,
        type: 'ticker',
        x: centerX + Math.cos(angle) * radiusDist,
        y: centerY + Math.sin(angle) * radiusDist,
        vx: 0,
        vy: 0,
        radius: 12,
        color: colors.warning, // Amber highlight
      });
      links.push({ source: groupId, target: s.ticker });
    });

    // Run force simulation loop (120 ticks)
    const kLink = 0.06;
    const kRepulsion = 300;
    const kGravity = 0.02;
    const targetDist = 70;

    for (let tick = 0; tick < 120; tick++) {
      // Gravitasi & Redaman
      for (const node of nodes) {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * kGravity;
        node.vy += dy * kGravity;
        node.vx *= 0.85;
        node.vy *= 0.85;
      }

      // Tolak-menolak (Repulsion)
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j]!;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 180) {
            const force = kRepulsion / distSq;
            const forceX = (dx / dist) * force;
            const forceY = (dy / dist) * force;

            n1.vx -= forceX;
            n1.vy -= forceY;
            n2.vx += forceX;
            n2.vy += forceY;
          }
        }
      }

      // Tarikan Link (Attraction)
      for (const link of links) {
        const n1 = nodes.find((n) => n.id === link.source)!;
        const n2 = nodes.find((n) => n.id === link.target)!;
        if (!n1 || !n2) continue;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = (dist - targetDist) * kLink;
        const forceX = (dx / dist) * force;
        const forceY = (dy / dist) * force;

        n1.vx += forceX;
        n1.vy += forceY;
        n2.vx -= forceX;
        n2.vy -= forceY;
      }

      // Update Posisi
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        // screen constraint
        node.x = Math.max(25, Math.min(canvasWidth - 25, node.x));
        node.y = Math.max(25, Math.min(graphHeight - 25, node.y));
      }
    }

    setGraphNodes(nodes);
    setGraphLinks(links);
  }, [selectedGroupDetail, windowWidth, isLargeScreen]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Memuat data kepemilikan konglomerasi...</Text>
      </View>
    );
  }

  // Calculate Sector Weights for Selected Group
  const getSectorWeights = () => {
    if (!selectedGroupDetail || !selectedGroupDetail.stocks) return [];
    
    const weights: Record<string, number> = {};
    let totalCap = 0;
    
    selectedGroupDetail.stocks.forEach((s: any) => {
      weights[s.sectorCode] = (weights[s.sectorCode] || 0) + s.marketCap;
      totalCap += s.marketCap;
    });

    return Object.entries(weights)
      .map(([code, cap]) => {
        const sec = sectors.find(sec => sec.code === code);
        return {
          code,
          name: sec ? sec.nameId : code,
          cap,
          pct: totalCap > 0 ? (cap / totalCap) * 100 : 0,
        };
      })
      .sort((a, b) => b.cap - a.cap);
  };

  const sectorWeights = getSectorWeights();

  // Render Diagram Treemap Using SVG
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
      <View style={styles.sectionContainer}>
        <Text style={[styles.visualTitle, { color: colors.textPrimary }]}>📊 Distribusi Kapitalisasi Pasar Emiten</Text>
        <Svg width={containerWidth} height={containerHeight} style={{ borderRadius: 8, overflow: 'hidden' }}>
          {treemapRects.map((r: any, idx: number) => {
            // Colors from theme accents
            const fills = [
              colors.primary,
              colors.secondary,
              colors.warning,
              `${colors.primary}dd`,
              `${colors.secondary}dd`,
            ];
            const fill = fills[idx % fills.length];
            const showText = r.width > 55;

            return (
              <React.Fragment key={r.ticker}>
                <Rect
                  x={r.x}
                  y={r.y}
                  width={r.width - 2}
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
                      fill="#ffffffdd"
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

  const renderNetworkGraph = () => {
    if (!selectedGroupDetail) return null;
    const canvasWidth = isLargeScreen ? windowWidth - 360 : windowWidth - 32;

    return (
      <View style={[styles.sectionContainer, styles.graphCard, { borderColor: colors.border }]}>
        <Text style={[styles.visualTitle, { color: colors.textPrimary }]}>🕸️ Peta Jaringan Pengendalian (UBO ↔ Ticker)</Text>
        <Svg width={canvasWidth} height={graphHeight}>
          {/* Draw Links */}
          {graphLinks.map((link, idx) => {
            const sNode = graphNodes.find(n => n.id === link.source);
            const tNode = graphNodes.find(n => n.id === link.target);
            if (!sNode || !tNode) return null;

            return (
              <Line
                key={idx}
                x1={sNode.x}
                y1={sNode.y}
                x2={tNode.x}
                y2={tNode.y}
                stroke={colors.border}
                strokeWidth={1.5}
                opacity={0.6}
              />
            );
          })}

          {/* Draw Nodes */}
          {graphNodes.map((node) => {
            const isClickable = node.type === 'ticker';
            return (
              <React.Fragment key={node.id}>
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={node.color}
                  stroke={colors.background}
                  strokeWidth={2}
                  onPress={isClickable ? () => setScreen('STOCK_DETAIL', { ticker: node.id }) : undefined}
                />
                <SvgText
                  x={node.x}
                  y={node.y + node.radius + 12}
                  fontSize="9"
                  fontWeight="bold"
                  fill={colors.textPrimary}
                  textAnchor="middle"
                  onPress={isClickable ? () => setScreen('STOCK_DETAIL', { ticker: node.id }) : undefined}
                >
                  {node.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Beneficial Owner (UBO)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Grup Induk</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Emiten Saham</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🏢 Peta Konglomerasi Bisnis IDX</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Kecerdasan kepemilikan pengendali (ownership intelligence) dan pengelompokan emiten bursa berdasarkan UBO konglomerat.
        </Text>
      </View>

      {/* Grid Utama Layout */}
      <View style={isLargeScreen ? styles.gridLarge : styles.gridMobile}>
        {/* Kolom Kiri: Daftar Grup */}
        <View style={[styles.column, isLargeScreen && { width: 280, marginRight: 16 }]}>
          <Text style={[styles.columnTitle, { color: colors.textMuted }]}>PILIH KONGLOMERASI</Text>
          <ScrollView style={isLargeScreen ? { maxHeight: windowWidth > 900 ? 650 : 450 } : undefined}>
            {groups.map((g) => {
              const isActive = selectedGroupId === g.id;
              return (
                <Pressable
                  key={g.id}
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: isActive ? `${colors.primary}15` : colors.card,
                      borderColor: isActive ? colors.primary : colors.border,
                      borderWidth: isActive ? 2 : 1,
                    },
                  ]}
                  onPress={() => setScreen('OWNERSHIP', { groupId: g.id })}
                >
                  <View style={styles.groupCardHeader}>
                    <Text style={[styles.groupName, { color: colors.textPrimary }]}>
                      {g.name}
                    </Text>
                    {isActive && <Text style={{ color: colors.primary, fontSize: 14 }}>⚡</Text>}
                  </View>
                  <Text style={[styles.groupOwner, { color: colors.textSecondary }]} numberOfLines={1}>
                    👤 {g.ultimateOwner}
                  </Text>
                  <View style={styles.groupMeta}>
                    <Text style={[styles.groupCap, { color: colors.textSecondary }]}>
                      Mkt Cap: <Text style={{ color: colors.primary, fontWeight: '700' }}>Rp {(g.totalMarketCap / 1e12).toFixed(1)} T</Text>
                    </Text>
                    <Text style={[styles.tickerCount, { color: colors.textSecondary }]}>
                      {g.tickers.length} Saham
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Kolom Kanan: Detail Grup */}
        <View style={[styles.column, isLargeScreen && { flex: 1 }]}>
          {loadingDetail ? (
            <View style={styles.centerDetail}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : selectedGroupDetail ? (
            <ScrollView style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{selectedGroupDetail.name}</Text>
                  <Text style={[styles.detailOwner, { color: colors.textSecondary }]}>
                    Ultimate Beneficial Owner (UBO): <Text style={{ color: colors.secondary, fontWeight: '700' }}>{selectedGroupDetail.ultimateOwner}</Text>
                  </Text>
                </View>
                <View style={[styles.marketCapBadge, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                    Rp {(selectedGroupDetail.totalMarketCap / 1e12).toFixed(1)}T Cap
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.detailDesc, { color: colors.textSecondary }]}>{selectedGroupDetail.description}</Text>

              {/* Tampilkan Peta Jaringan Pengendalian */}
              {renderNetworkGraph()}

              {/* Tampilkan Grafik Treemap */}
              {renderTreemap()}

              {/* Sebaran Sektor */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.visualTitle, { color: colors.textPrimary }]}>🗂️ Distribusi Kepemilikan Sektor</Text>
                <View style={[styles.sectorContainer, { borderColor: colors.border }]}>
                  {sectorWeights.map((s) => (
                    <View key={s.code} style={styles.sectorProgressRow}>
                      <View style={styles.sectorProgressLabelRow}>
                        <Text style={[styles.sectorText, { color: colors.textPrimary }]}>{s.name}</Text>
                        <Text style={[styles.sectorPct, { color: colors.textSecondary }]}>
                          {s.pct.toFixed(1)}% ({ (s.cap / 1e12).toFixed(1) } T)
                        </Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                        <View style={[styles.progressBarFill, { width: `${s.pct}%`, backgroundColor: colors.primary }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tampilkan Daftar Emiten Terkait */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.emitenTitle, { color: colors.textPrimary }]}>🏢 Ticker Emiten Terkendali ({selectedGroupDetail.stocks.length})</Text>
                <View style={styles.stocksGrid}>
                  {selectedGroupDetail.stocks.map((stock: any) => (
                    <Pressable
                      key={stock.ticker}
                      style={[styles.stockRow, { borderBottomColor: colors.border }]}
                      onPress={() => setScreen('STOCK_DETAIL', { ticker: stock.ticker })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tickerText, { color: colors.primary }]}>{stock.ticker}</Text>
                        <Text style={[styles.stockNameText, { color: colors.textSecondary }]} numberOfLines={1}>{stock.name}</Text>
                        <Text style={[styles.stockSectorText, { color: colors.textMuted }]}>{stock.subSector}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.marketCapText, { color: colors.textPrimary }]}>Rp {(stock.marketCap / 1e12).toFixed(1)} T</Text>
                        <Text style={[styles.viewLinkText, { color: colors.secondary }]}>Detail Analisis →</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={[styles.emptyDetail, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textMuted }}>Silakan pilih salah satu grup di sebelah kiri untuk melihat detail analisa.</Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ height: 60 }} />
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
    height: 300,
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
  groupCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  groupOwner: {
    fontSize: 11,
    marginTop: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    borderTopColor: '#cccccc33',
  },
  groupCap: {
    fontSize: 11,
  },
  tickerCount: {
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
    paddingBottom: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailOwner: {
    fontSize: 12,
    marginTop: 4,
  },
  marketCapBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  detailDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 16,
  },
  sectionContainer: {
    marginVertical: 14,
  },
  visualTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectorContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  sectorProgressRow: {
    marginBottom: 12,
  },
  sectorProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectorPct: {
    fontSize: 11,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emitenTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stocksGrid: {
    borderRadius: 10,
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
  stockNameText: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
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
    fontWeight: 'bold',
    marginTop: 4,
  },
  graphCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    marginTop: 14,
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    fontWeight: 'bold',
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
