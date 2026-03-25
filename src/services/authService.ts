import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/useStore";
import { UserData } from "@/types/user";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@prisma/client";

export interface AuthUser extends UserData {
  session?: {
    access_token: string;
    refresh_token: string;
  };
}

const AUTH_STORAGE_KEY = "auth-storage";

interface SignUpData {
  email: string;
  phone?: string;
  password: string;
  name: string;
  role: UserRole;
  businessName?: string;
  vehicleType?: string;
  documents?: File | null;
}

class AuthService {
  async signUp(data: SignUpData) {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("phone", data.phone || "");
      formData.append("password", data.password);
      formData.append("name", data.name);
      formData.append("role", data.role);

      if (data.businessName) {
        formData.append("businessName", data.businessName);
      }

      if (data.vehicleType) {
        formData.append("vehicleType", data.vehicleType);
      }

      if (data.documents) {
        formData.append("documents", data.documents);
      }

      const response = await axios.post("/api/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log(response, "signupresponse");

      if (response.data) {
        return { data: response.data, message: response.data.data.message };
      }

      return { error: "Unexpected error occurred during signup." };
    } catch (error) {
      if (error instanceof AxiosError) {
        return { error: error.response?.data?.error || error.message };
      } else {
        return { error: "An unexpected error occurred" };
      }
    }
  }

  async signIn(email: string, password: string) {
    try {
      const response = await axios.post("/api/login", { email, password });

      // Check if email verification is required
      if (response.data?.requiresEmailVerification) {
        // Store email for the verification page
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingVerificationEmail", email);
        }
        return {
          error: response.data?.error || "Email verification required",
          requiresEmailVerification: true,
          email: response.data?.email || email,
        };
      }

      if (response.data?.data) {
        const { user } = response.data.data;
        console.log(user, "AUthuser");

        if (!user) {
          return { error: "Please verify your email before logging in." };
        }

        // Only store the user data in the auth store (no token – Supabase is source of truth)
        useAuthStore.getState().setUser(user);
        return { data: response.data, message: "Login successful!" };
      }

      return { error: "Invalid response from server" };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        // Check if it's an email verification error
        if (errorData?.requiresEmailVerification) {
          const email =
            errorData?.email ||
            (error.config?.data ? JSON.parse(error.config.data).email : "");
          if (typeof window !== "undefined" && email) {
            localStorage.setItem("pendingVerificationEmail", email);
          }
          return {
            error: errorData?.error || "Email verification required",
            requiresEmailVerification: true,
            email: email,
          };
        }
        return { error: errorData?.error || error.message };
      } else {
        return { error: "An unexpected error occurred" };
      }
    }
  }

  getCurrentUser() {
    return useAuthStore.getState().user;
  }

  /** Get current session from Supabase (single source of truth). Use this when a token is needed. */
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /** Get access token from Supabase session. Do not read from localStorage. */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token ?? null;
  }

  async updateUserProfile(userId: string, data: Partial<UserData>) {
    try {
      const response = await axios.put(`/api/users/${userId}`, data);

      // Update auth store
      useAuthStore.getState().updateProfile(response.data);

      return response.data;
    } catch (error) {
      console.error("Failed to update user profile:", error);
      throw new Error("Failed to update user profile");
    }
  }

  async getUserAddresses(userId: string) {
    try {
      const response = await axios.get(`/api/users/${userId}/addresses`);
      return response.data;
    } catch {
      throw new Error("Failed to fetch user addresses");
    }
  }

  async signOut() {
    try {
      // 1. Sign out from Supabase (removes sb-*-auth-token from localStorage)
      await supabase.auth.signOut();

      // 2. Clear Zustand auth state and its persisted storage so rehydration doesn't restore user
      useAuthStore.getState().clearUser();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      useAuthStore.persist.clearStorage();

      // 3. Redirect (full navigation to avoid stale client state)
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Sign out error:", error);
      useAuthStore.getState().clearUser();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      useAuthStore.persist.clearStorage();
      window.location.href = "/auth/login";
    }
  }

  async refreshProfile(userId: string) {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      if (response.data) {
        useAuthStore.getState().updateProfile(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  }

  async forgotPassword(email: string) {
    try {
      const response = await axios.post("/api/forgot-password", { email });

      if (response.data?.error) {
        return {
          error: response.data.error,
          isGoogleSSO: response.data.isGoogleSSO || false,
        };
      }

      return {
        message:
          response.data?.message ||
          "Password reset link has been sent to your email.",
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        return {
          error: errorData?.error || error.message,
          isGoogleSSO: errorData?.isGoogleSSO || false,
        };
      } else {
        return { error: "An unexpected error occurred" };
      }
    }
  }

  async validateResetToken(token: string) {
    try {
      const response = await axios.get(`/api/reset-password?token=${token}`);

      if (response.data?.valid === false) {
        return { error: response.data?.error || "Invalid or expired token." };
      }

      return { valid: true };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          error: error.response?.data?.error || "Failed to validate token.",
        };
      } else {
        return { error: "An unexpected error occurred" };
      }
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const response = await axios.post("/api/reset-password", {
        token,
        newPassword,
      });

      if (response.data?.error) {
        return { error: response.data.error };
      }

      return {
        message:
          response.data?.message ||
          "Your password has been reset successfully.",
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return { error: error.response?.data?.error || error.message };
      } else {
        return { error: "An unexpected error occurred" };
      }
    }
  }
}

export const authService = new AuthService();
