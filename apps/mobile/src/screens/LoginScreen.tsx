import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getThemeColors, useAppStore } from '../store';
import { authApi } from '../api';

export const LoginScreen: React.FC = () => {
  const alert = (msg: string) => Alert.alert('Info', msg);
  const { theme, login, setScreen } = useAppStore();
  const colors = getThemeColors(theme);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@')) {
      alert('Silakan masukkan email yang valid');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOTP(email);
      if (res.success) {
        setMessage(res.message);
        setStep('OTP');
      }
    } catch (e: any) {
      alert(`Gagal mengirim OTP: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (code.length !== 6) {
      alert('Masukkan 6 digit kode OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOTP(email, code);
      login(res.token, res.profile);
      alert('Login berhasil! Selamat datang di IDX Stock Analyzer Premium.');
    } catch (e: any) {
      alert(`Verifikasi gagal: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.logoText, { color: colors.primary }]}>⚡ IDX ANALYZER</Text>
        <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
          Akses data fundamental, ownership, sektoral, dan asisten AI premium.
        </Text>

        {step === 'EMAIL' ? (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Alamat Email</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="nama@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Kirim Kode OTP</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.noticeText, { color: colors.warning }]}>{message}</Text>
            
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Kode Verifikasi OTP</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verifikasi & Masuk</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.backButton}
              onPress={() => setStep('EMAIL')}
            >
              <Text style={[styles.backText, { color: colors.textSecondary }]}>Kembali</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={{ marginTop: 24, alignSelf: 'center' }}
          onPress={() => setScreen('DASHBOARD')}
        >
          <Text style={{ color: colors.textMuted, fontSize: 11, textDecorationLine: 'underline' }}>
            Masuk sebagai Tamu (Guest Mode)
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  noticeText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  backButton: {
    marginTop: 12,
    alignSelf: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
