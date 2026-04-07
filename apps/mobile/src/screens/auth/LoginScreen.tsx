/**
 * LoginScreen — Connexion par numéro de téléphone (OTP)
 *
 * Stack : React Native / Expo
 * Navigation : AuthStack → LoginScreen → VerifyScreen
 *
 * Dépendances :
 *   expo-status-bar, @react-navigation/native-stack
 *
 * Remplacer NativeStackScreenProps par le type de votre navigator.
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../types/navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

const PHONE_CM_REGEX = /^(6[5-9]|2[2-3])\d{7}$/
const API_BASE       = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.daada.cm'

export function LoginScreen({ navigation }: Props) {
  const [phone,   setPhone]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const digits   = phone.replace(/\D/g, '').slice(0, 9)
  const isValid  = PHONE_CM_REGEX.test(digits)

  async function handleSend() {
    if (!isValid || loading) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone: digits }),
      })
      const data = await res.json() as {
        success?: boolean; maskedPhone?: string; expiresIn?: number; error?: string
      }

      if (!res.ok) { setError(data.error ?? 'Erreur envoi SMS.'); return }

      navigation.navigate('Verify', {
        phone:      `+237${digits}`,
        maskedPhone: data.maskedPhone ?? '',
        expiresIn:  data.expiresIn ?? 300,
      })
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🔥</Text>
            <Text style={styles.logoText}>Daada</Text>
            <Text style={styles.logoSub}>Livraison rapide à Maroua</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>
              Entrez votre numéro MTN ou Orange pour recevoir un code SMS.
            </Text>

            {/* Phone input */}
            <Text style={styles.label}>Numéro de téléphone</Text>
            <View style={[styles.phoneRow, error ? styles.inputError : isValid ? styles.inputValid : styles.inputIdle]}>
              <View style={styles.prefix}>
                <Text style={styles.prefixFlag}>🇨🇲</Text>
                <Text style={styles.prefixCode}>+237</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={digits}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 9))}
                placeholder="6XXXXXXXX"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                maxLength={9}
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="done"
                onSubmitEditing={handleSend}
                accessibilityLabel="Numéro de téléphone camerounais"
              />
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.hint}>MTN (67x–69x) ou Orange (65x–66x)</Text>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
              onPress={handleSend}
              disabled={!isValid || loading}
              activeOpacity={0.8}
              accessibilityLabel="Recevoir mon code SMS"
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Recevoir mon code SMS</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Liens secondaires */}
          <View style={styles.links}>
            <TouchableOpacity onPress={() => navigation.navigate('EmailAuth')}>
              <Text style={styles.link}>Utiliser mon email</Text>
            </TouchableOpacity>
            <View style={styles.registerRow}>
              <Text style={styles.linkMuted}>Nouveau ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('EmailAuth')}>
                <Text style={[styles.link, styles.linkBrand]}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BRAND  = '#FF6B00'
const BG     = '#0A0A0A'
const CARD   = '#161616'
const WHITE  = '#FFFFFF'

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: BG },
  kav:             { flex: 1 },
  scroll:          { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  logoContainer:   { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  logoEmoji:       { fontSize: 48 },
  logoText:        { fontSize: 44, fontWeight: '900', color: WHITE, letterSpacing: -1 },
  logoSub:         { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  card:            { backgroundColor: CARD, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title:           { fontSize: 20, fontWeight: '700', color: WHITE, marginBottom: 6 },
  subtitle:        { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 18 },
  label:           { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  phoneRow:        { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 2, overflow: 'hidden', height: 52 },
  inputIdle:       { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' },
  inputValid:      { borderColor: BRAND,   backgroundColor: 'rgba(255,107,0,0.08)' },
  inputError:      { borderColor: '#FF4444', backgroundColor: 'rgba(255,68,68,0.08)' },
  prefix:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)', height: '100%', gap: 6 },
  prefixFlag:      { fontSize: 18 },
  prefixCode:      { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  phoneInput:      { flex: 1, fontSize: 16, color: WHITE, paddingHorizontal: 14 },
  hint:            { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, marginBottom: 20 },
  error:           { fontSize: 12, color: '#FF4444', marginTop: 6 },
  btn:             { backgroundColor: BRAND, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: BRAND, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  btnDisabled:     { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
  btnText:         { fontSize: 15, fontWeight: '700', color: WHITE },
  links:           { alignItems: 'center', marginTop: 24, gap: 12 },
  link:            { fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'underline' },
  linkBrand:       { color: BRAND, textDecorationLine: 'none', fontWeight: '600' },
  linkMuted:       { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  registerRow:     { flexDirection: 'row', alignItems: 'center' },
})
