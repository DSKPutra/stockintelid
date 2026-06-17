import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { getThemeColors, useAppStore } from '../store';

export const StyleGuideScreen: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const colors = getThemeColors(theme);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🎨 StockIntelID Style Guide</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Dokumentasi design token warna baru, tombol, kontras, dan komponen visual UI.
        </Text>
      </View>

      {/* Kontrol Tema */}
      <Pressable
        style={[styles.themeToggle, { backgroundColor: colors.primary }]}
        onPress={toggleTheme}
      >
        <Text style={styles.themeToggleText}>
          Tukar ke Mode {theme === 'dark' ? 'Terang ☀️' : 'Gelap 🌙'}
        </Text>
      </Pressable>

      {/* Bagian Warna */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. Palet Warna (Design Tokens)</Text>
        <View style={styles.colorGrid}>
          {[
            { name: 'Background', color: colors.background, text: colors.textPrimary },
            { name: 'Card Surface', color: colors.card, text: colors.textPrimary },
            { name: 'Card Light', color: colors.cardLight, text: colors.textSecondary },
            { name: 'Border Line', color: colors.border, text: colors.textMuted },
            { name: 'Primary (Violet)', color: colors.primary, text: '#ffffff' },
            { name: 'Secondary (Teal)', color: colors.secondary, text: '#ffffff' },
            { name: 'Naik (Emerald)', color: colors.success, text: '#ffffff' },
            { name: 'Turun (Ruby)', color: colors.danger, text: '#ffffff' },
            { name: 'Highlight (Amber)', color: colors.warning, text: '#ffffff' },
          ].map((c, idx) => (
            <View key={idx} style={[styles.colorCard, { backgroundColor: c.color, borderColor: colors.border }]}>
              <View style={[styles.colorBadge, { backgroundColor: c.color }]} />
              <Text style={[styles.colorName, { color: c.text }]}>{c.name}</Text>
              <Text style={[styles.colorHex, { color: colors.textMuted }]}>{c.color}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bagian Tombol */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. Komponen Tombol (Buttons)</Text>
        <View style={styles.buttonRow}>
          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnText}>Primary Button</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: colors.secondary }]}>
            <Text style={styles.btnText}>Secondary Button</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 }]}>
            <Text style={[styles.btnText, { color: colors.primary }]}>Outline Button</Text>
          </Pressable>
        </View>
      </View>

      {/* Bagian Aksesibilitas Kontras */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3. Kepatuhan Kontras Aksesibilitas (WCAG AA)</Text>
        <View style={[styles.alertCard, { backgroundColor: 'rgba(33, 212, 196, 0.1)', borderColor: colors.secondary }]}>
          <Text style={[styles.alertTitle, { color: colors.secondary }]}>✓ Aksesibilitas Kontras Tinggi</Text>
          <Text style={[styles.alertText, { color: colors.textSecondary }]}>
            Teks sekunder di atas warna latar belakang gelap didesain agar nyaman dibaca dan lolos kualifikasi WCAG AA kontras rasio (min 4.5:1).
          </Text>
        </View>

        <View style={[styles.alertCard, { backgroundColor: 'rgba(255, 176, 32, 0.1)', borderColor: colors.warning }]}>
          <Text style={[styles.alertTitle, { color: colors.warning }]}>⚠️ Disclaimer Kepemilikan Periodik</Text>
          <Text style={[styles.alertText, { color: colors.textSecondary }]}>
            Data kepemilikan merupakan data periodik (KSEI/laporan bulanan), bukan data real-time. Performa harga dan volume bersifat real-time.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  themeToggle: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  themeToggleText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCard: {
    width: '30%',
    minWidth: 100,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  colorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  colorName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colorHex: {
    fontSize: 9,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  btnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
