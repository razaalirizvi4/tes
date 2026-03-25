import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import DriverList from "./DriverList";
import { Driver } from "@/types";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DriversPage() {
  const authUser = await getUser();
  if (!authUser?.email) notFound();
  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { role: true },
  });
  if (dbUser?.role !== "SUPER_ADMIN") notFound();

  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
      stats: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Driver Management</h1>
        <Link
          href="/dashboard/drivers/new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600"
        >
          Add New Driver
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Drivers</h3>
          <p className="text-2xl font-semibold">{drivers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Active Drivers</h3>
          <p className="text-2xl font-semibold">
            {drivers.filter(d => d.status === 'ONLINE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Average Rating</h3>
          <p className="text-2xl font-semibold">
            {drivers.reduce((acc, d) => acc + (d.rating || 0), 0) / drivers.length || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DriverList initialDrivers={drivers as Driver[]} />
      </div>
    </div>
  );
}
