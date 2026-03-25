"use client";

import Link from "next/link";
import { HiChevronRight } from "react-icons/hi";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-x-2">
          {index > 0 && (
            <HiChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-primary transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="whitespace-nowrap">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

