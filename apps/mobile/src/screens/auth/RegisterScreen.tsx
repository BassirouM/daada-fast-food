/**
 * RegisterScreen — Complétion du profil (nouveau compte)
 *
 * Reçoit le tempToken depuis VerifyScreen via SecureStore.
 * Appelle POST /api/auth/complete-profile.
 * Stocke les tokens dans Expo SecureStore.
 *
 * Biométrie optionnelle : si disponible, propose de se reconnecter avec Face ID / Touch ID.
 * Dépendances : expo-secure-store, expo-local-authentication
 */

import React, { useState, useEffect } from 'react'
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
  Switch,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../types/navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.daada.cm'

export function RegisterScreen({ route, navigation }: Props) {
  const { phone } = route.params

  const [firstName,     setFirstName]     = useState('')
  const [lastName,      setLastName]      = useState('')
  const [referralCode,  setReferralCode]  = useState('')
  const [cguAccepted,   setCguAccepted]   = useState(false)
  const [biometricsOn,  setBiometricsOn]  = useState(false)
  const [hasBiometrics, setHasBiometrics] = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0 && cguAccepted

  // Vérifier si la biométrie est disponible sur cet appareil
  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then((has) => {
      if (has) {
        LocalAuthentication.isEnrolledAsync().then((enrolled) => {
          setHasBiometrics(enrolled)
        })
      }
    })
  }, [])

  async function handleSubmit() {
    if (!isValid || loading) return
    setError('')
    setLoading(true)

    try {
      const tempToken = await SecureStore.getItemAsync('auth:tempToken')
      if (!tempToken) {
        setError('Session expirée. Recommencez la connexion.')
        navigation.navigate('Login')
        return
      }

      const res = await fetch(`${API_BASE}/api/auth/complete-profile`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          firstName:    firstName.trim(),
          lastName:     lastName.trim(),
          referralCode: referralCode.trim().toUpperCase() || undefined,
        }),
      })
      const data = await res.json() as {
        user?: Record<string, unknown>; accessToken?: string; expiresAt?: number; error?: string
      }

      if (!res.ok) { setError(data.error ?? 'Erreur création compte.'); return }

      // Stocker les tokens dans Expo SecureStore
      if (data.accessToken && data.expiresAt) {
        await SecureStore.setItemAsync('auth:accessToken', data.accessToken)
        await SecureStore.setItemAsync('auth:expiresAt', String(data.expiresAt))
      }
      await SecureStore.deleteItemAsync('auth:tempToken')

      // Activer la biométrie si demandé
      if (biometricsOn && hasBiometrics) {
        await SecureStore.setItemAsync('auth:biometrics', '1')
      }

      // Navigation vers l'app principale
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' as never }] })
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <Text style={styles.title}>Créer mon compte</Text>
          <Text style={styles.subtitle}>Complétez votre profil pour commencer à commander.</Text>

          {/* Prénom */}
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Aminatou"
            placeholderTextColor="#555"
            autoComplete="given-name"
            textContentType="givenName"
            maxLength={50}
            returnKeyType="next"
          />

          {/* Nom */}
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Moussa"
            placeholderTextColor="#555"
            autoComplete="family-name"
            textContentType="familyName"
            maxLength={50}
            returnKeyType="next"
          />

          {/* Code parrainage */}
          <Text style={styles.label}>
            Code de parrainage{' '}
            <Text style={styles.optional}>(optionnel)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMono]}
            value={referralCode}
            onChangeText={(t) => setReferralCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="EX: ABC123"
            placeholderTextColor="#555"
            maxLength={6}
            returnKeyType="done"
            autoCapitalize="characters"
          />

          {/* Biométrie */}
          {hasBiometrics && (
            <View style={styles.biometricsRow}>
              <View style={styles.biometricsText}>
                <Text style={styles.biometricsTitle}>
                  {Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Biométrie'}
                </Text>
                <Text style={styles.biometricsDesc}>Connexion rapide à votre prochain accès</Text>
              </View>
              <Switch
                value={biometricsOn}
                onValueChange={setBiometricsOn}
                trackColor={{ false: '#333', true: '#FF6B00' }}
                thumbColor="#fff"
              />
            </View>
          )}

          {/* CGU */}
          <TouchableOpacity
            style={styles.cguRow}
            onPress={() => setCguAccepted(!cguAccepted)}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: cguAccepted }}
          >
            <View style={[styles.checkbox, cguAccepted && styles.checkboxChecked]}>
              {cguAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.cguText}>
              J'accepte les{' '}
              <Text style={styles.cguLink}>conditions générales d'utilisation</Text>
              {' '}de Daada.
            </Text>
          </TouchableOpacity>

          {/* Erreur */}
          {!!error && (
            <Text style={styles.error} accessibilityRole="alert">{error}</Text>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.8}
            accessibilityLabel="Créer mon compte"
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00'
const BG    = '#0A0A0A'
const WHITE = '#FFFFFF'

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: BG },
  kav:             { flex: 1 },
  scroll:          { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title:           { fontSize: 24, fontWeight: '700', color: WHITE, marginBottom: 8 },
  subtitle:        { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 18 },
  label:           { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: 8, marginTop: 16 },
  optional:        { color: 'rgba(255,255,255,0.3)', fontWeight: '400' },
  input:           { height: 52, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, fontSize: 15, color: WHITE },
  inputMono:       { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 4 },
  biometricsRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  biometricsText:  { flex: 1 },
  biometricsTitle: { fontSize: 14, fontWeight: '600', color: WHITE },
  biometricsDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  cguRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20 },
  checkbox:        { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: BRAND, borderColor: BRAND },
  checkmark:       { fontSize: 13, color: WHITE, fontWeight: '700' },
  cguText:         { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  cguLink:         { color: BRAND },
  error:           { fontSize: 13, color: '#FF4444', marginTop: 12, lineHeight: 18 },
  btn:             { backgroundColor: BRAND, borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24, shadowColor: BRAND, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  btnDisabled:     { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
  btnText:         { fontSize: 15, fontWeight: '700', color: WHITE },
  backBtn:         { alignItems: 'center', marginTop: 20 },
  backText:        { fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' },
})
