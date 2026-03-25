"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  RocketLaunchIcon,
  ShoppingCartIcon,
  RectangleStackIcon,
  Cog6ToothIcon,
  PlayCircleIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

// User guide content is always in English
const HELP_CENTER_EN = {
  title: "Vendor User Guide",
  subtitle: "Learn how to manage your restaurant, menu, and orders on the platform",
  searchPlaceholder: "Search help topics...",
  quickStart: "Quick Start",
  gettingStarted: "Getting Started",
  gettingStartedDesc: "Set up your account and complete your restaurant profile to start receiving orders.",
  managingOrders: "Managing Orders",
  managingOrdersDesc: "View, accept, reject, and update the status of incoming orders.",
  managingMenu: "Managing Menu",
  managingMenuDesc: "Add, edit, and organize menu items and upload food images.",
  pos: "Point of Sale (POS)",
  posDesc: "Handle in-store orders, payments, receipts, and cash shifts.",
  restaurantSettings: "Restaurant Settings",
  restaurantSettingsDesc: "Update restaurant details, opening hours, and delivery options.",
  viewDetails: "View details",
  stepByStepGuide: "Step-by-Step Guide",
  sectionGettingStarted: "Getting Started",
  sectionManagingOrders: "Managing Orders",
  sectionManagingMenu: "Managing Menu",
  sectionPos: "Point of Sale (POS)",
  sectionRestaurantSettings: "Restaurant Settings",
  step1Login: "How to login",
  step1LoginDesc: "Go to the login page and enter your email and password. Click Sign in to access your vendor dashboard.",
  step2Profile: "How to complete restaurant profile",
  step2ProfileDesc: "Navigate to Restaurants from the sidebar, then add or edit your restaurant. Fill in name, address, opening hours, and contact details.",
  step3ViewOrders: "Viewing new orders",
  step3ViewOrdersDesc: "Open the Orders page from the sidebar. New orders appear at the top with Pending status.",
  step4AcceptReject: "Accepting or rejecting orders",
  step4AcceptRejectDesc: "Click an order to view details. Use the status dropdown to set Confirmed (accept) or Cancelled (reject).",
  step5UpdateStatus: "Updating order status",
  step5UpdateStatusDesc: "As you prepare the order, update status: Preparing → Ready for Pickup → and the driver will mark Pickup/Delivery.",
  step6AddItem: "Adding menu items",
  step6AddItemDesc: "Go to Restaurants, select your restaurant, then click Add menu item. Enter name, price, category, and description.",
  step7EditItem: "Editing menu items",
  step7EditItemDesc: "In your restaurant's menu list, click Edit on an item to change name, price, or availability.",
  step8UploadImage: "Uploading food images",
  step8UploadImageDesc: "When adding or editing a menu item, use the image upload field to add a photo. Supported formats: JPG, PNG, WebP.",
  step9RestaurantDetails: "Updating restaurant details",
  step9RestaurantDetailsDesc: "In Restaurants, click your restaurant and edit the fields you want to change.",
  step10OpeningHours: "Setting opening hours",
  step10OpeningHoursDesc: "In the restaurant form, set opening and closing times for each day. Save to apply changes.",
  posStep1OpenShift: "Opening a POS shift",
  posStep1OpenShiftDesc: "From the POS page, open your cash drawer shift by entering the opening balance. This will track all cash movements for the shift.",
  posStep2TakePayment: "Taking customer payments",
  posStep2TakePaymentDesc: "Use the payment dialog to select a payment method (cash, card, or digital) and confirm the received amount. The system calculates change automatically for cash payments.",
  posStep3PrintReceipt: "Printing receipts & closing shift",
  posStep3PrintReceiptDesc: "After completing an order, view the receipt to review items and totals, print it for the customer if needed, and at the end of the day close the shift by counting the drawer and confirming the final cash amount.",
  videoTutorials: "Video Tutorials",
  videoTutorialsDesc: "Watch short videos to learn key features.",
  comingSoon: "Coming soon",
  helpSupport: "Help & Support",
  helpSupportDesc: "Can't find what you need? Our team is here to help.",
  contactSupport: "Contact Support",
  emailSupport: "Email support",
  faqLink: "FAQ",
} as const;

const GUIDE_IMAGES = {
  login: "/images/vendor-guide/login.png",
  orders: "/images/vendor-guide/orders.png",
  acceptRejectOrder: "/images/vendor-guide/accept-or-reject-order.png",
  addMenuItem: "/images/vendor-guide/add-menu-item.png",
  editMenuItem: "/images/vendor-guide/edit-menu-item.png",
  createRestaurant: "/images/vendor-guide/create-restaurant.png",
  editRestaurant: "/images/vendor-guide/edit-restaurant.png",
  posShift: "/images/vendor-guide/pos-shift.png",
  posPayment: "/images/vendor-guide/pos-payment.png",
  posReceipt: "/images/vendor-guide/pos-receipt.png",
} as const;

function GuideImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm">
        Screenshot placeholder  
      </div>
    );
  }
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

export default function HelpCenterPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");
  const t = HELP_CENTER_EN;

  const quickStartCards = useMemo(
    () => [
      {
        id: "getting-started",
        title: HELP_CENTER_EN.gettingStarted,
        description: HELP_CENTER_EN.gettingStartedDesc,
        icon: RocketLaunchIcon,
        href: "#getting-started",
        color: "bg-indigo-50 text-indigo-600",
      },
      {
        id: "managing-orders",
        title: HELP_CENTER_EN.managingOrders,
        description: HELP_CENTER_EN.managingOrdersDesc,
        icon: ShoppingCartIcon,
        href: "#managing-orders",
        color: "bg-emerald-50 text-emerald-600",
      },
      {
        id: "managing-menu",
        title: HELP_CENTER_EN.managingMenu,
        description: HELP_CENTER_EN.managingMenuDesc,
        icon: RectangleStackIcon,
        href: "#managing-menu",
        color: "bg-amber-50 text-amber-600",
      },
      // {
      //   id: "pos",
      //   title: HELP_CENTER_EN.pos,
      //   description: HELP_CENTER_EN.posDesc,
      //   icon: BanknotesIcon,
      //   href: "#pos",
      //   color: "bg-emerald-50 text-emerald-700",
      // },
      {
        id: "restaurant-settings",
        title: HELP_CENTER_EN.restaurantSettings,
        description: HELP_CENTER_EN.restaurantSettingsDesc,
        icon: Cog6ToothIcon,
        href: "#restaurant-settings",
        color: "bg-sky-50 text-sky-600",
      },
    ],
    []
  );

  const scrollToSection = (id: string) => {
    setExpandedSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-2 text-gray-600">{t.subtitle}</p>
          {/* <div className="mt-4 relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div> */}
        </div>

        {/* Quick Start Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.quickStart}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStartCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color} mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{card.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{card.description}</p>
                  <Link
                    href={card.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(card.id);
                    }}
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {t.viewDetails}
                    <ChevronDownIcon className="ml-0.5 h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step-by-Step Guide */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.stepByStepGuide}</h2>

          {/* Getting Started */}
          <article
            id="getting-started"
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"
          >
            <button
              onClick={() => setExpandedSection((s) => (s === "getting-started" ? null : "getting-started"))}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">{t.sectionGettingStarted}</h3>
              {expandedSection === "getting-started" ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSection === "getting-started" && (
              <div className="px-5 pb-5 space-y-6 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-900">Step 1: {t.step1Login}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step1LoginDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.login} alt="Login page" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 2: {t.step2Profile}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step2ProfileDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.createRestaurant} alt="Restaurant profile" />
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* Managing Orders */}
          <article
            id="managing-orders"
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"
          >
            <button
              onClick={() => setExpandedSection((s) => (s === "managing-orders" ? null : "managing-orders"))}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">{t.sectionManagingOrders}</h3>
              {expandedSection === "managing-orders" ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSection === "managing-orders" && (
              <div className="px-5 pb-5 space-y-6 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-900">Step 1: {t.step3ViewOrders}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step3ViewOrdersDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.orders} alt="Orders page" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 2: {t.step4AcceptReject}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step4AcceptRejectDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.acceptRejectOrder} alt="Accept or reject order" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 3: {t.step5UpdateStatus}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step5UpdateStatusDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.acceptRejectOrder} alt="Update order status" />
                  </div>
                </div>
              </div>
            )}
          </article>


           {/* Restaurant Settings */}
           <article
            id="restaurant-settings"
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"
          >
            <button
              onClick={() =>
                setExpandedSection((s) => (s === "restaurant-settings" ? null : "restaurant-settings"))
              }
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">{t.sectionRestaurantSettings}</h3>
              {expandedSection === "restaurant-settings" ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSection === "restaurant-settings" && (
              <div className="px-5 pb-5 space-y-6 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-900">Step 1: {t.step9RestaurantDetails}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step9RestaurantDetailsDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.editRestaurant} alt="Restaurant details" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 2: {t.step10OpeningHours}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step10OpeningHoursDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.editRestaurant} alt="Opening hours" />
                  </div>
                </div>
              </div>
            )}
          </article>
          
          {/* Managing Menu */}
          <article
            id="managing-menu"
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"
          >
            <button
              onClick={() => setExpandedSection((s) => (s === "managing-menu" ? null : "managing-menu"))}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">{t.sectionManagingMenu}</h3>
              {expandedSection === "managing-menu" ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSection === "managing-menu" && (
              <div className="px-5 pb-5 space-y-6 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-900">Step 1: {t.step6AddItem}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step6AddItemDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.addMenuItem} alt="Add menu item" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 2: {t.step7EditItem}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step7EditItemDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.editMenuItem} alt="Edit menu item" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 3: {t.step8UploadImage}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.step8UploadImageDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.editMenuItem} alt="Upload food image" />
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* POS / Point of Sale */}
          {/* <article
            id="pos"
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"
          >
            <button
              onClick={() => setExpandedSection((s) => (s === "pos" ? null : "pos"))}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">{t.sectionPos}</h3>
              {expandedSection === "pos" ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSection === "pos" && (
              <div className="px-5 pb-5 space-y-6 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-900">Step 1: {t.posStep1OpenShift}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.posStep1OpenShiftDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.posShift} alt="Open POS shift and set opening balance" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 2: {t.posStep2TakePayment}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.posStep2TakePaymentDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.posPayment} alt="POS payment screen with payment methods" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Step 3: {t.posStep3PrintReceipt}</h4>
                  <p className="mt-1 text-gray-600 text-sm">{t.posStep3PrintReceiptDesc}</p>
                  <div className="mt-3">
                    <GuideImage src={GUIDE_IMAGES.posReceipt} alt="Receipt preview and print view" />
                  </div>
                </div>
              </div>
            )}
          </article> */}

         
        </section>

        {/* Video Tutorials */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.videoTutorials}</h2>
          <p className="text-gray-600 text-sm mb-4">{t.videoTutorialsDesc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <PlayCircleIcon className="h-16 w-16 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">{t.comingSoon}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Help & Support */}
        <section>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <QuestionMarkCircleIcon className="h-7 w-7 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t.helpSupport}</h2>
                <p className="mt-1 text-gray-600 text-sm">{t.helpSupportDesc}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="mailto:support@fiestaa.com"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    {t.contactSupport}
                  </a>
                  <span className="inline-flex items-center text-sm text-gray-600">
                    {t.emailSupport}: support@fiestaa.com
                  </span>
                  <Link
                    href="#"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {t.faqLink}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
