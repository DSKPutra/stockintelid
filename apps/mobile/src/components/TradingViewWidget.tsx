import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { getThemeColors, useAppStore } from '../store';

type ThemeMode = 'dark' | 'light';

declare const document: any;

// WebView hanya ada di native; require lazy agar bundle web tidak terganggu.
let WebViewComp: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebViewComp = require('react-native-webview').WebView;
}

interface TVWidgetProps {
  symbol: string;
  height?: number;
}

// LEGAL: Widget TradingView wajib disertai atribusi sesuai Terms of Use TradingView.
// Embed di bawah memuat atribusi bawaan widget; jangan dihapus.

function chartHtml(symbol: string, theme: ThemeMode, bg: string): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"><style>html,body{margin:0;padding:0;height:100%;background:${bg}}</style></head>
<body><div class="tradingview-widget-container" style="height:100%;width:100%">
<div id="tv"></div>
<script src="https://s3.tradingview.com/tv.js"></script>
<script>new TradingView.widget({width:'100%',height:'100%',symbol:'IDX:${symbol.toUpperCase()}',interval:'D',timezone:'Asia/Jakarta',theme:'${theme}',style:'1',locale:'id',allow_symbol_change:true,hide_side_toolbar:true,container_id:'tv'});</script>
</div></body></html>`;
}

function heatmapHtml(theme: ThemeMode, bg: string): string {
  const config = {
    dataSource: 'AllIDX',
    blockSize: 'market_cap_basic',
    blockColor: 'change',
    grouping: 'sector',
    locale: 'id',
    symbolUrl: '',
    colorTheme: theme,
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    width: '100%',
    height: '100%',
  };
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>html,body{margin:0;padding:0;height:100%;background:${bg}}</style></head>
<body><div class="tradingview-widget-container" style="height:100%;width:100%">
<div class="tradingview-widget-container__widget"></div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js" async>${JSON.stringify(config)}</script>
</div></body></html>`;
}

export const TVChart: React.FC<TVWidgetProps> = ({ symbol, height = 380 }) => {
  const { theme } = useAppStore();
  const colors = getThemeColors(theme);
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (containerRef.current) containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (typeof TradingView !== 'undefined') {
        // @ts-ignore
        new TradingView.widget({
          width: '100%',
          height,
          symbol: `IDX:${symbol.toUpperCase()}`,
          interval: 'D',
          timezone: 'Asia/Jakarta',
          theme,
          style: '1',
          locale: 'id',
          toolbar_bg: colors.card,
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: `tv-chart-${symbol}`,
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [symbol, theme]);

  // Native: render via WebView.
  if (Platform.OS !== 'web' && WebViewComp) {
    return (
      <View style={[styles.webContainer, { height }]}>
        <WebViewComp
          originWhitelist={['*']}
          source={{ html: chartHtml(symbol, theme, colors.background) }}
          style={{ backgroundColor: colors.background }}
          javaScriptEnabled
          domStorageEnabled
        />
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

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (containerRef.current) containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: 'AllIDX',
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      grouping: 'sector',
      locale: 'id',
      colorTheme: theme,
      hasTopBar: false,
      isZoomEnabled: true,
      width: '100%',
      height,
    });
    if (containerRef.current) containerRef.current.appendChild(script);
  }, [theme]);

  // Native: render via WebView.
  if (Platform.OS !== 'web' && WebViewComp) {
    return (
      <View style={[styles.webContainer, { height }]}>
        <WebViewComp
          originWhitelist={['*']}
          source={{ html: heatmapHtml(theme, colors.background) }}
          style={{ backgroundColor: colors.background }}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
    );
  }

  return <View style={[styles.webContainer, { height }]} ref={containerRef} />;
};

const styles = StyleSheet.create({
  webContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
});
