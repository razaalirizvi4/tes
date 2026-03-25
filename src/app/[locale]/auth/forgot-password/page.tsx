"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { authService } from "@/services/authService";
import Loader from "@/components/Loader";
import { useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/i18n/navigation";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tMessages = useTranslations("messages");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const error = searchParams?.get("error");
    if (error) {
      switch (error) {
        case "invalid_link":
          toast.error(tMessages('invalidResetLink') || "Invalid password reset link. Please request a new one.");
          break;
        case "expired_link":
          toast.error(tMessages('expiredResetLink') || "Password reset link has expired. Please request a new one.");
          break;
        case "processing_error":
          toast.error(tMessages('errorOccurred'));
          break;
        default:
          toast.error(tMessages('errorOccurred'));
      }
      router.replace("/auth/forgot-password");
    }
  }, [searchParams, router, tMessages]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await authService.forgotPassword(email);

      if (response?.error) {
        if (response.isGoogleSSO) {
          setErrorMessage(response.error);
        } else {
          toast.error(response.error);
        }
        setIsLoading(false);
        return;
      }

      toast.success(
        response?.message ||
        t('resetLink')
      );

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(tMessages('errorOccurred'));
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {isLoading && <Loader fullScreen message={tMessages('loading')} />}
      <Image
        src="/images/auth-bg.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      <div
        className="relative max-md:mx-6 z-10 border border-gray-400 overflow-hidden rounded-3xl py-4 bg-white"
        style={{ boxShadow: "0 0 25px 0 rgba(0, 0, 0, 0.15)" }}
      >
        <div className="flex w-fit items-center justify-center px-8">
          <div className="w-full max-w-md">
            <div className="mb-1 flex justify-center">
              <Image
                src="/images/fiestaa-logo.png"
                alt="Fiestaa Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-center">
              {t('passwordReset')}
            </h1>
            <p className="text-sm mb-6 text-center font-normal leading-relaxed text-gray-600">
              {t('enterEmail')}
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="border-l-4 border-primary">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="py-3 px-6 bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" variant="spinner" />
                      <span>{tMessages('loading')}</span>
                    </>
                  ) : (
                    t('sendResetLink')
                  )}
                </button>
              </div>

              <div className="text-sm text-center">
                <LocaleLink href="/auth/login" className="text-gray-500">
                  {t('backToLogin')}{" "}
                  <span className="text-primary font-semibold">{t('login')}</span>
                </LocaleLink>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Loader fullScreen message="Loading..." />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
