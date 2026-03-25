"use client";
import React, { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Image from "next/image";
import { MdEdit } from "react-icons/md";
import { useAuthStore } from "@/store/useStore";
// Define the type for User
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: Array<{ totalAmount: number; status: string }>; // Define order structure
  role: "ADMIN" | "VENDOR" | "USER" | "DRIVER";
  status: "Active" | "Inactive";
  totalSpent: number;
  createdAt: string;
  approvalStatus: "APPROVED" | "REJECTED" | "PENDING" | null;
}

const PAGE_SIZE = 10;

const UsersPage = () => {
  const { user } = useAuthStore((state) => state);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [accessChecked, setAccessChecked] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Users");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newApprovalStatus, setNewApprovalStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch real user data from the API with pagination
  const fetchUsers = async (pageToFetch: number = 1): Promise<void> => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        // Handle both paginated and non-paginated responses
        const usersData: User[] = Array.isArray(result)
          ? result
          : result?.data ?? [];
        setUsers(usersData);
        setFilteredUsers(usersData); // Initially, show all users

        if (result?.meta) {
          setTotalUsers(result.meta.total ?? 0);
          setTotalPages(result.meta.totalPages ?? 1);
        } else {
          setTotalUsers(usersData.length);
          setTotalPages(1);
        }
      } else {
        console.error("Error fetching users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setAccessChecked(true);
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  // Users page is only for SUPER_ADMIN
  if (accessChecked && !isSuperAdmin) {
    notFound();
  }

  // Filter users based on search query and status filter
  useEffect(() => {
    let filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by status (Active/Inactive)
    if (statusFilter !== "All Users") {
      filtered = filtered.filter((user) => {
        if (statusFilter === "Active") {
          return user.orders && user.orders.length > 0; // Active users have at least one order
        }
        if (statusFilter === "Inactive") {
          return !user.orders || user.orders.length === 0; // Inactive users have no orders
        }
        return true;
      });
    }

    setFilteredUsers(filtered);
  }, [searchQuery, statusFilter, users]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleEditApprovalStatus = (user: User): void => {
    setSelectedUser(user);
    setNewApprovalStatus(user.approvalStatus || "");
    setShowEditModal(true);
  };

  const confirmEditApprovalStatus = async (): Promise<void> => {
    if (!selectedUser) return;

    const approvalStatus =
      newApprovalStatus === ""
        ? null
        : (newApprovalStatus as "APPROVED" | "REJECTED" | "PENDING");

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ id: selectedUser.id, approvalStatus }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Refresh the current page to get updated data
        await fetchUsers(page);
        setShowEditModal(false);
        setSelectedUser(null);
        setNewApprovalStatus("");
      } else {
        console.error("Error updating approval status");
      }
    } catch (error) {
      console.error("Error changing approval status:", error);
    }
  };

  // Calculate total orders and total revenue
  const totalOrders: number = users.reduce(
    (acc, user) => acc + user.orders.length,
    0
  ); // Assuming 'orders' is an array
  const totalRevenue: number = users.reduce(
    (acc, user) => acc + user.totalSpent,
    0
  ); // Assuming 'totalSpent' is a number
  const activeUsers: number = users.filter(
    (u) => u.orders && u.orders.length > 0
  ).length;

  return (
    <DashboardLayout>
      {/* Edit Approval Status Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Approval Status</h3>
            <p className="mb-4">
              Editing approval status for user {selectedUser.name}
            </p>
            <select
              value={newApprovalStatus}
              onChange={(e) => setNewApprovalStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            >
              <option value="">N/A</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="PENDING">PENDING</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setNewApprovalStatus("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={confirmEditApprovalStatus}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border-gray-300"
            >
              <option>All Users</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold">{totalUsers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
            <p className="text-2xl font-semibold">{activeUsers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-semibold">{totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-semibold">
              Rs. {totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            className="h-10 w-10 rounded-full"
                            src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt=""
                            width={10}
                            height={10}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-900">
                            {user.createdAt
                              ? `Joined: ${new Date(
                                  user.createdAt
                                ).toLocaleDateString()}`
                              : "Join date: N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.orders.length} Orders
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-white rounded ${
                          user.role === "ADMIN"
                            ? "bg-red-500"
                            : user.role === "VENDOR"
                            ? "bg-blue-500"
                            : user.role === "DRIVER"
                            ? "bg-purple-500"
                            : "bg-green-500"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-white rounded ${
                          user.approvalStatus === "APPROVED"
                            ? "bg-green-500"
                            : user.approvalStatus === "REJECTED"
                            ? "bg-red-500"
                            : user.approvalStatus === "PENDING"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {user.approvalStatus || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rs. {user.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {(user.role === "DRIVER" || user.role === "VENDOR") && (
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => handleEditApprovalStatus(user)}
                            title="Edit Approval Status"
                          >
                            <MdEdit className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <p className="text-sm text-gray-600">
            Showing {totalUsers === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {totalUsers === 0 ? 0 : Math.min(page * PAGE_SIZE, totalUsers)} of{" "}
            {totalUsers} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || isLoading}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
