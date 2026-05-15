"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useDeleteUser, useUpdateUserRole, useUsers } from "@/hooks/useUsers";
import type { AppUser } from "@/schemas";
import { Shield, Trash2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

const ROLE_BADGE: Record<string, string> = {
  Admin:
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[rgba(214,106,6,0.12)] text-[#d66a06] dark:bg-[rgba(214,106,6,0.18)]",
  Viewer:
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[rgba(59,130,246,0.12)] text-[#3b82f6] dark:bg-[rgba(59,130,246,0.18)]",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function UserRow({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const handleRoleChange = (role: "Admin" | "Viewer") => {
    if (role === user.role) return;
    updateRole.mutate({ id: user.id, role });
  };

  const handleDelete = () => {
    deleteUser.mutate(user.id, { onSuccess: () => setConfirmDelete(false) });
  };

  return (
    <tr className="hover:bg-secondary/50">
      <td className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
            {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{user.name || "-"}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 border-b border-border">
        <span className={ROLE_BADGE[user.role]}>
          {user.role === "Admin" ? <Shield size={11} /> : <User size={11} />}
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3 border-b border-border text-xs text-muted-foreground">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {!isSelf && (
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value as "Admin" | "Viewer")}
              disabled={updateRole.isPending}
              className="border border-border rounded-md px-2 py-1 text-xs bg-background text-foreground focus:outline-none focus:border-[#d66a06] cursor-pointer disabled:opacity-50"
            >
              <option value="Viewer">Viewer</option>
              <option value="Admin">Admin</option>
            </select>
          )}
          {isSelf && (
            <span className="text-xs text-muted-foreground italic">You</span>
          )}
          {!isSelf && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete user"
            >
              <Trash2 size={13} />
            </button>
          )}
          {!isSelf && confirmDelete && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-destructive font-medium">Confirm?</span>
              <button
                onClick={handleDelete}
                disabled={deleteUser.isPending}
                className="px-2 py-1 rounded text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteUser.isPending ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded text-xs font-semibold border border-border hover:bg-secondary"
              >
                No
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const selfEmail = session?.user?.email ?? "";
  const { data: users, isLoading, error } = useUsers();

  return (
    <div className="space-y-6 pt-6">
      <PageHeader
        title="User Management"
        description="Manage user accounts and roles."
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading users…</div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load users"}
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 px-4 py-3 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground bg-secondary border-b border-border">
                      User
                    </th>
                    <th className="sticky top-0 px-4 py-3 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground bg-secondary border-b border-border">
                      Role
                    </th>
                    <th className="sticky top-0 px-4 py-3 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground bg-secondary border-b border-border">
                      Member Since
                    </th>
                    <th className="sticky top-0 px-4 py-3 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground bg-secondary border-b border-border">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.email.toLowerCase() === selfEmail.toLowerCase()}
                    />
                  ))}
                </tbody>
              </table>
              {(users ?? []).length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No users found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
