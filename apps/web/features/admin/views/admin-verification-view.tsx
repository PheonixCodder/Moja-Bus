"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Building,
  User,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Badge } from "@moja/ui/components/ui/badge";



export function AdminVerificationView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: queue } = useSuspenseQuery(
    trpc.admin.listPendingOperators.queryOptions()
  );

  const { data: paystackBanks } = useQuery(
    trpc.payments.listBanks.queryOptions({})
  );

  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");

  const verifyMutation = useMutation(
    trpc.admin.verifyOperator.mutationOptions({
      onSuccess: (res) => {
        toast.success(`Company approved! Paystack transfer recipient ${res.recipientCode} created.`);
        setIsApproveOpen(false);
        setSelectedCompany(null);
        queryClient.invalidateQueries(trpc.admin.listPendingOperators.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to verify company");
      },
    })
  );

  const rejectMutation = useMutation(
    trpc.admin.rejectOperator.mutationOptions({
      onSuccess: () => {
        toast.success("Verification request rejected");
        setIsRejectOpen(false);
        setSelectedCompany(null);
        queryClient.invalidateQueries(trpc.admin.listPendingOperators.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to reject company");
      },
    })
  );

  const handleApprove = () => {
    if (!selectedBankCode) {
      toast.error("Please select a settlement bank code");
      return;
    }
    verifyMutation.mutate({
      companyId: selectedCompany.id,
      bankCode: selectedBankCode,
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({
      companyId: selectedCompany.id,
      reason: rejectionReason,
    });
  };

  return (
    <div className="space-y-6">
      {queue && queue.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <ShieldCheck className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Queue is Clear</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              There are no bus companies currently awaiting verification.
            </p>
          </div>
        </div>
      ) : queue ? (
        <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Company Name</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Representative</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Contact Info</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Submitted Date</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((company) => {
                const rep = company.operators[0]?.user;
                return (
                  <TableRow key={company.id} className="hover:bg-slate-50/50">
                    <TableCell className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building className="size-4 text-slate-400" />
                        <div>
                          <div>{company.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wider mt-0.5">
                            Reg: {company.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">
                      {rep ? (
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-slate-400" />
                          <span>{rep.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-600 text-xs space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Mail className="size-3 text-slate-400" />
                        <span>{company.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="size-3 text-slate-400" />
                        <span>{company.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(company.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs font-semibold"
                        onClick={() => {
                          setSelectedCompany(company);
                          setSelectedBankCode("");
                          setRejectionReason("");
                        }}
                      >
                        Review
                        <ChevronRight className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {/* Verification Detailed Drawer */}
      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        {selectedCompany && (
          <SheetContent className="w-[500px] sm:w-[600px] border-l border-border bg-white overflow-y-auto p-6">
            <SheetHeader className="space-y-1">
              <SheetTitle className="text-xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2">
                <Building className="size-5 text-primary" />
                {selectedCompany.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                Review documents and bank details to verify this operator.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-8 space-y-6">
              {/* Representative details */}
              <div className="rounded-md border border-slate-100 bg-slate-50 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Representative Contact
                </h4>
                {selectedCompany.operators[0]?.user ? (
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Name:</span>{" "}
                      {selectedCompany.operators[0].user.fullName}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Email:</span>{" "}
                      {selectedCompany.operators[0].user.email}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Phone:</span>{" "}
                      {selectedCompany.operators[0].user.phone || "N/A"}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No representative details available.</p>
                )}
              </div>

              {/* Company Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Registration Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 border border-slate-100 rounded-md p-4 bg-white">
                  <div>
                    <div className="text-slate-400 font-medium">Business Type</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedCompany.businessType}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Reg Number</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedCompany.registrationNumber}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Tax ID</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedCompany.taxId}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Established</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedCompany.yearEstablished || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Bank Account Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Settlement Bank Accounts
                </h4>
                <div className="space-y-2">
                  {selectedCompany.bankAccounts && selectedCompany.bankAccounts.length > 0 ? (
                    selectedCompany.bankAccounts.map((bank: any) => (
                      <div key={bank.id} className="border border-slate-100 rounded-md p-4 bg-white space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-slate-800">{bank.bankName}</span>
                            {bank.isDefault && (
                              <span className="ml-2 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                                Default Target
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            bank.isVerified 
                              ? "bg-green-50 text-green-700 border border-green-200" 
                              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          }`}>
                            {bank.isVerified ? "Verified" : "Pending Verification"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 mt-1 text-[11px] text-slate-500">
                          <div><span className="font-semibold">Holder:</span> <span className="uppercase">{bank.accountName}</span></div>
                          <div><span className="font-semibold">Account Last 4:</span> •••• {bank.accountNumberLast4 || "N/A"}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-3 flex gap-2">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>The operator has not submitted bank details yet. Approval is blocked.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Documents */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Uploaded Documents
                </h4>
                <div className="space-y-2">
                  {selectedCompany.documents && selectedCompany.documents.length > 0 ? (
                    selectedCompany.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between border border-slate-100 rounded-md p-3 bg-white hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <FileText className="size-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                              {doc.name || doc.documentType.replace(/_/g, " ")}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {doc.fileUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 text-xs"
                            nativeButton={false}
                            render={
                              <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                                Open File
                                <ExternalLink className="size-3" />
                              </a>
                            }
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No documents uploaded.</p>
                  )}
                </div>
              </div>

              {/* Review CTAs */}
              <div className="pt-6 border-t border-border flex items-center gap-3 justify-end">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 font-semibold"
                  onClick={() => setIsRejectOpen(true)}
                >
                  Reject Verification
                </Button>
                <Button
                  className="bg-primary hover:bg-primary-hover text-white h-10 font-semibold"
                  disabled={!selectedCompany.bankAccounts || selectedCompany.bankAccounts.length === 0}
                  onClick={() => {
                    const pendingBank = selectedCompany.bankAccounts.find((b: any) => !b.isVerified) || selectedCompany.bankAccounts[0];
                    const matchingBank = paystackBanks?.find(
                      (b: any) =>
                        pendingBank?.bankName
                          ?.toLowerCase()
                          ?.includes(b.name.split(" ")[0].toLowerCase())
                    );
                    setSelectedBankCode(pendingBank?.bankCode || matchingBank?.code || "");
                    setIsApproveOpen(true);
                  }}
                >
                  Verify & Register Recipient
                </Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Approval Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        {selectedCompany && (
          <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Verify & Register Transfer Recipient
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                To enable withdrawals, map the bank details below to the correct Ivory Coast bank code to create the Paystack Transfer Recipient.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {(() => {
                const pendingBank = selectedCompany.bankAccounts?.find((b: any) => !b.isVerified) || selectedCompany.bankAccounts?.[0];
                return (
                  <div className="rounded border border-slate-100 p-3 bg-slate-50 space-y-1.5 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Bank Name (Operator Input):</span>{" "}
                      {pendingBank?.bankName}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Account Number:</span> ••••••••••••
                      {pendingBank?.accountNumberLast4}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Settlement Bank Code (Paystack List)
                </label>
                <select
                  className="w-full h-10 rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={selectedBankCode}
                  onChange={(e) => setSelectedBankCode(e.target.value)}
                >
                  <option value="">-- Select Bank Code --</option>
                  {paystackBanks?.map((bank: any) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="h-9" onClick={() => setIsApproveOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary-hover text-white h-9"
                disabled={verifyMutation.isPending}
                onClick={handleApprove}
              >
                {verifyMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5 text-white" />
                    Registering...
                  </>
                ) : (
                  "Confirm Verification"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Reject Verification Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide a clear reason for the rejection. This description will be sent back to the operator to correct their details.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <textarea
              className="w-full min-h-[100px] rounded-md border border-border bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              placeholder="e.g. Tax clearance certificate is expired, or bank account name does not match the company registration document."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-9" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white h-9"
              disabled={rejectMutation.isPending}
              onClick={handleReject}
            >
              {rejectMutation.isPending ? (
                <>
                  <Spinner className="mr-2 size-3.5 text-white" />
                  Submitting...
                </>
              ) : (
                "Submit Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
