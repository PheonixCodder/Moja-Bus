"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
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
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  Building,
  Mail,
  Phone,
  Search,
  Shield,
  UserCheck,
  UserCog,
  Users,
  UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export function AdminUsersView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const t = useTranslations("adminDashboard.adminUsersView");

  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [selectedRole, setSelectedRole] = useQueryState("role", {
    defaultValue: "",
  });
  const [currentPageParam, setCurrentPageParam] = useQueryState(
    "page",
    parseAsInteger.withDefault(1),
  );
  const currentPage = currentPageParam - 1; // 0-indexed internally
  const pageSize = 20;

  // Dialog State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [targetRole, setTargetRole] = useState<
    "TRAVELER" | "OPERATOR" | "ADMIN"
  >("TRAVELER");

  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = useState(false);
  const [companyToManage, setCompanyToManage] = useState<any>(null);
  const [manageAction, setManageAction] = useState<"suspend" | "activate">(
    "suspend",
  );

  // Suspense Queries
  const { data: usersData } = useSuspenseQuery(
    trpc.admin.listUsers.queryOptions({
      search: searchQuery || undefined,
      role: selectedRole || undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    }),
  );

  // Mutations
  const updateRoleMutation = useMutation(
    trpc.admin.updateUserRole.mutationOptions({
      onSuccess: () => {
        toast.success(t("userRoleUpdated"));
        setIsRoleModalOpen(false);
        queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || t("failedToUpdateRole"));
      },
    }),
  );

  const suspendCompanyMutation = useMutation(
    trpc.admin.suspendCompany.mutationOptions({
      onSuccess: () => {
        toast.success(t("operatorCompanySuspended"));
        setIsSuspendConfirmOpen(false);
        queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || t("failedToSuspendCompany"));
      },
    }),
  );

  const activateCompanyMutation = useMutation(
    trpc.admin.activateCompany.mutationOptions({
      onSuccess: () => {
        toast.success(t("operatorCompanyActivated"));
        setIsSuspendConfirmOpen(false);
        queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || t("failedToActivateCompany"));
      },
    }),
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
        return "bg-destructive/15 text-destructive border-destructive/20";
      case "OPERATOR":
        return "bg-primary/15 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageParam(1);
              }}
              className="h-10 pl-9 pr-4 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Shield className="size-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t("role")}
            </span>
            <Select
              value={selectedRole || "ALL"}
              onValueChange={(val) => {
                setSelectedRole(val === "ALL" ? "" : val);
                setCurrentPageParam(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-40 bg-background">
                <SelectValue placeholder={t("allRoles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allRoles")}</SelectItem>
                <SelectItem value="TRAVELER">{t("traveler")}</SelectItem>
                <SelectItem value="OPERATOR">{t("operator")}</SelectItem>
                <SelectItem value="ADMIN">{t("admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* User Table */}
      {usersData && usersData.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto">
            <Users className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              {t("noUsersFound")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {t("noUsersMatchFilters")}
            </p>
          </div>
        </div>
      ) : usersData ? (
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("userDetails")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("contactInfo")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("roleColumn")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("operatorCompany")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4 text-right">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData.items.map((user) => {
                  const operatorProfile = user.operatorProfiles?.[0];
                  const company = operatorProfile?.company;

                  return (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      {/* Name */}
                      <TableCell className="px-4 py-3 font-semibold text-foreground">
                        <div>
                          <div>{user.fullName}</div>
                          <div className="text-xs text-muted-foreground font-normal mt-0.5">
                            ID: {user.id}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell className="px-4 py-3 text-muted-foreground text-xs space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Mail className="size-3 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="size-3 text-muted-foreground" />
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
                      <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                        {company ? (
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Building className="size-3.5 text-muted-foreground" />
                            <span>{company.name}</span>
                            <Badge
                              className={
                                company.status === "ACTIVE"
                                  ? "bg-success/15 text-success border-success/20"
                                  : company.status === "SUSPENDED"
                                    ? "bg-warning/15 text-warning border-warning/20"
                                    : "bg-muted text-muted-foreground border-border"
                              }
                            >
                              {company.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {/* Role management */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedUser(user);
                              setTargetRole(user.role as any);
                              setIsRoleModalOpen(true);
                            }}
                          >
                            <UserCog className="size-3.5" />
                            {t("roleButton")}
                          </Button>

                          {/* Suspend/Activate Company */}
                          {company && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={
                                company.status === "SUSPENDED"
                                  ? "h-8 gap-1 text-xs font-semibold text-success hover:text-success hover:bg-success/10"
                                  : "h-8 gap-1 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                              }
                              onClick={() => {
                                setCompanyToManage(company);
                                setManageAction(
                                  company.status === "SUSPENDED"
                                    ? "activate"
                                    : "suspend",
                                );
                                setIsSuspendConfirmOpen(true);
                              }}
                            >
                              {company.status === "SUSPENDED" ? (
                                <>
                                  <UserCheck className="size-3.5" />
                                  {t("activateCompany")}
                                </>
                              ) : (
                                <>
                                  <UserX className="size-3.5" />
                                  {t("suspendCompany")}
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
              <span className="text-muted-foreground font-medium">
                {t("showingUsers", {
                  start: currentPage * pageSize + 1,
                  end: Math.min((currentPage + 1) * pageSize, usersData.total),
                  total: usersData.total,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam === 1}
                  onClick={() => setCurrentPageParam((p) => p - 1)}
                  className="h-8 text-xs font-semibold"
                >
                  {t("previous")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam * pageSize >= usersData.total}
                  onClick={() => setCurrentPageParam((p) => p + 1)}
                  className="h-8 text-xs font-semibold"
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Role Management Dialog */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        {selectedUser && (
          <DialogContent className="max-w-md border border-border bg-card rounded-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {t("changeUserRole")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("changeRoleDescription", {
                  userName: selectedUser.fullName,
                })}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateRole} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {t("targetSystemRole")}
                </label>
                <Select
                  value={targetRole}
                  onValueChange={(val) => setTargetRole(val as any)}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRAVELER">{t("traveler")}</SelectItem>
                    <SelectItem value="OPERATOR">{t("operator")}</SelectItem>
                    <SelectItem value="ADMIN">{t("admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  onClick={() => setIsRoleModalOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  className="h-9"
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5" />
                      {t("saving")}
                    </>
                  ) : (
                    t("saveRole")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Suspend/Activate Company Dialog */}
      <Dialog
        open={isSuspendConfirmOpen}
        onOpenChange={setIsSuspendConfirmOpen}
      >
        {companyToManage && (
          <DialogContent className="max-w-md border border-border bg-card rounded-lg p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle
                  className={
                    manageAction === "suspend"
                      ? "size-5 text-destructive"
                      : "size-5 text-success"
                  }
                />
                {manageAction === "suspend"
                  ? t("suspendCompany")
                  : t("activateCompany")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {manageAction === "suspend" ? (
                  <span>
                    {t("areYouSureSuspend", {
                      companyName: companyToManage.name,
                    })}
                  </span>
                ) : (
                  <span>
                    {t("areYouSureActivate", {
                      companyName: companyToManage.name,
                    })}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setIsSuspendConfirmOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant={manageAction === "suspend" ? "destructive" : "default"}
                className="h-9"
                disabled={
                  suspendCompanyMutation.isPending ||
                  activateCompanyMutation.isPending
                }
                onClick={handleManageCompany}
              >
                {suspendCompanyMutation.isPending ||
                activateCompanyMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5" />
                    {t("updating")}
                  </>
                ) : manageAction === "suspend" ? (
                  t("suspend")
                ) : (
                  t("activate")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
