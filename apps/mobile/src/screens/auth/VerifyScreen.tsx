/**
 * VerifyScreen — Saisie du code OTP (6 chiffres)
 *
 * Fonctionnalités :
 * - 6 inputs natifs avec auto-focus / auto-avance
 * - Auto-submit au 6ème chiffre
 * - Countdown 60s + bouton "Renvoyer le code"
 * - Gestion des tentatives restantes
 * - Expo SecureStore pour stocker les tokens
 *
 * Dépendances : expo-secure-store, @react-navigation/native-stack
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../types/navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'Verify'>

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.daada.cm'
const OTP_LEN  = 6

export function VerifyScreen({ route, navigation }: Props) {
  const { phone, maskedPhone, expiresIn } = route.params

  const [digits,    setDigits]    = useState<string[]>(Array(OTP_LEN).fill(''))
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(Math.min(expiresIn ?? 60, 60))

  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LEN).fill(null))

  // ── Countdown ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  // ── Auto-submit ───────────────────────────────────────────────────────────

  useEffect(() => {
    const code = digits.join('')
    if (code.length === OTP_LEN && !loading) {
      void verify(code)
    }
  }, [digits]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Saisie ────────────────────────────────────────────────────────────────

  function handleDigit(index: number, text: string) {
    const char = text.replace(/\D/g, '').slice(-1)
    if (!char) return

    const next = [...digits]
    next[index] = char
    setDigits(next)

    if (index < OTP_LEN - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleBackspace(index: number) {
    if (digits[index]) {
      const next = [...digits]; next[index] = ''; setDigits(next)
    } else if (index > 0) {
      inputRefs.current[index - 1]?.focus()
      const next = [...digits]; next[index - 1] = ''; setDigits(next)
    }
  }

  // ── Vérification ─────────────────────────────────────────────────────────

  const verify = useCallback(async (code: string) => {
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone: phone.replace('+237', ''), code }),
      })
      const data = await res.json() as {
        isNew?: boolean
        requiresProfile?: boolean
        tempToken?: string
        user?: Record<string, unknown>
        accessToken?: string
        expiresAt?: number
        error?: string
        remaining?: number
      }

      if (!res.ok) {
        setError(data.error ?? 'Code invalide.')
        if (data.remaining !== undefined) setRemaining(data.remaining)
        setDigits(Array(OTP_LEN).fill(''))
        inputRefs.current[0]?.focus()
        return
      }

      if (data.isNew && data.requiresProfile && data.tempToken) {
        // Stocker le tempToken — Expo SecureStore
        await SecureStore.setItemAsync('auth:tempToken', data.tempToken)
        navigation.navigate('Register', { phone })
        return
      }

      // Utilisateur existant — stocker les tokens
      if (data.accessToken && data.expiresAt) {
        await SecureStore.setItemAsync('auth:accessToken', data.accessToken)
        await SecureStore.setItemAsync('auth:expiresAt', String(data.expiresAt))
      }

      // Navigation vers l'app principale (remplacer par votre flux de navigation)
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' as never }] })
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }, [phone, loading, navigation])

  // ── Renvoi ────────────────────────────────────────────────────────────────

  async function resend() {
    if (countdown > 0 || loading) return
    setError('')
    setDigits(Array(OTP_LEN).fill(''))
    setRemaining(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone: phone.replace('+237', '') }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Erreur renvoi.'); return }
      setCountdown(60)
      inputRefs.current[0]?.focus()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  const minuteStr = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.title}>Vérification</Text>
          <Text style={styles.subtitle}>
            Code envoyé au{' '}
            <Text style={styles.phone}>{maskedPhone || phone}</Text>
          </Text>

          {/* 6 inputs */}
          <View style={styles.otpRow} accessibilityLabel="Code OTP à 6 chiffres">
            {Array.from({ length: OTP_LEN }, (_, i) => (
              <TextInput
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                style={[
                  styles.otpInput,
                  !!error && styles.otpError,
                  digits[i] ? styles.otpFilled : undefined,
                ]}
                value={digits[i]}
                onChangeText={(t) => handleDigit(i, t)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') handleBackspace(i)
                }}
                keyboardType="number-pad"
                maxLength={1}
                textContentType="oneTimeCode"
                autoComplete={i === 0 ? 'sms-otp' : undefined}
                selectTextOnFocus
                autoFocus={i === 0}
                accessibilityLabel={`Chiffre ${i + 1}`}
              />
            ))}
          </View>

          {/* Erreur */}
          {!!error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
              {remaining !== null && remaining > 0
                ? `\n${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`
                : ''}
            </Text>
          )}

          {/* Loading */}
          {loading && <ActivityIndicator color="#FF6B00" style={{ marginTop: 12 }} />}

          {/* Renvoi */}
          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.countdown}>
                Renvoyer dans <Text style={styles.countdownTime}>{minuteStr}</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={resend} disabled={loading} accessibilityRole="button">
                <Text style={[styles.resendBtn, loading && { opacity: 0.4 }]}>
                  Renvoyer le code
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Retour */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>← Changer de numéro</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00'
const BG    = '#0A0A0A'
const CARD  = '#161616'
const WHITE = '#FFFFFF'

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: BG },
  kav:               { flex: 1 },
  container:         { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  title:             { fontSize: 24, fontWeight: '700', color: WHITE, textAlign: 'center' },
  subtitle:          { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  phone:             { color: WHITE, fontWeight: '600' },
  otpRow:            { flexDirection: 'row', gap: 10, marginBottom: 20 },
  otpInput:          { width: 46, height: 58, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 22, fontWeight: '700', color: WHITE },
  otpFilled:         { borderColor: BRAND, backgroundColor: 'rgba(255,107,0,0.1)' },
  otpError:          { borderColor: '#FF4444', backgroundColor: 'rgba(255,68,68,0.1)' },
  error:             { fontSize: 13, color: '#FF4444', textAlign: 'center', marginBottom: 12, lineHeight: 18 },
  resendContainer:   { marginTop: 24 },
  countdown:         { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  countdownTime:     { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  resendBtn:         { fontSize: 14, fontWeight: '600', color: BRAND, textAlign: 'center' },
  backBtn:           { marginTop: 32 },
  backText:          { fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' },
})
