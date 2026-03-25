'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ placeholder, onSearch }: SearchBarProps) {
  const t = useTranslations('common');
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className="relative w-full  ">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder || t('searchPlaceholder')}
        className="w-full py-3 pl-12 pr-4 border rounded-full focus:outline-none focus:ring-0 focus:border-primary border-gray-300 text-gray-800 shadow-sm"
      />
      <MagnifyingGlassIcon className="absolute  left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
    </div>
  );
}
