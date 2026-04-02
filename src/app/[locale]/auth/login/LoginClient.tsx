"use client";
import LanguageSelectorDialog from "@/components/LanguageSelectorDialog";
import Loader from "@/components/Loader";
import { Link as LocaleLink } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";
import { locationService } from "@/services/locationService";
import { useAuthStore, useCartStore } from "@/store/useStore";
import axios from "axios";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";

export default function LoginClient() {
    const router = useRouter();
    const t = useTranslations("auth");
    const tMessages = useTranslations("messages");
    const format = useFormatter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const cartItems = useCartStore((state) => state.items);
    const [currentTime, setCurrentTime] = useState<any>(null);

    useEffect(() => {
        // setCurrentTime(new Date().toISOString());
    }, []);



    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authService.signIn(email, password);

            if (response?.error) {
                console.error("Login error:", response.error);

                if (response.requiresEmailVerification) {
                    const locale = typeof window !== 'undefined' ? localStorage.getItem('NEXT_LOCALE') || 'en' : 'en';
                    router.push(`/${locale}/auth/verify-email`);
                    return;
                }

                toast.error(tMessages('errorOccurred'));
                setIsLoading(false);
                return;
            }

            if (!response?.data) {
                console.warn("Unexpected response: no data and no error.");
                toast.error(tMessages('errorOccurred'));
                setIsLoading(false);
                return;
            }

            const { session, user: userData } = response.data.data;

            if (!session) {
                toast.error(tMessages('errorOccurred'));
                setIsLoading(false);
                return;
            }

            const { access_token, refresh_token } = session;

            if (!userData?.id || !userData?.email) {
                toast.error(tMessages('errorOccurred'));
                setIsLoading(false);
                return;
            }

            await supabase.auth.setSession({ access_token, refresh_token });
            useAuthStore.getState().setUser(userData);

            const userRole = userData?.role;
            const locale = typeof window !== 'undefined' ? localStorage.getItem('NEXT_LOCALE') || 'en' : 'en';

            if (userRole === "SUPER_ADMIN") {
                router.push(`/${locale}/dashboard`);
            } else if (userRole === "VENDOR") {
                router.push(`/${locale}/dashboard/restaurants`);
            } else {
                if (cartItems.length > 0) {
                    router.push(`/${locale}/checkout`);
                } else {
                    router.push(`/${locale}`);
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(tMessages('errorOccurred'));
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/google");
            window.location.href = response.data.data.url;
        } catch (error) {
            console.error("Google OAuth failed:", error);
            toast.error(tMessages('errorOccurred'));
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center">
            {isLoading && <Loader fullScreen message={tMessages('loading')} />}

            {/* Language Selector */}
            <div className="absolute top-6 right-6 z-20">
                <LanguageSelectorDialog />
            </div>


            <Image
                src="/images/auth-bg.png"
                alt="Background"
                fill
                className="object-cover"
                priority
            />
            <div className="relative max-md:mx-6 z-10 border border-gray-400 overflow-hidden rounded-3xl py-4 bg-white" style={{ boxShadow: '0 0 25px 0 rgba(0, 0, 0, 0.15)' }}>
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
                        <p className="text-sm mb-3 text-center font-normal leading-relaxed">
                            <b>{t('login')}</b> {t('loginSubtitle')}
                        </p>

                        <form className="space-y-3" onSubmit={handleLogin}>
                            <div className="border-l-4 border-primary">
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder={t('email')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                />
                            </div>
                            <div className="border-l-4 border-primary relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    placeholder={t('password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
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
                            <div className="text-right">
                                <LocaleLink
                                    href="/auth/forgot-password"
                                    prefetch={false}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t('forgotPassword')}
                                </LocaleLink>
                            </div>
                            <div className="text-center">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="py-3 px-6 bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[120px]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader size="sm" variant="spinner" />
                                            <span>{tMessages('loading')}</span>
                                        </>
                                    ) : (
                                        t('login')
                                    )}
                                </button>
                                <p className="text-xs text-gray-400 mt-2">
                                    {currentTime ? new Date(currentTime).toLocaleString() : ''}
                                </p>
                            </div>

                            <div className="relative flex py-0 items-center w-full px-10">
                                <div className="flex-grow border-t border-gray-400"></div>
                                <span className="flex-shrink mx-4 text-gray-400">{t('or')}</span>
                                <div className="flex-grow border-t border-gray-400"></div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full rounded-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader size="sm" variant="spinner" />
                                        <span>{tMessages('loading')}</span>
                                    </>
                                ) : (
                                    <>
                                        <FcGoogle className="w-5 h-5" />
                                        {t('google')} {t('login')}
                                    </>
                                )}
                            </button>

                            <div className="text-sm text-center">
                                <LocaleLink href="/auth/signup" prefetch={false} className="text-gray-500">
                                    {t('dontHaveAccount')}{" "}
                                    <span className="text-primary font-semibold">{t('signup')}</span>
                                </LocaleLink>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
