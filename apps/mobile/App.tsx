import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getThemeColors, useAppStore, ScreenType } from './src/store';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { StockDetailScreen } from './src/screens/StockDetailScreen';
import { ScreenerScreen } from './src/screens/ScreenerScreen';
import { SectorsScreen } from './src/screens/SectorsScreen';
import { OwnershipScreen } from './src/screens/OwnershipScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ChatbotPanel } from './src/components/ChatbotPanel';
import { APP_DISCLAIMER } from '@idx/shared';

const queryClient = new QueryClient();

export default function App() {
  const { theme, currentScreen, setScreen, userProfile, logout, toggleTheme } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();

  // Pendeteksian responsif layar besar (Web/Tablet vs Mobile)
  const isLargeScreen = windowWidth >= 768;

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'DASHBOARD':
        return <DashboardScreen />;
      case 'STOCK_DETAIL':
        return <StockDetailScreen />;
      case 'SCREENER':
        return <ScreenerScreen />;
      case 'SECTORS':
        return <SectorsScreen />;
      case 'OWNERSHIP':
        return <OwnershipScreen />;
      case 'LOGIN':
        return <LoginScreen />;
      case 'CHATBOT':
        return <ChatbotPanel />;
      default:
        return <DashboardScreen />;
    }
  };

  const navItems: { screen: ScreenType; label: string; icon: string }[] = [
    { screen: 'DASHBOARD', label: 'Dashboard', icon: '🏠' },
    { screen: 'SECTORS', label: 'Sektoral', icon: '📊' },
    { screen: 'OWNERSHIP', label: 'Kepemilikan', icon: '🏢' },
    { screen: 'SCREENER', label: 'Screener', icon: '🔍' },
    { screen: 'CHATBOT', label: 'Asisten AI', icon: '💬' },
  ];

  // ---- RENDER LAYOUT SIDEBAR (WEB / TABLET) ----
  const renderWebLayout = () => {
    return (
      <View style={[styles.webContainer, { backgroundColor: colors.background }]}>
        {/* Sidebar */}
        <View style={[styles.sidebar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.logoText, { color: colors.primary }]}>⚡ IDX ANALYZER</Text>
            <Text style={[styles.logoSub, { color: colors.textMuted }]}>Educational Platform</Text>
            
            <View style={styles.menuList}>
              {navItems.map((item) => {
                const isActive = currentScreen === item.screen;
                return (
                  <Pressable
                    key={item.screen}
                    style={[
                      styles.menuItem,
                      isActive && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setScreen(item.screen)}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.menuLabel,
                        { color: isActive ? '#ffffff' : colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Bagian Bawah Sidebar (User & Theme) */}
          <View>
            {userProfile ? (
              <View style={[styles.profileBox, { borderColor: colors.border }]}>
                <Text style={[styles.profileEmail, { color: colors.textPrimary }]} numberOfLines={1}>
                  👤 {userProfile.email}
                </Text>
                <Text style={[styles.profileRole, { color: colors.warning }]}>
                  PRO MEMBER
                </Text>
                <Pressable style={styles.logoutBtn} onPress={logout}>
                  <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                onPress={() => setScreen('LOGIN')}
              >
                <Text style={styles.loginBtnText}>Masuk Premium</Text>
              </Pressable>
            )}

            {/* Toggle Tema */}
            <Pressable style={[styles.themeBtn, { borderColor: colors.border }]} onPress={toggleTheme}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap'}
              </Text>
            </Pressable>

            {/* Disclaimer Hukum */}
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              {APP_DISCLAIMER}
            </Text>
          </View>
        </View>

        {/* Area Utama Konten */}
        <View style={styles.mainContentWeb}>{renderActiveScreen()}</View>
      </View>
    );
  };

  // ---- RENDER LAYOUT BOTTOM TAB (MOBILE) ----
  const renderMobileLayout = () => {
    return (
      <SafeAreaView style={[styles.mobileContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        {/* Header Mobile */}
        <View style={[styles.mobileHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.logoMobileText, { color: colors.primary }]} onPress={() => setScreen('DASHBOARD')}>
            ⚡ IDX ANALYZER
          </Text>
          <View style={styles.headerActions}>
            <Pressable onPress={toggleTheme} style={styles.headerIconBtn}>
              <Text style={{ fontSize: 16 }}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
            </Pressable>
            {userProfile ? (
              <Pressable onPress={logout} style={styles.headerIconBtn}>
                <Text style={{ fontSize: 16 }}>🚪</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setScreen('LOGIN')} style={[styles.mobileLoginBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.mobileLoginBtnText}>Masuk</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Area Utama Konten */}
        <View style={styles.mainContentMobile}>{renderActiveScreen()}</View>

        {/* Disclaimer Hukum Mini di Mobile */}
        {currentScreen === 'DASHBOARD' && (
          <View style={[styles.mobileDisclaimer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.disclaimerMobileText, { color: colors.textMuted }]}>
              ⚠️ Disclaimer: {APP_DISCLAIMER}
            </Text>
          </View>
        )}

        {/* Bottom Tab Bar */}
        <View style={[styles.bottomTabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {navItems.map((item) => {
            const isActive = currentScreen === item.screen;
            return (
              <Pressable
                key={item.screen}
                style={styles.tabItem}
                onPress={() => setScreen(item.screen)}
              >
                <Text style={[styles.tabIcon, isActive && { opacity: 1 }]}>{item.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      {isLargeScreen ? renderWebLayout() : renderMobileLayout()}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  // Web Layout Styles
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%' as any,
    overflow: 'hidden',
  },
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    padding: 20,
    justifyContent: 'space-between',
    height: '100%',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  menuList: {
    marginTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  mainContentWeb: {
    flex: 1,
    height: '100%',
    overflow: 'auto' as any,
  },
  themeBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  profileBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileRole: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 8,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  loginBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Mobile Layout Styles
  mobileContainer: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
  },
  logoMobileText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
    marginLeft: 8,
  },
  mobileLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mobileLoginBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mainContentMobile: {
    flex: 1,
  },
  mobileDisclaimer: {
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  disclaimerMobileText: {
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 11,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    padding: 4,
  },
  tabIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
});
