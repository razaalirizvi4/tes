"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthStore } from "@/store/useStore";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BellIcon,
  GlobeAltIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { getAllCurrencies } from "@/constants/currency";

const SettingsPage = () => {
  const { user } = useAuthStore((state) => state);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    // General Settings
    appName: "FoodApp",
    appLogo: "",
    defaultCurrency: "USD",
    timezone: "UTC",
    language: "en",
    maintenanceMode: false,
    restaurantRadius: "10", // Restaurant search radius in km

    // System Settings
    maxFileUploadSize: "10",
    sessionTimeout: "30",
    enableApiRateLimit: true,
    apiRateLimit: "1000",
    enableCaching: true,
    cacheExpiry: "3600",

    // Payment Settings
    paymentGateway: "stripe",
    stripePublicKey: "",
    stripeSecretKey: "",
    paypalClientId: "",
    paypalSecret: "",
    enableCod: true,
    transactionFee: "2.5",

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    systemNotifications: true,

    // Security Settings
    requireTwoFactor: false,
    passwordMinLength: "8",
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    sessionMaxAge: "7",
    enableIpWhitelist: false,

    // Integration Settings
    googleMapsApiKey: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    awsAccessKey: "",
    awsSecretKey: "",
  });

  // Fetch settings on mount and when component becomes visible
  useEffect(() => {
    if (!isSuperAdmin) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/settings", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        if (response.ok) {
          const result = await response.json();
          console.log("Fetched settings:", result);
          if (result.success && result.data) {
            // Ensure restaurantRadius is properly converted to string
            const radiusValue = result.data.restaurantRadius;
            const radiusString =
              radiusValue != null ? String(radiusValue) : "10";

            console.log(
              "Setting restaurantRadius to:",
              radiusString,
              "from:",
              radiusValue
            );

            setSettings((prev) => ({
              ...prev,
              ...result.data,
              restaurantRadius: radiusString,
            }));
          }
        } else {
          console.error(
            "Failed to fetch settings:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [isSuperAdmin]);

  const handleInputChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log("Saving settings:", settings);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      console.log("Save response:", result);

      if (response.ok && result.success) {
        alert("Settings saved successfully!");
        // Refresh settings from server to ensure UI is in sync
        const refreshResponse = await fetch("/api/settings", {
          cache: "no-store",
        });
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          console.log("Refreshed settings after save:", refreshResult);
          if (refreshResult.success && refreshResult.data) {
            // Ensure restaurantRadius is properly converted to string
            const radiusValue = refreshResult.data.restaurantRadius;
            const radiusString =
              radiusValue != null ? String(radiusValue) : "10";

            console.log(
              "Refreshing restaurantRadius to:",
              radiusString,
              "from:",
              radiusValue
            );

            setSettings((prev) => ({
              ...prev,
              ...refreshResult.data,
              restaurantRadius: radiusString,
            }));
          }
        }
      } else {
        const errorMsg =
          result.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error("Save failed:", errorMsg, result);
        alert(`Failed to save settings: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      alert(
        `Error saving settings: ${errorMsg}. Please check the console for details.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "general", name: "General", icon: Cog6ToothIcon },
    { id: "system", name: "System", icon: ServerIcon },
    { id: "payment", name: "Payment", icon: CreditCardIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
    { id: "integrations", name: "Integrations", icon: GlobeAltIcon },
  ];

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800">
              Access Denied
            </h2>
            <p className="text-red-600 mt-2">
              This page is only accessible to Super Administrators.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your application settings and configurations
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    General Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Name
                      </label>
                      <input
                        type="text"
                        value={settings.appName}
                        onChange={(e) =>
                          handleInputChange("appName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Currency
                      </label>
                      <select
                        value={settings.defaultCurrency}
                        onChange={(e) =>
                          handleInputChange("defaultCurrency", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {getAllCurrencies().map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} ({currency.symbol}) - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) =>
                          handleInputChange("timezone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">EST</option>
                        <option value="Europe/London">GMT</option>
                        <option value="Asia/Karachi">PKT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) =>
                          handleInputChange("language", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="ur">Urdu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Restaurant Search Radius (km)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="0.5"
                        value={settings.restaurantRadius}
                        onChange={(e) =>
                          handleInputChange("restaurantRadius", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="10"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Maximum distance (in kilometers) for restaurant search
                        results
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={settings.maintenanceMode}
                        onChange={(e) =>
                          handleInputChange("maintenanceMode", e.target.checked)
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="maintenanceMode"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable Maintenance Mode
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    System Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max File Upload Size (MB)
                      </label>
                      <input
                        type="number"
                        value={settings.maxFileUploadSize}
                        onChange={(e) =>
                          handleInputChange("maxFileUploadSize", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) =>
                          handleInputChange("sessionTimeout", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableApiRateLimit"
                        checked={settings.enableApiRateLimit}
                        onChange={(e) =>
                          handleInputChange(
                            "enableApiRateLimit",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="enableApiRateLimit"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable API Rate Limiting
                      </label>
                    </div>
                    {settings.enableApiRateLimit && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Rate Limit (requests per hour)
                        </label>
                        <input
                          type="number"
                          value={settings.apiRateLimit}
                          onChange={(e) =>
                            handleInputChange("apiRateLimit", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableCaching"
                        checked={settings.enableCaching}
                        onChange={(e) =>
                          handleInputChange("enableCaching", e.target.checked)
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="enableCaching"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable Caching
                      </label>
                    </div>
                    {settings.enableCaching && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cache Expiry (seconds)
                        </label>
                        <input
                          type="number"
                          value={settings.cacheExpiry}
                          onChange={(e) =>
                            handleInputChange("cacheExpiry", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === "payment" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Gateway
                      </label>
                      <select
                        value={settings.paymentGateway}
                        onChange={(e) =>
                          handleInputChange("paymentGateway", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="razorpay">Razorpay</option>
                      </select>
                    </div>
                    {settings.paymentGateway === "stripe" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stripe Public Key
                          </label>
                          <input
                            type="text"
                            value={settings.stripePublicKey}
                            onChange={(e) =>
                              handleInputChange(
                                "stripePublicKey",
                                e.target.value
                              )
                            }
                            placeholder="pk_test_..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stripe Secret Key
                          </label>
                          <input
                            type="password"
                            value={settings.stripeSecretKey}
                            onChange={(e) =>
                              handleInputChange(
                                "stripeSecretKey",
                                e.target.value
                              )
                            }
                            placeholder="sk_test_..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableCod"
                        checked={settings.enableCod}
                        onChange={(e) =>
                          handleInputChange("enableCod", e.target.checked)
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="enableCod"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable Cash on Delivery (COD)
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Fee (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.transactionFee}
                        onChange={(e) =>
                          handleInputChange("transactionFee", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Notification Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={(e) =>
                          handleInputChange(
                            "emailNotifications",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="emailNotifications"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable Email Notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="smsNotifications"
                        checked={settings.smsNotifications}
                        onChange={(e) =>
                          handleInputChange(
                            "smsNotifications",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="smsNotifications"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable SMS Notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="pushNotifications"
                        checked={settings.pushNotifications}
                        onChange={(e) =>
                          handleInputChange(
                            "pushNotifications",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="pushNotifications"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable Push Notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="orderNotifications"
                        checked={settings.orderNotifications}
                        onChange={(e) =>
                          handleInputChange(
                            "orderNotifications",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="orderNotifications"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Order Notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="systemNotifications"
                        checked={settings.systemNotifications}
                        onChange={(e) =>
                          handleInputChange(
                            "systemNotifications",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="systemNotifications"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        System Notifications
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Security Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requireTwoFactor"
                        checked={settings.requireTwoFactor}
                        onChange={(e) =>
                          handleInputChange(
                            "requireTwoFactor",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="requireTwoFactor"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Require Two-Factor Authentication
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Password Length
                      </label>
                      <input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) =>
                          handleInputChange("passwordMinLength", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="passwordRequireUppercase"
                        checked={settings.passwordRequireUppercase}
                        onChange={(e) =>
                          handleInputChange(
                            "passwordRequireUppercase",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="passwordRequireUppercase"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Require Uppercase Letters
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="passwordRequireNumbers"
                        checked={settings.passwordRequireNumbers}
                        onChange={(e) =>
                          handleInputChange(
                            "passwordRequireNumbers",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="passwordRequireNumbers"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Require Numbers
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="passwordRequireSpecial"
                        checked={settings.passwordRequireSpecial}
                        onChange={(e) =>
                          handleInputChange(
                            "passwordRequireSpecial",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="passwordRequireSpecial"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Require Special Characters
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Max Age (days)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionMaxAge}
                        onChange={(e) =>
                          handleInputChange("sessionMaxAge", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableIpWhitelist"
                        checked={settings.enableIpWhitelist}
                        onChange={(e) =>
                          handleInputChange(
                            "enableIpWhitelist",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="enableIpWhitelist"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Enable IP Whitelist
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integration Settings */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Integration Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Google Maps API Key
                      </label>
                      <input
                        type="text"
                        value={settings.googleMapsApiKey}
                        onChange={(e) =>
                          handleInputChange("googleMapsApiKey", e.target.value)
                        }
                        placeholder="AIza..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twilio Account SID
                      </label>
                      <input
                        type="text"
                        value={settings.twilioAccountSid}
                        onChange={(e) =>
                          handleInputChange("twilioAccountSid", e.target.value)
                        }
                        placeholder="AC..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twilio Auth Token
                      </label>
                      <input
                        type="password"
                        value={settings.twilioAuthToken}
                        onChange={(e) =>
                          handleInputChange("twilioAuthToken", e.target.value)
                        }
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AWS Access Key
                      </label>
                      <input
                        type="text"
                        value={settings.awsAccessKey}
                        onChange={(e) =>
                          handleInputChange("awsAccessKey", e.target.value)
                        }
                        placeholder="AKIA..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AWS Secret Key
                      </label>
                      <input
                        type="password"
                        value={settings.awsSecretKey}
                        onChange={(e) =>
                          handleInputChange("awsSecretKey", e.target.value)
                        }
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
