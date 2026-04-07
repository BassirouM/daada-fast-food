/**
 * Types de navigation pour le stack d'authentification mobile.
 *
 * Utiliser avec @react-navigation/native-stack :
 *   const Stack = createNativeStackNavigator<AuthStackParamList>()
 */

export type AuthStackParamList = {
  Login:     undefined
  Verify:    {
    phone:       string  // +237XXXXXXXXX
    maskedPhone: string  // +237 6** *** 23
    expiresIn:   number  // secondes
  }
  Register:  {
    phone: string
  }
  EmailAuth: undefined
}

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}
