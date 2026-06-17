import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { getThemeColors, useAppStore } from '../store';
import { stockApi } from '../api';
import { formatPercent } from '@idx/shared';

interface Tile {
  ticker: string;
  name: string;
  marketCap: number;
  changePercent: number;
}
interface SectorBlock {
  code: string;
  nameId: string;
  tiles: Tile[];
}

interface Props {
  height?: number;
  onSelectTicker?: (ticker: string) => void;
}

// Heatmap kustom: ukuran tile ∝ kapitalisasi pasar (luas ∝ market cap),
// warna ∝ performa (token naik/turun), dikelompokkan per sektor.
// Harga = REALTIME; berbeda dari data kepemilikan yang periodik.
export const MarketHeatmap: React.FC<Props> = ({ height = 360, onSelectTicker }) => {
  const { theme } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const width = isLargeScreen ? Math.min(windowWidth - 320, 900) : windowWidth - 32;

  const [data, setData] = useState<SectorBlock[]>([]);
  const [asOf, setAsOf] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    stockApi
      .getHeatmap()
      .then((res) => {
        if (!alive) return;
        setData(res.sectors || []);
        setAsOf(res.asOf || '');
      })
      .catch((e) => console.error('Heatmap fetch error:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Warna dari performa (-4%..+4% → intensitas).
  const tileColor = (perf: number) => {
    const base = perf >= 0 ? colors.success : colors.danger;
    const intensity = Math.min(1, Math.abs(perf) / 4);
    const r = parseInt(base.slice(1, 3), 16);
    const g = parseInt(base.slice(3, 5), 16);
    const b = parseInt(base.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${(0.25 + intensity * 0.7).toFixed(2)})`;
  };

  // Layout strip-treemap: tinggi band ∝ total cap sektor, lebar tile ∝ cap tile.
  const layout = useMemo(() => {
    const grandTotal = data.reduce(
      (s, sec) => s + sec.tiles.reduce((a, t) => a + t.marketCap, 0),
      0,
    );
    if (grandTotal === 0) return [];
    const rects: {
      x: number;
      y: number;
      w: number;
      h: number;
      tile: Tile;
      sector: string;
    }[] = [];
    let y = 0;
    for (const sec of data) {
      const secTotal = sec.tiles.reduce((a, t) => a + t.marketCap, 0);
      const bandH = (secTotal / grandTotal) * height;
      let x = 0;
      for (const tile of sec.tiles) {
        const w = (tile.marketCap / secTotal) * width;
        rects.push({ x, y, w, h: bandH, tile, sector: sec.nameId });
        x += w;
      }
      y += bandH;
    }
    return rects;
  }, [data, width, height]);

  if (loading) {
    return (
      <View style={[styles.center, { height, backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>Memuat heatmap pasar...</Text>
      </View>
    );
  }

  if (layout.length === 0) {
    return (
      <View style={[styles.center, { height, backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Data heatmap tidak tersedia.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Svg width={width} height={height}>
        {layout.map((r) => {
          const showLabel = r.w > 38 && r.h > 22;
          return (
            <G key={r.tile.ticker} onPress={() => onSelectTicker?.(r.tile.ticker)}>
              <Rect
                x={r.x}
                y={r.y}
                width={Math.max(1, r.w - 2)}
                height={Math.max(1, r.h - 2)}
                fill={tileColor(r.tile.changePercent)}
                stroke={colors.background}
                strokeWidth={1}
                rx={3}
              />
              {showLabel && (
                <>
                  <SvgText x={r.x + 6} y={r.y + 16} fill="#ffffff" fontSize={11} fontWeight="bold">
                    {r.tile.ticker}
                  </SvgText>
                  {r.h > 36 && (
                    <SvgText x={r.x + 6} y={r.y + 30} fill="#ffffff" fontSize={9}>
                      {formatPercent(r.tile.changePercent)}
                    </SvgText>
                  )}
                </>
              )}
            </G>
          );
        })}
      </Svg>
      <Text style={[styles.caption, { color: colors.textMuted }]}>
        Ukuran kotak ∝ kapitalisasi pasar · warna ∝ performa harga · harga realtime
        {asOf ? ` · per ${new Date(asOf).toLocaleTimeString('id-ID')}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 8, marginBottom: 16, overflow: 'hidden' },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  caption: { fontSize: 9, marginTop: 6, textAlign: 'center' },
});
