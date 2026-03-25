"use client";

import React from "react";

interface LoaderProps {
    /**
     * Size of the loader
     * @default "md"
     */
    size?: "sm" | "md" | "lg";
    /**
     * Variant of the loader
     * @default "spinner"
     */
    variant?: "spinner" | "dots" | "pulse";
    /**
     * Whether to show full screen overlay
     * @default false
     */
    fullScreen?: boolean;
    /**
     * Custom message to display below the loader
     */
    message?: string;
    /**
     * Custom className for the container
     */
    className?: string;
}

const Loader: React.FC<LoaderProps> = ({
    size = "md",
    variant = "spinner",
    fullScreen = false,
    message,
    className = "",
}) => {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    const spinnerSizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-[3px]",
        lg: "w-12 h-12 border-4",
    };

    const dotSizeClasses = {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-3 h-3",
    };

    const messageSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    const renderSpinner = () => (
        <div
            className={`${spinnerSizeClasses[size]} border-gray-200 border-t-primary rounded-full animate-spin`}
        />
    );

    const renderDots = () => (
        <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map((index) => (
                <div
                    key={index}
                    className={`${dotSizeClasses[size]} bg-primary rounded-full animate-pulse`}
                    style={{
                        animationDelay: `${index * 0.2}s`,
                        animationDuration: "1s",
                    }}
                />
            ))}
        </div>
    );

    const renderPulse = () => (
        <div
            className={`${sizeClasses[size]} bg-primary rounded-full animate-ping opacity-75`}
        />
    );

    const renderLoader = () => {
        switch (variant) {
            case "dots":
                return renderDots();
            case "pulse":
                return renderPulse();
            default:
                return renderSpinner();
        }
    };

    const content = (
        <div
            className={`flex flex-col items-center justify-center gap-3 ${className}`}
        >
            {renderLoader()}
            {message && (
                <p
                    className={`text-gray-600 font-medium ${messageSizeClasses[size]}`}
                >
                    {message}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return content;
};

export default Loader;

