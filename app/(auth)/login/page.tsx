"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    alert("Connexion réussie ! (mock)");
  }

  return (
    <div
      className="flex min-h-[80vh] items-center justify-center px-4"
      style={{ backgroundColor: "#fffbf5" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-lg">
            DF
          </div>
          <h1
            className="mt-4 text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Connexion
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === "phone"
              ? "Entrez votre numéro de téléphone"
              : `Code envoyé au +237${phone}`}
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Numéro de téléphone
                </label>
                <div className="flex gap-2">
                  <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600">
                    🇨🇲 +237
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="6XX XXX XXX"
                    required
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  "Recevoir mon code SMS"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Code de vérification (6 chiffres)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-widest focus:border-primary focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Vérification..." : "Vérifier et se connecter"}
              </button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm text-gray-500 hover:text-primary transition-colors"
              >
                ← Changer de numéro
              </button>
            </form>
          )}

          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-center text-xs text-gray-500">
              Ou connectez-vous avec{" "}
              <Link href="/login/email" className="font-medium text-primary hover:underline">
                votre email
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          En continuant, vous acceptez nos{" "}
          <Link href="/terms" className="hover:underline">Conditions d'utilisation</Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="hover:underline">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
