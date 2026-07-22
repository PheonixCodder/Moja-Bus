"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Building,
  UserCog,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { Card } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Badge } from "@moja/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

export function AdminUsersView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" });
  const [selectedRole, setSelectedRole] = useQueryState("role", { defaultValue: "" });
  const [currentPageParam, setCurrentPageParam] = useQueryState("page", parseAsInteger.withDefault(1));
  const currentPage = currentPageParam - 1; // 0-indexed internally
  const pageSize = 20;

  // Dialog State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [targetRole, setTargetRole] = useState<"TRAVELER" | "OPERATOR" | "ADMIN">("TRAVELER");

  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = useState(false);
  const [companyToManage, setCompanyToManage] = useState<any>(null);
  const [manageAction, setManageAction] = useState<"suspend" | "activate">("suspend");

  // Suspense Queries
  const { data: usersData } = useSuspenseQuery(
    trpc.admin.listUsers.queryOptions({
      search: searchQuery || undefined,
      role: selectedRole || undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    })
  );

  // Mutations
  const updateRoleMutation = useMutation(
    trpc.admin.updateUserRole.mutationOptions({
      onSuccess: () => {
        toast.success("User role updated successfully");
        setIsRoleModalOpen(false);
        queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update user role");
      },
    })
  );

  const suspendCompanyMutation = useMutation(
    trpc.admin.suspendCompany.mutationOptions({
      onSuccess: () => {
        toast.success("Operator company has been suspended");
        setIsSuspendConfirmOpen(false);
        queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to suspend company");
      },
    })
  );

  const activateCompanyMutation = useMutation(
    trpc.admin.activateCompany.mutationOptions({
      onSuccess: () => {
        toast.success("Operator company has been activated");
        setIsSuspendConfirmOpen(false);
        queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to activate company");
      },
    })
  );

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: targetRole,
    });
  };

  const handleManageCompany = () => {
    if (!companyToManage) return;
    if (manageAction === "suspend") {
      suspendCompanyMutation.mutate({ companyId: companyToManage.id });
    } else {
      activateCompanyMutation.mutate({ companyId: companyToManage.id });
    }
  };

  const getUserRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "OPERATOR":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageParam(1);
              }}
              className="h-10 pl-9 pr-4 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Shield className="size-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role:</span>
            <Select
              value={selectedRole || "ALL"}
              onValueChange={(val) => {
                setSelectedRole(val === "ALL" ? "" : val);
                setCurrentPageParam(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-40 bg-white">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="TRAVELER">Traveler</SelectItem>
                <SelectItem value="OPERATOR">Operator</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* User Table */}
      {usersData && usersData.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <Users className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Users Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              There are no user profiles matching the search query or role filter.
            </p>
          </div>
        </div>
      ) : usersData ? (
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">User Details</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Contact Info</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Role</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Operator Company</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData.items.map((user) => {
                  const operatorProfile = user.operatorProfiles?.[0];
                  const company = operatorProfile?.company;

                  return (
                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                      {/* Name */}
                      <TableCell className="px-4 py-3 font-semibold text-slate-900">
                        <div>
                          <div>{user.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            ID: {user.id}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell className="px-4 py-3 text-slate-600 text-xs space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Mail className="size-3 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="size-3 text-slate-400" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Role */}
                      <TableCell className="px-4 py-3">
                        <Badge className={getUserRoleBadgeStyle(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>

                      {/* Company link */}
                      <TableCell className="px-4 py-3 text-slate-600 text-xs">
                        {company ? (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Building className="size-3.5 text-slate-400" />
                            <span>{company.name}</span>
                            <Badge
                              className={
                                company.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : company.status === "SUSPENDED"
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                              }
                            >
                              {company.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {/* Role management */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
                            onClick={() => {
                              setSelectedUser(user);
                              setTargetRole(user.role as any);
                              setIsRoleModalOpen(true);
                            }}
                          >
                            <UserCog className="size-3.5" />
                            Role
                          </Button>

                          {/* Suspend/Activate Company */}
                          {company && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={
                                company.status === "SUSPENDED"
                                  ? "h-8 gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  : "h-8 gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                              }
                              onClick={() => {
                                setCompanyToManage(company);
                                setManageAction(company.status === "SUSPENDED" ? "activate" : "suspend");
                                setIsSuspendConfirmOpen(true);
                              }}
                            >
                              {company.status === "SUSPENDED" ? (
                                <>
                                  <UserCheck className="size-3.5" />
                                  Activate Company
                                </>
                              ) : (
                                <>
                                  <UserX className="size-3.5" />
                                  Suspend Company
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {usersData.total > pageSize && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, usersData.total)} of {usersData.total} users
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam === 1}
                  onClick={() => setCurrentPageParam((p) => p - 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam * pageSize >= usersData.total}
                  onClick={() => setCurrentPageParam((p) => p + 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Role Management Dialog */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        {selectedUser && (
          <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Change User Role
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Change the access role of {selectedUser.fullName}. Warning: promoting/demoting users changes their dashboard access permissions instantly.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateRole} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target System Role
                </label>
                <Select
                  value={targetRole}
                  onValueChange={(val) => setTargetRole(val as any)}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRAVELER">Traveler</SelectItem>
                    <SelectItem value="OPERATOR">Operator</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="h-9" onClick={() => setIsRoleModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white h-9"
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-white" />
                      Saving...
                    </>
                  ) : (
                    "Save Role"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Suspend/Activate Company Dialog */}
      <Dialog open={isSuspendConfirmOpen} onOpenChange={setIsSuspendConfirmOpen}>
        {companyToManage && (
          <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className={manageAction === "suspend" ? "size-5 text-red-600" : "size-5 text-emerald-600"} />
                {manageAction === "suspend" ? "Suspend Company" : "Activate Company"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {manageAction === "suspend" ? (
                  <span>
                    Are you sure you want to suspend "{companyToManage.name}"? This blocks their route schedule ticket sales and suspends all associated operator staff accounts.
                  </span>
                ) : (
                  <span>
                    Are you sure you want to restore access for "{companyToManage.name}"? This allows them to resume intercity trip sales and restores their operators status.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button variant="outline" className="h-9" onClick={() => setIsSuspendConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                className={
                  manageAction === "suspend"
                    ? "bg-red-600 hover:bg-red-700 text-white h-9"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                }
                disabled={suspendCompanyMutation.isPending || activateCompanyMutation.isPending}
                onClick={handleManageCompany}
              >
                {suspendCompanyMutation.isPending || activateCompanyMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5 text-white" />
                    Updating...
                  </>
                ) : manageAction === "suspend" ? (
                  "Suspend"
                ) : (
                  "Activate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
