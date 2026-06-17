import { useAppStore } from './store';

declare const process: any;

// Ambil base URL dari env Expo, fallback ke localhost:4000
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL 
  ? `${process.env.EXPO_PUBLIC_API_BASE_URL}/api`
  : 'http://localhost:4000/api';

console.log(`[API CLIENT] Menghubungkan ke API di: ${API_BASE_URL}`);

async function apiRequest<T>(path: string, options: any = {}): Promise<T> {
  const token = useAppStore.getState().userToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const stockApi = {
  getStocks: () => apiRequest<any[]>('/stocks'),
  searchStocks: (q: string) => apiRequest<any[]>(`/stocks/search?q=${encodeURIComponent(q)}`),
  getStock: (ticker: string) => apiRequest<any>(`/stocks/${ticker}`),
  getQuote: (ticker: string) => apiRequest<any>(`/stocks/${ticker}/quote`),
  getOHLCV: (ticker: string, range = '30d') => apiRequest<any[]>(`/stocks/${ticker}/ohlcv?range=${range}`),
  getFundamentals: (ticker: string) => apiRequest<any>(`/stocks/${ticker}/fundamentals`),
  getFinancials: (ticker: string) => apiRequest<any>(`/stocks/${ticker}/financials`),
  getShareholders: (ticker: string) => apiRequest<any[]>(`/stocks/${ticker}/shareholders`),
  getCorporateActions: (ticker: string) => apiRequest<any[]>(`/stocks/${ticker}/corporate-actions`),
  getDisclosures: (ticker: string) => apiRequest<any[]>(`/stocks/${ticker}/disclosures`),
  getSectors: () => apiRequest<any[]>('/stocks/sectors'),
  getGroups: () => apiRequest<any[]>('/stocks/groups'),
  getGroup: (id: string) => apiRequest<any>(`/stocks/groups/${id}`),
  
  // Watchlist
  getWatchlist: () => apiRequest<string[]>('/stocks/watchlist/list'),
  toggleWatchlist: (ticker: string) => apiRequest<string[]>('/stocks/watchlist/toggle', {
    method: 'POST',
    body: JSON.stringify({ ticker }),
  }),
};

export const authApi = {
  sendOTP: (email: string) => apiRequest<{ success: boolean; message: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyOTP: (email: string, code: string) => apiRequest<{ token: string; profile: any }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }),
  getProfile: () => apiRequest<any>('/auth/profile'),
};

export const chatApi = {
  sendMessage: (message: string, history: any[] = []) => apiRequest<{ reply: string; chartData?: any }>('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  }),
};
