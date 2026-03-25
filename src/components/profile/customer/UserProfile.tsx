"use client";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useStore";
import { UserData } from "@/types/user";
import toast from "react-hot-toast";
import { CgProfile } from "react-icons/cg";
import { useTranslations } from "next-intl";

interface CustomerProfileProps {
  user: UserData;
  userRole: string;
}
export default function UserProfile({ userRole }: CustomerProfileProps) {
  const { updateProfile, refreshProfile, user } = useAuthStore(); // Get auth functions
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tMessages = useTranslations("messages");
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    updateProfile({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          email: user?.email,
          phoneNumber: user?.phoneNumber,
        }),
      });

      if (!response.ok) throw new Error(tMessages("profileUpdateError"));

      const updatedUser = await response.json();



      updateProfile(updatedUser); // Update Zustand store
      refreshProfile(); // Refresh store data
      const { data, error } = await supabase.auth.updateUser({ email: updatedUser.email })
      console.log(data, error, "data")
      toast.success(tMessages("profileUpdated"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(tMessages("profileUpdateError"));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 mb-10 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4 text-primary">
        {tCommon("userProfile")}
      </h2>

      <div className="flex items-center text-base md:text-lg justify-start gap-2  w-fit flex-center text-start text-primary ">
        <CgProfile />
        <span className=" text-center  font-medium rounded-full capitalize">
          {userRole?.toLowerCase()}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Full Name */}
        <div>
          <label className="block font-semibold mb-1">{tAuth("name")}</label>
          <input
            type="text"
            name="name"
            value={user?.name || ""}
            // onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            readOnly
          />
        </div>

        {/* Gender */}
        {/* <div>
          <label className="block font-semibold">Gender</label>
          <select
            name="gender"
            value={form.gender || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div> */}

        {/* Phone Number */}
        <div>
          <label className="block font-semibold mb-1">{tAuth("phoneNumber")}</label>
          <input
            type="tel"
            name="phoneNumber"
            value={user?.phoneNumber || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-semibold mb-1">{tAuth("email")}</label>
          <input
            type="email"
            disabled
            name="email"
            value={user?.email || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded italic"
            required
          />
        </div>

        {/* Update Button */}
        <button
          type="submit"
          className="w-full bg-primary text-white p-2 rounded hover:bg-primary-600"
        >
          {tCommon("updateProfile")}
        </button>
      </form>
    </div>
  );
}
