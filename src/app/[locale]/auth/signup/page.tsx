
import { Suspense } from 'react';
import { cookies } from "next/headers";
import SignUpClient from "./SignUpClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SignUpPage() {
  cookies(); // Absolute trigger for dynamic rendering

  return (
    <Suspense fallback={<div>Loading signup form...</div>}>
      <SignUpClient />
    </Suspense>
  );
}
