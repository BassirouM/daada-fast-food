import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-orange">Daada</h1>
          <p className="text-brand-gray-light mt-2">Livraison rapide à Maroua</p>
        </div>

        {/* Auth form placeholder - implement with OTP flow */}
        <div className="bg-brand-black-soft rounded-2xl p-6 space-y-4">
          <h2 className="text-white text-xl font-semibold">Connexion</h2>
          <p className="text-brand-gray-light text-sm">
            Entrez votre numéro MTN ou Orange pour recevoir un code de vérification.
          </p>
          {/* PhoneInputForm component goes here */}
        </div>
      </div>
    </div>
  )
}
