// components/Loading.tsx
import React from 'react';
import { useTranslations } from 'next-intl';

const Loading: React.FC = () => {
  const t = useTranslations('common');
  return (
    <div className="flex justify-center items-center min-h-screen  w-full">
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 w-full h-full animate-spin rounded-full border-4 border-t-4 border-gray-300 border-t-blue-50"></div>
        <div className="absolute inset-0 flex justify-center items-center text-xl text-primary font-semibold">
          {t('loading')}
        </div>
      </div>
    </div>
  );
};

export default Loading;
