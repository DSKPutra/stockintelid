import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, useWindowDimensions, Pressable } from 'react-native';
import Svg, { Rect, Line, Polyline } from 'react-native-svg';
import { OHLCV } from '@idx/shared';
import { getThemeColors, useAppStore } from '../store';

interface ChartProps {
  data: OHLCV[];
  height?: number;
}

export const Chart: React.FC<ChartProps> = ({ data, height = 280 }) => {
  const { theme } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  
  // Hitung lebar responsif (jika di web/layar lebar, gunakan lebar kontainer, di mobile kurangi margin)
  const isLargeScreen = windowWidth >= 768;
  const chartWidth = isLargeScreen ? windowWidth - 360 : windowWidth - 32;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.center, { height, backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.textSecondary }}>Tidak ada data chart</Text>
      </View>
    );
  }

  // Cari min/max harga untuk penskalaan sumbu Y
  const prices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...prices) * 0.99; // Beri sedikit padding bawah
  const maxPrice = Math.max(...prices) * 1.01; // Beri sedikit padding atas
  const priceRange = maxPrice - minPrice;

  // Cari max volume untuk penskalaan
  const maxVolume = Math.max(...data.map((d) => d.volume));

  // Hitung koordinat lilin
  const paddingRight = 40;
  const paddingBottom = 40;
  const plotWidth = chartWidth - paddingRight;
  const plotHeight = height - paddingBottom;

  const candleWidth = Math.max(3, Math.floor(plotWidth / data.length) - 2);

  // Fungsi untuk konversi harga ke Y-coordinate
  const getX = (index: number) => (index / (data.length - 1)) * (plotWidth - candleWidth) + candleWidth / 2;
  const getY = (price: number) => plotHeight - ((price - minPrice) / priceRange) * plotHeight;
  
  // Hitung Moving Average (MA) 5 Periode
  const ma5Points: string[] = [];
  data.forEach((d, idx) => {
    if (idx >= 4) {
      let sum = 0;
      for (let j = 0; j < 5; j++) {
        sum += data[idx - j]!.close;
      }
      const maValue = sum / 5;
      ma5Points.push(`${getX(idx)},${getY(maValue)}`);
    }
  });

  const ma5Path = ma5Points.join(' ');

  // Ambil data candle yang di-hover atau candle terakhir untuk info bar
  const activeIndex = hoveredIndex !== null ? hoveredIndex : data.length - 1;
  const activeCandle = data[activeIndex]!;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Detail Informasi Candle Terpilih */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>O: </Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Rp {activeCandle.open}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>H: </Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Rp {activeCandle.high}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>L: </Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Rp {activeCandle.low}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>C: </Text>
          <Text style={[styles.infoValue, { color: activeCandle.close >= activeCandle.open ? colors.success : colors.danger }]}>
            Rp {activeCandle.close}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Vol: </Text>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
            {(activeCandle.volume / 1e6).toFixed(1)}M
          </Text>
        </View>
      </View>

      {/* SVG Canvas */}
      <Svg width={chartWidth} height={height}>
        {/* Draw Candlesticks & Volume */}
        {data.map((d, index) => {
          const isGreen = d.close >= d.open;
          const color = isGreen ? colors.success : colors.danger;
          const x = getX(index);
          const yOpen = getY(d.open);
          const yClose = getY(d.close);
          const yHigh = getY(d.high);
          const yLow = getY(d.low);

          const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
          const bodyY = Math.min(yOpen, yClose);

          // Penskalaan Volume (30% dari tinggi chart di bagian bawah)
          const volHeight = (d.volume / maxVolume) * (plotHeight * 0.25);
          const volY = plotHeight - volHeight;

          return (
            <React.Fragment key={index}>
              {/* Wick */}
              <Line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth={1.5} />
              
              {/* Body */}
              <Rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                rx={1}
              />

              {/* Volume Bar */}
              <Rect
                x={x - candleWidth / 2}
                y={volY}
                width={candleWidth}
                height={volHeight}
                fill={color}
                opacity={0.3}
              />

              {/* Garis Bantu Transparan Hover */}
              <Rect
                x={x - candleWidth / 2 - 2}
                y={0}
                width={candleWidth + 4}
                height={plotHeight}
                fill="transparent"
                onPressIn={() => setHoveredIndex(index)}
                // @ts-ignore Web-only mouse enter
                onMouseEnter={() => setHoveredIndex(index)}
              />
            </React.Fragment>
          );
        })}

        {/* Draw MA5 Line */}
        {ma5Path ? (
          <Polyline
            points={ma5Path}
            fill="none"
            stroke={colors.warning}
            strokeWidth={1.5}
            opacity={0.8}
          />
        ) : null}

        {/* Grid Sumbu Y (Harga) */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const price = minPrice + ratio * priceRange;
          const y = getY(price);
          return (
            <React.Fragment key={ratio}>
              <Line
                x1={0}
                y1={y}
                x2={plotWidth}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Label Sumbu X & Y */}
      <View style={[styles.axisRow, { width: plotWidth }]}>
        <Text style={[styles.axisText, { color: colors.textMuted }]}>
          {new Date(data[0]!.ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </Text>
        <Text style={[styles.axisText, { color: colors.textMuted }]}>
          {new Date(data[Math.floor(data.length / 2)]!.ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </Text>
        <Text style={[styles.axisText, { color: colors.textMuted }]}>
          {new Date(data[data.length - 1]!.ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  infoItem: {
    flexDirection: 'row',
    marginRight: 12,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  axisText: {
    fontSize: 10,
  },
});
