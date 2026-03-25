"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Loader from "@/components/Loader";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{
        newPassword?: string;
        confirmPassword?: string;
    }>({});

    // Validate token from query params
    useEffect(() => {
        const validateToken = async () => {
            const token = searchParams?.get("token");

            if (!token) {
                toast.error("Invalid reset link. Please request a new password reset.");
                router.push("/auth/forgot-password");
                return;
            }

            try {
                const response = await fetch(`/api/reset-password?token=${encodeURIComponent(token)}`);
                const data = await response.json();

                if (data.valid) {
                    setIsReady(true);
                } else {
                    toast.error(data.error || "Invalid or expired reset link. The link expires in 10 minutes.");
                    router.push("/auth/forgot-password");
                }
            } catch (error) {
                console.error("Token validation error:", error);
                toast.error("Error validating reset link. Please try again.");
                router.push("/auth/forgot-password");
            }
        };

        validateToken();
    }, [router, searchParams]);

    // Password validation rules
    const validatePassword = (password: string): string | undefined => {
        if (password.length < 8) {
            return "Password must be at least 8 characters long";
        }
        return undefined;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear validation errors when user types
        setValidationErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));

        // Real-time validation
        if (name === "newPassword") {
            const error = validatePassword(value);
            if (error && value.length > 0) {
                setValidationErrors((prev) => ({
                    ...prev,
                    newPassword: error,
                }));
            }
        } else if (name === "confirmPassword") {
            if (value !== formData.newPassword && value.length > 0) {
                setValidationErrors((prev) => ({
                    ...prev,
                    confirmPassword: "Passwords do not match",
                }));
            } else if (value === formData.newPassword) {
                setValidationErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                }));
            }
        }
    };

    const isFormValid = () => {
        const passwordError = validatePassword(formData.newPassword);
        const passwordsMatch = formData.newPassword === formData.confirmPassword;
        const hasErrors = passwordError || !passwordsMatch;

        return (
            formData.newPassword.length > 0 &&
            formData.confirmPassword.length > 0 &&
            !hasErrors
        );
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setValidationErrors({
                confirmPassword: "Passwords do not match",
            });
            toast.error("Passwords do not match");
            return;
        }

        // Validate password strength
        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setValidationErrors({
                newPassword: passwordError,
            });
            toast.error(passwordError);
            return;
        }

        setIsLoading(true);

        try {
            const token = searchParams?.get("token");
            if (!token) {
                toast.error("Invalid reset link. Please request a new one.");
                setIsLoading(false);
                return;
            }

            // Reset password using our API
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(data.message || "Your password has been reset successfully.");

                // Clean URL
                window.history.replaceState(null, "", "/auth/reset-password");

                // Redirect to sign in page after success
                setTimeout(() => {
                    router.push("/auth/login");
                }, 1500);
            } else {
                toast.error(data.error || "Failed to reset password. Please try again.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    if (!isReady) {
        return (
            <div className="relative flex min-h-screen items-center justify-center">
                <Loader fullScreen message="Loading reset password page..." />
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center">
            {isLoading && <Loader fullScreen message="Resetting password..." />}
            <Image
                src="/images/auth-bg.png"
                alt="Background"
                fill
                className="object-cover"
                priority
            />
            <div
                className="relative max-md:mx-6 md:w-1/2 xl:w-1/4  w-full z-10 border border-gray-400 overflow-hidden rounded-3xl py-6 px-6 bg-white"
                style={{ boxShadow: "0 0 25px 0 rgba(0, 0, 0, 0.15)" }}
            >
                <div className="flex w-full items-center justify-center">
                    <div className="w-full max-w-lg">
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
                            Reset Password
                        </h1>
                        <p className="text-sm mb-6 text-center font-normal leading-relaxed text-gray-600">
                            Enter your new password below.
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* New Password */}
                            <div>
                                <div className="border-l-4 border-primary relative">
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        placeholder="New Password"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        className={`h-12 w-full text-sm border ${validationErrors.newPassword
                                            ? "border-red-300"
                                            : "border-gray-200"
                                            } bg-gray-50 px-4 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <AiOutlineEyeInvisible className="h-5 w-5" />
                                        ) : (
                                            <AiOutlineEye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {validationErrors.newPassword && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {validationErrors.newPassword}
                                    </p>
                                )}
                                {formData.newPassword.length > 0 &&
                                    formData.newPassword.length < 8 && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Password must be at least 8 characters long
                                        </p>
                                    )}
                                {formData.newPassword.length >= 8 &&
                                    !validationErrors.newPassword && (
                                        <p className="mt-1 text-xs text-green-600">
                                            Password meets requirements
                                        </p>
                                    )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <div className="border-l-4 border-primary relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        placeholder="Confirm New Password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`h-12 w-full text-sm border ${validationErrors.confirmPassword
                                            ? "border-red-300"
                                            : "border-gray-200"
                                            } bg-gray-50 px-4 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(!showConfirmPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        aria-label={
                                            showConfirmPassword ? "Hide password" : "Show password"
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <AiOutlineEyeInvisible className="h-5 w-5" />
                                        ) : (
                                            <AiOutlineEye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {validationErrors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {validationErrors.confirmPassword}
                                    </p>
                                )}
                                {formData.confirmPassword.length > 0 &&
                                    formData.newPassword === formData.confirmPassword &&
                                    !validationErrors.confirmPassword && (
                                        <p className="mt-1 text-xs text-green-600">
                                            Passwords match
                                        </p>
                                    )}
                            </div>

                            <div className="text-center">
                                <button
                                    type="submit"
                                    disabled={isLoading || !isFormValid()}
                                    className="py-3 px-6 bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[120px]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader size="sm" variant="spinner" />
                                            <span>Resetting...</span>
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>
                            </div>

                            <div className="text-sm text-center">
                                <Link href="/auth/login" className="text-gray-500">
                                    Back to{" "}
                                    <span className="text-primary font-semibold">Sign In</span>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<Loader fullScreen message="Loading..." />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
