"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Try to get email from localStorage or session if available
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("pendingVerificationEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email address not found. Please sign up again.");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Confirmation email resent! Please check your inbox.");
      } else {
        toast.error(data.error || "Failed to resend email. Please try again later.");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      toast.error("Failed to resend email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <Image
        src="/images/auth-bg.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      <div className="relative my-4 max-md:mx-6 z-10 border border-gray-400 overflow-hidden rounded-3xl py-8 px-8 bg-white max-w-md" style={{ boxShadow: '0 0 25px 0 rgba(0, 0, 0, 0.15)' }}>
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/images/fiestaa-logo.png"
              alt="Fiestaa Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>

          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 text-sm">
              We've sent a confirmation email to
            </p>
            {email && (
              <p className="text-primary font-semibold mt-1">{email}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Please check your inbox</strong> and click on the confirmation link to verify your email address.
            </p>
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> The confirmation link will expire in 24 hours. If you don't see the email, please check your spam folder.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full py-3 px-6 bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend Confirmation Email"}
            </button>

            <Link
              href="/auth/login"
              className="block w-full py-3 px-6 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors text-center"
            >
              Back to Login
            </Link>

            <p className="text-xs text-gray-500 mt-4">
              Already confirmed?{" "}
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

