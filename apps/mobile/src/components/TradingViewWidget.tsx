import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getThemeColors, useAppStore } from '../store';

declare const document: any;

interface TVWidgetProps {
  symbol: string;
  height?: number;
}

export const TVChart: React.FC<TVWidgetProps> = ({ symbol, height = 380 }) => {
  const { theme } = useAppStore();
  const colors = getThemeColors(theme);
  const containerRef = useRef<any>(null);

  // LEGAL: Atribusi TradingView Widget wajib dicantumkan sesuai Terms of Service.
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Bersihkan kontainer jika ada sisa widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (typeof TradingView !== 'undefined') {
        // @ts-ignore
        new TradingView.widget({
          width: '100%',
          height: height,
          symbol: `IDX:${symbol.toUpperCase()}`,
          interval: 'D',
          timezone: 'Asia/Jakarta',
          theme: theme,
          style: '1',
          locale: 'id',
          toolbar_bg: colors.card,
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: `tv-chart-${symbol}`,
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Bersihkan script jika unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, theme]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.mobileFallback, { height, backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.fallbackTitle, { color: colors.primary }]}>📊 Grafik TradingView Live (Web-Only)</Text>
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Widget grafik interaktif TradingView aktif saat Anda membukanya di browser web. Di mobile, Anda dapat melihat visualisasi SVG lokal kami di tab samping.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.webContainer, { height }]}>
      <div id={`tv-chart-${symbol}`} style={{ width: '100%', height: '100%' }} />
    </View>
  );
};

export const TVHeatmap: React.FC<{ height?: number }> = ({ height = 450 }) => {
  const { theme } = useAppStore();
  const colors = getThemeColors(theme);
  const containerRef = useRef<any>(null);

  // LEGAL: Atribusi widget heatmap pasar TradingView sesuai Terms of Use.
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      relation: 'symbol',
      groups: [
        {
          name: 'Indonesia Stocks',
          symbols: [
            { name: 'IDX:BBCA' },
            { name: 'IDX:BBRI' },
            { name: 'IDX:BMRI' },
            { name: 'IDX:BBNI' },
            { name: 'IDX:TLKM' },
            { name: 'IDX:ASII' },
            { name: 'IDX:ADRO' },
            { name: 'IDX:BREN' },
            { name: 'IDX:TPIA' },
            { name: 'IDX:GOTO' },
          ],
        },
      ],
      locale: 'id',
      gridColor: 'rgba(240, 243, 250, 0.06)',
      scaleCurve: 'rgba(0, 0, 0, 1)',
      theme: theme,
      width: '100%',
      height: height,
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, [theme]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.mobileFallback, { height, backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.fallbackTitle, { color: colors.primary }]}>🔥 Heatmap Pasar TradingView (Web-Only)</Text>
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Tampilan heatmap pasar interaktif TradingView aktif saat Anda membuka di web.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.webContainer, { height }]} ref={containerRef} />
  );
};

const styles = StyleSheet.create({
  webContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  mobileFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
