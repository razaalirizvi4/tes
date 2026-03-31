import { Suspense } from 'react';
import RestaurantList from './RestaurantList';
import { getRestaurants } from '@/app/actions/restaurants';
import RestaurantListBreadcrumb from '@/components/RestaurantListBreadcrumb';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';


export default async function RestaurantsPage() {
  const { restaurants, error } = await getRestaurants();
  const t = await getTranslations("restaurant");


  console.log(restaurants, "restaurents")

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">{t('error')}</div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-10 py-8 mt-16">
      <RestaurantListBreadcrumb />
      <h1 className="text-3xl leading-tight md:text-4xl lg:text-4xl font-semibold  text-gray-800 text-start ">
        {t('nearYou')}
      </h1>
      <Suspense fallback={<div className=' flex justify-center items-center font-medium text-xl'>{t('loadingRestaurants')}</div>}>
        <RestaurantList initialData={restaurants} />
      </Suspense>
    </div>
  );
}
