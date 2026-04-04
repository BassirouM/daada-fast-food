export { authService } from './auth.service'
export { otpService } from './otp.service'
export { sendOtpViaTwilio, verifyOtpViaTwilio } from './twilio'
export {
  createSession,
  refreshSession,
  terminateSession,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  getVerifiedPayload,
} from './session'
export { getGoogleProvider, signInWithGoogle, signOutFirebase } from './providers'
export type { SessionResult } from './session'
export type { SendOtpResult, VerifyOtpResult, VerificationStatus } from './twilio'
export type { FirebaseAuthResult } from './providers'
