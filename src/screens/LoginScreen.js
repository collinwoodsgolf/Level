/**
 * LEVEL GOLF — Login / Sign Up
 * Apple-clean auth: Sign In, dedicated Sign Up, Forgot Password, Apple Sign In.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import Logo from '../components/Logo';

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore(s => s.setUser);

  const isLogin = mode === 'login';

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Information', 'Please enter your email and password.');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name.');
      return;
    }
    setLoading(true);
    // TODO: Replace with real Firebase/Supabase auth
    setTimeout(() => {
      setUser({
        id: 'user_' + Date.now(),
        email: email.trim().toLowerCase(),
        name: isLogin ? email.split('@')[0] : name.trim(),
        memberSince: new Date().toISOString(),
      });
      setLoading(false);
    }, 900);
  };

  return (
    <View style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={s.logoWrap}>
            <Logo size={84} wordmark tagline />
          </View>

          {/* Segmented control — Sign In / Sign Up */}
          <View style={s.segment}>
            {['login', 'signup'].map(m => (
              <TouchableOpacity
                key={m}
                style={[s.segmentBtn, mode === m && s.segmentBtnActive]}
                onPress={() => setMode(m)}
                activeOpacity={0.8}
              >
                <Text style={[s.segmentText, mode === m && s.segmentTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View style={s.form}>
            {!isLogin && (
              <TextInput
                style={s.input}
                placeholder="Full Name"
                placeholderTextColor={COLORS.gray500}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
                returnKeyType="next"
              />
            )}
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={COLORS.gray500}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={COLORS.gray500}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType={isLogin ? 'password' : 'newPassword'}
              returnKeyType="go"
              onSubmitEditing={handleAuth}
            />

            {/* Forgot password — login only */}
            {isLogin && (
              <TouchableOpacity
                style={s.forgotWrap}
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryBtnText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Social sign-in placeholders (production: expo-auth-session / Firebase Auth) */}
            <TouchableOpacity
              style={s.appleBtn}
              onPress={() => Alert.alert('Coming Soon', 'Apple Sign In will be available in the App Store release.')}
              activeOpacity={0.85}
            >
              <Text style={s.appleBtnText}> Continue with Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.googleBtn}
              onPress={() => Alert.alert('Coming Soon', 'Google Sign-In will be available in the App Store release.')}
              activeOpacity={0.85}
            >
              <Text style={s.googleG}>G</Text>
              <Text style={s.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Explicit toggle button */}
            <TouchableOpacity
              style={s.toggleWrap}
              onPress={() => setMode(m => (m === 'login' ? 'signup' : 'login'))}
            >
              <Text style={s.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={s.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>
            GPS-attested rounds · Live dynamic ratings{'\n'}Handicaps that reflect how the course actually played
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  inner: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xxl },
  logoWrap: { alignItems: 'center', marginBottom: 36 },

  segment: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md, padding: 3, marginBottom: 18,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.green700 },
  segmentText: { ...FONTS.semibold, fontSize: 14, color: COLORS.gray400 },
  segmentTextActive: { color: COLORS.white },

  form: { gap: 12 },
  input: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md,
    padding: 16, fontSize: 16, color: COLORS.ink,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    ...FONTS.regular,
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -2 },
  forgotText: { ...FONTS.semibold, fontSize: 13, color: COLORS.green500 },

  primaryBtn: {
    backgroundColor: COLORS.green700, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center', marginTop: 6,
  },
  primaryBtnText: { ...FONTS.bold, fontSize: 16, color: COLORS.white },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLORS.surfaceBorder },
  dividerText: { ...FONTS.regular, fontSize: 12, color: COLORS.gray600, marginHorizontal: 12 },

  appleBtn: {
    backgroundColor: COLORS.black, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center',
  },
  appleBtnText: { ...FONTS.bold, fontSize: 16, color: COLORS.white },

  googleBtn: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.surfaceBorder, gap: 8,
  },
  googleG: { ...FONTS.black, fontSize: 16, color: '#4285F4' },
  googleBtnText: { ...FONTS.bold, fontSize: 16, color: COLORS.ink },

  toggleWrap: { alignItems: 'center', marginTop: 14 },
  toggleText: { ...FONTS.regular, fontSize: 14, color: COLORS.gray400 },
  toggleLink: { ...FONTS.semibold, color: COLORS.green500 },

  footer: {
    ...FONTS.regular, fontSize: 12, color: COLORS.gray600,
    textAlign: 'center', marginTop: 40, lineHeight: 18,
  },
});
