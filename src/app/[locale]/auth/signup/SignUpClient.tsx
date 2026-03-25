"use client";
import { authService } from '@/services/authService';
import { UserRole } from '@prisma/client';
import Image from 'next/image';
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from 'react';
import Loader from '@/components/Loader';
import { useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/i18n/navigation";
import LanguageSelectorDialog from "@/components/LanguageSelectorDialog";

const roleOptions = [
    { value: 'CUSTOMER', labelKey: 'customer' },
    { value: 'DRIVER', labelKey: 'driver' },
    { value: 'VENDOR', labelKey: 'vendor' },
];

export default function SignUpClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("auth");
    const tMessages = useTranslations("messages");
    const preselectedRole = (searchParams?.get('role') || UserRole.CUSTOMER) as UserRole;
    useEffect(() => {
        fetch('https://jsonplaceholder.typicode.com/todos/1')
            .then(response => response.json())
            .then(json => console.log(json))
    }, [])
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: preselectedRole,
        businessName: "",
        vehicleType: "",
        documents: null as File | null
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({
                ...prev,
                documents: e.target.files![0]
            }));
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authService.signUp({
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                name: formData.name,
                role: formData.role,
                businessName: formData.businessName,
                vehicleType: formData.vehicleType,
                documents: formData.documents
            });

            if (response?.error) {
                setIsLoading(false);
                return;
            }

            if (typeof window !== "undefined") {
                localStorage.setItem("pendingVerificationEmail", formData.email);
            }

            setTimeout(() => {
                const locale = typeof window !== 'undefined' ? localStorage.getItem('NEXT_LOCALE') || 'en' : 'en';
                router.push(`/${locale}/auth/verify-email`);
            }, 800);
        } catch (e) {
            console.error('Unexpected Error:', e);
            setIsLoading(false);
        }
    };

    const getRoleLabel = (labelKey: string): string => {
        const labels: Record<string, string> = {
            customer: t('roleCustomer'),
            driver: t('roleDriver'),
            vendor: t('roleVendor')
        };
        return labels[labelKey] || labelKey;
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
            <div className="relative my-4 max-md:mx-6 z-10 border border-gray-400 overflow-hidden rounded-3xl py-4 bg-white" style={{ boxShadow: '0 0 25px 0 rgba(0, 0, 0, 0.15)' }}>
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
                            <b>{t('createAccount')}</b> {t('joinUs')}.
                        </p>

                        <form onSubmit={handleSignUp} className="space-y-3">
                            <div className="border-l-4 border-primary">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                    placeholder={t('name')}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="border-l-4 border-primary">
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder={t('email')}
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                />
                            </div>

                            <div className="border-l-4 border-primary">
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                    placeholder={t('phoneNumber')}
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="border-l-4 border-primary">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder={t('password')}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-700">
                                    {t('joinAs')}
                                </label>
                                <div className="border-l-4 border-primary">
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                    >
                                        {roleOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {getRoleLabel(option.labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {formData.role === 'VENDOR' && (
                                <div className="border-l-4 border-primary">
                                    <input
                                        id="businessName"
                                        name="businessName"
                                        type="text"
                                        required
                                        className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                        placeholder={t('businessName')}
                                        value={formData.businessName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            )}

                            {formData.role === 'DRIVER' && (
                                <div className="border-l-4 border-primary">
                                    <select
                                        id="vehicleType"
                                        name="vehicleType"
                                        required
                                        className="h-12 w-full text-sm border border-gray-200 bg-gray-50 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                                        value={formData.vehicleType}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">{t('selectVehicle')}</option>
                                        <option value="CAR">{t('car')}</option>
                                        <option value="BIKE">{t('bike')}</option>
                                        <option value="BICYCLE">{t('bicycle')}</option>
                                    </select>
                                </div>
                            )}

                            {(formData.role === UserRole.VENDOR || formData.role === UserRole.DRIVER) && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t('uploadDocuments')}
                                        {formData.role === 'VENDOR' ? ` (${t('businessLicense')})` : ` (${t('driverLicense')})`}
                                    </label>
                                    <input
                                        type="file"
                                        name="documents"
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary-dark"
                                    />
                                </div>
                            )}

                            <div className="text-center">
                                <button
                                    type="submit"
                                    className="py-3 px-6 bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-600"
                                >
                                    {t('signup')}
                                </button>
                            </div>

                            <div className="text-sm text-center">
                                <LocaleLink
                                    href="/auth/login"
                                    prefetch={false}
                                    className="text-gray-500"
                                >
                                    {t('alreadyHaveAccount')}{" "}
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
