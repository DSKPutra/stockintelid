import { create } from 'zustand';
import { UserProfile } from '@idx/shared';
export { getThemeColors } from './theme';

export type ScreenType =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'STOCK_DETAIL'
  | 'SCREENER'
  | 'SECTORS'
  | 'OWNERSHIP'
  | 'CHATBOT';

interface AppState {
  theme: 'dark' | 'light';
  currentScreen: ScreenType;
  selectedTicker: string;
  selectedGroupId: string;
  userToken: string | null;
  userProfile: UserProfile | null;
  watchlist: string[];
  
  // Actions
  toggleTheme: () => void;
  setScreen: (screen: ScreenType, payload?: { ticker?: string; groupId?: string }) => void;
  login: (token: string, profile: UserProfile) => void;
  logout: () => void;
  setWatchlist: (watchlist: string[]) => void;
  toggleWatchlistLocal: (ticker: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  currentScreen: 'DASHBOARD',
  selectedTicker: 'BBCA',
  selectedGroupId: 'barito',
  userToken: null,
  userProfile: null,
  watchlist: ['BBCA', 'BBRI', 'BREN'],

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  
  setScreen: (screen, payload) => set((state) => ({
    currentScreen: screen,
    selectedTicker: payload?.ticker || state.selectedTicker,
    selectedGroupId: payload?.groupId || state.selectedGroupId,
  })),

  login: (token, profile) => set({
    userToken: token,
    userProfile: profile,
    currentScreen: 'DASHBOARD',
  }),

  logout: () => set({
    userToken: null,
    userProfile: null,
    currentScreen: 'DASHBOARD',
    watchlist: ['BBCA', 'BBRI', 'BREN'],
  }),

  setWatchlist: (watchlist) => set({ watchlist }),

  toggleWatchlistLocal: (ticker) => set((state) => {
    const t = ticker.toUpperCase();
    const isExist = state.watchlist.includes(t);
    const updated = isExist
      ? state.watchlist.filter((x) => x !== t)
      : [...state.watchlist, t];
    return { watchlist: updated };
  }),
}));
