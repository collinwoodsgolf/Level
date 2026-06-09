/**
 * LEVEL GOLF — Forgot Password
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import Logo from '../components/Logo';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    // TODO: real password-reset API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  };

  return (
    <View style={s.container}>
      {/* Back */}
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={s.backText}>‹ Back</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.logoWrap}>
          <Logo size={64} />
        </View>

        {!sent ? (
          <>
            <Text style={s.title}>Reset Password</Text>
            <Text style={s.desc}>
              Enter the email tied to your account and we'll send you a link to reset your password.
            </Text>
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={COLORS.gray500}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={handleReset}
            />
            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.sentIcon}>✉️</Text>
            <Text style={s.title}>Check Your Email</Text>
            <Text style={s.desc}>
              If an account exists for{' '}
              <Text style={{ color: COLORS.ink }}>{email.trim()}</Text>, a reset link is on its way.
            </Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.resendWrap} onPress={() => setSent(false)}>
              <Text style={s.resendText}>Didn't get it? <Text style={{ color: COLORS.green500 }}>Try again</Text></Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  backBtn: { position: 'absolute', top: 62, left: SPACING.xl, zIndex: 10 },
  backText: { ...FONTS.semibold, fontSize: 17, color: COLORS.green500 },
  inner: { flex: 1, justifyContent: 'center', padding: SPACING.xxl },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  sentIcon: { fontSize: 44, textAlign: 'center', marginBottom: 12 },
  title: { ...FONTS.bold, fontSize: 26, color: COLORS.ink, textAlign: 'center' },
  desc: {
    ...FONTS.regular, fontSize: 15, color: COLORS.gray400,
    textAlign: 'center', marginTop: 10, marginBottom: 26, lineHeight: 22,
  },
  input: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md,
    padding: 16, fontSize: 16, color: COLORS.ink,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    ...FONTS.regular, marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: COLORS.green700, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center',
  },
  primaryBtnText: { ...FONTS.bold, fontSize: 16, color: COLORS.white },
  resendWrap: { alignItems: 'center', marginTop: 18 },
  resendText: { ...FONTS.regular, fontSize: 14, color: COLORS.gray400 },
});
