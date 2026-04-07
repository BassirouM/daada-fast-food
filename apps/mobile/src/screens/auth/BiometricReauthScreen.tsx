/**
 * BiometricReauthScreen — Reconnexion biométrique optionnelle
 *
 * Affiché lorsque la session a expiré et que l'utilisateur a activé
 * la biométrie lors de son inscription.
 *
 * Flux :
 *  1. Lire le refresh token depuis Expo SecureStore
 *  2. Demander l'authentification biométrique (Face ID / Touch ID / empreinte)
 *  3. Si validé → appeler /api/auth/refresh pour obtenir de nouveaux tokens
 *  4. Stocker les nouveaux tokens dans SecureStore
 *
 * Dépendances : expo-secure-store, expo-local-authentication
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../types/navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.daada.cm'

export function BiometricReauthScreen({ navigation }: Props) {
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [biometricLabel, setBiometricLabel] = useState('Biométrie')

  useEffect(() => {
    // Détecter le type de biométrie disponible
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      const hasFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      setBiometricLabel(hasFaceId ? 'Face ID' : 'Empreinte digitale')
    })
    // Lancer automatiquement
    void authenticate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function authenticate() {
    setLoading(true)
    setError('')

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:  `Connexion à Daada`,
        fallbackLabel:  'Mot de passe',
        cancelLabel:    'Annuler',
        disableDeviceFallback: false,
      })

      if (!result.success) {
        setError('Authentification annulée.')
        setLoading(false)
        return
      }

      // Biométrie validée → rafraîchir les tokens
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method:      'POST',
        credentials: 'include',
      })
      const data = await res.json() as { accessToken?: string; expiresAt?: number; error?: string }

      if (!res.ok || !data.accessToken) {
        setError('Session expirée. Reconnectez-vous.')
        setLoading(false)
        // Effacer les tokens obsolètes
        await SecureStore.deleteItemAsync('auth:accessToken')
        await SecureStore.deleteItemAsync('auth:expiresAt')
        await SecureStore.deleteItemAsync('auth:biometrics')
        return
      }

      await SecureStore.setItemAsync('auth:accessToken', data.accessToken)
      await SecureStore.setItemAsync('auth:expiresAt', String(data.expiresAt))

      // Navigation vers l'app principale
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' as never }] })
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Icône */}
        <Text style={styles.icon}>
          {Platform.OS === 'ios' ? '🔐' : '👆'}
        </Text>

        <Text style={styles.title}>Reconnexion</Text>
        <Text style={styles.subtitle}>
          Utilisez votre{' '}
          <Text style={styles.highlight}>{biometricLabel}</Text>
          {' '}pour vous reconnecter à Daada.
        </Text>

        {loading && <ActivityIndicator color="#FF6B00" style={{ marginTop: 24 }} />}

        {!!error && (
          <Text style={styles.error} accessibilityRole="alert">{error}</Text>
        )}

        {!loading && (
          <TouchableOpacity
            style={styles.btn}
            onPress={authenticate}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Se connecter avec ${biometricLabel}`}
          >
            <Text style={styles.btnText}>Utiliser {biometricLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.fallback}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
        >
          <Text style={styles.fallbackText}>Connexion par SMS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  icon:      { fontSize: 64, marginBottom: 24 },
  title:     { fontSize: 24, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  subtitle:  { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  highlight: { color: '#FF6B00', fontWeight: '600' },
  error:     { fontSize: 13, color: '#FF4444', textAlign: 'center', marginBottom: 20 },
  btn:       { backgroundColor: '#FF6B00', borderRadius: 18, height: 56, width: '100%', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6B00', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  btnText:   { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  fallback:  { marginTop: 20 },
  fallbackText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline', textAlign: 'center' },
})
