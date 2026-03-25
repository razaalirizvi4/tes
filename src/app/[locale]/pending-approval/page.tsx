'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { UserData, UserRole } from '@/types/user';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser() as UserData | null;
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    if (currentUser.approvalStatus === 'APPROVED') {
      // Redirect based on role
      const redirectMap: Record<UserRole, string> = {
        [UserRole.VENDOR]: '/dashboard/restaurants',
        [UserRole.DRIVER]: '/dashboard/deliveries',
        [UserRole.CUSTOMER]: '/restaurants',
        [UserRole.ADMIN]: '/dashboard',
        [UserRole.SUPER_ADMIN]: '/dashboard'
      };
      router.push(redirectMap[currentUser.role]);
      return;
    }

    setUser(currentUser);
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Application Under Review</h2>
          
          <div className="mt-8">
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Pending Approval
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your application as a {user.role?.toLowerCase()} is currently under review.
                      This usually takes 1-2 business days. We will notify you via email once your account is approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">What happens next?</h3>
            <div className="mt-4 space-y-4 text-sm text-gray-600 text-left">
              {user.role === 'VENDOR' ? (
                <>
                  <p>1. Our team will verify your business documents</p>
                  <p>2. We may contact you for additional information</p>
                  <p>3. Once approved, you can start listing your restaurant and menu items</p>
                </>
              ) : (
                <>
                  <p>1. Our team will verify your driver&apos;s license</p>
                  <p>2. We may contact you for additional information</p>
                  <p>3. Once approved, you can start accepting delivery requests</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => authService.signOut()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}