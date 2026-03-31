import { Suspense } from 'react';
import { getRestaurants } from '@/app/actions/restaurants';
import RestaurantListBreadcrumb from '@/components/RestaurantListBreadcrumb';
import { getTranslations } from 'next-intl/server';
import RestaurantList from '../../restaurants/RestaurantList';
import Breadcrumb from '@/components/Breadcrumb';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    locale: string;
    type: string;
  }>;
}

export default async function StoreTypePage({ params }: Props) {
  const { type, locale } = await params;
  const storeType = type.toUpperCase();
  const { restaurants, error } = await getRestaurants(storeType);
  const t = await getTranslations("restaurant");
  const tCommon = await getTranslations("common");

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">{t('error')}</div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: tCommon("home"), href: "/" },
    { label: tCommon(`storeTypes.${storeType}`) || storeType },
  ];

  return (
    <div className="container mx-auto px-10 py-8 mt-16">
      <div className="mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <h1 className="text-3xl leading-tight md:text-4xl lg:text-4xl font-semibold text-gray-800 text-start uppercase">
        {tCommon(`storeTypes.${storeType}`) || storeType} {tCommon('nearYou') || 'Near You'}
      </h1>
      <Suspense fallback={<div className='flex justify-center items-center font-medium text-xl'>{t('loadingRestaurants')}</div>}>
        <RestaurantList initialData={restaurants} />
      </Suspense>
    </div>
  );
}
