import { cookies } from "next/headers";
import LoginClient from "./LoginClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage() {
  await cookies(); // Absolute trigger for dynamic rendering
  return <LoginClient />;
}
