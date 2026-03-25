import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import RestaurantDetails from './RestaurantDetails';
import { getRestaurant } from '@/app/actions/restaurants';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function RestaurantPage({ params }: Props) {
  const { id } = await params
  const { restaurant, error } = await getRestaurant(id);

  if (error || !restaurant) {
    notFound();
  }

  return (
    <div className=" mx-auto py-8 ">
      <Suspense fallback={<div>Loading restaurant details...</div>}>
        <RestaurantDetails initialData={restaurant} />
      </Suspense>
    </div>
  );
}
