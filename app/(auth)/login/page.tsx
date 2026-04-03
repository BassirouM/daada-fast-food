"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneInput } from "@daada/ui";
import { Button } from "@daada/ui";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500)); // mock delay
    setLoading(false);
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    // In real app: redirect to home or onboarding
    alert("Connexion réussie ! (mock)");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background-light px-4 dark:bg-background-dark">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-lg">
            DF
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {step === "phone"
              ? "Entrez votre numéro de téléphone"
              : `Code envoyé au ${phone}`}
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Numéro de téléphone
                </label>
                <PhoneInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Recevoir mon code SMS
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code de vérification (6 chiffres)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-widest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
              <Button type="submit" loading={loading} disabled={otp.length !== 6} className="w-full">
                Vérifier et se connecter
              </Button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm text-gray-500 hover:text-primary dark:text-gray-400 transition-colors"
              >
                ← Changer de numéro
              </button>
            </form>
          )}

          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Ou connectez-vous avec{" "}
              <Link href="/login/email" className="text-primary hover:underline font-medium">
                votre email
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
          En continuant, vous acceptez nos{" "}
          <Link href="/terms" className="hover:underline">
            Conditions d'utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="hover:underline">
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}
