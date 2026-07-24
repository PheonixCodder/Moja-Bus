"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActionDrawer } from "@moja/ui/components/ui/action-drawer";
import { Field, FieldLabel, FieldError } from "@moja/ui/components/ui/field";
import { Input } from "@moja/ui/components/ui/input";
import { Button } from "@moja/ui/components/ui/button";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@moja/ui/components/ui/combobox";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@moja/ui/components/ui/alert-dialog";
import { Landmark, ShieldCheck, Clock, Trash2, Plus, AlertTriangle, Pencil } from "lucide-react";
import { useState } from "react";
import { useBankAccounts, useDeleteBankAccount } from "../../api/use-bank-accounts";
import { Badge } from "@moja/ui/components/ui/badge";
import { bankStepSchema, type BankStepInput } from "../../schemas";

type BankFormValues = BankStepInput;

export function BankingView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: bankAccounts } = useBankAccounts();
  const deleteBankMutation = useDeleteBankAccount();

  const { data: paystackBanks, isLoading: isLoadingBanks } = useQuery(
    trpc.payments.listBanks.queryOptions({})
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingVerifiedWarning, setEditingVerifiedWarning] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<BankFormValues | null>(null);

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankStepSchema),
    defaultValues: {
      bankCode: "",
      accountNumber: "",
      accountName: "",
      branch: "",
      swiftCode: "",
      iban: "",
    },
  });

  const addBankAccountMutation = useMutation(
    trpc.operator.addBankAccount.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter());
        queryClient.invalidateQueries(trpc.operator.listBankAccounts.queryFilter());
        toast.success("Settlement account submitted for admin verification.");
        handleCloseDrawer();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to submit bank account");
      }
    })
  );

  const updateBankAccountMutation = useMutation(
    trpc.operator.updateBankAccount.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter());
        queryClient.invalidateQueries(trpc.operator.listBankAccounts.queryFilter());
        toast.success("Bank account updated successfully.");
        handleCloseDrawer();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update bank account");
      }
    })
  );

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    form.reset({
      bankCode: "",
      accountNumber: "",
      accountName: "",
      branch: "",
      swiftCode: "",
      iban: "",
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    setIsEditing(true);
    form.reset({
      bankCode: account.bankCode || "",
      accountNumber: account.accountNumber || "",
      accountName: account.accountName || "",
      branch: account.branch || "",
      swiftCode: account.swiftCode || "",
      iban: account.iban || "",
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setIsEditing(false);
    setEditingId(null);
    form.reset();
  };

  const onSubmit = (data: BankFormValues) => {
    // Check if editing a verified account
    if (isEditing && editingId) {
      const account = bankAccounts?.find((a) => a.id === editingId);
      if (account?.isVerified) {
        setPendingSubmitData(data);
        setEditingVerifiedWarning(true);
        return; // Pause submission
      }
    }
    executeSubmit(data);
  };

  const executeSubmit = (data: BankFormValues) => {
    const selectedBank = paystackBanks?.find((p) => p.code === data.bankCode);
    const payload = {
      bankName: selectedBank ? selectedBank.name : "Unknown Bank",
      bankCode: data.bankCode ?? "",
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      branch: data.branch || null,
      swiftCode: data.swiftCode || null,
      iban: data.iban || null,
    };

    if (isEditing && editingId) {
      updateBankAccountMutation.mutate({ id: editingId, ...payload });
    } else {
      addBankAccountMutation.mutate(payload);
    }
    setEditingVerifiedWarning(false);
    setPendingSubmitData(null);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteBankMutation.mutate({ bankAccountId: deletingId }, {
        onSettled: () => setDeletingId(null)
      });
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Financials & Payouts</h3>
          <p className="text-sm text-muted-foreground">
            Manage your settlement bank accounts and mobile money wallets.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankAccounts?.map((account) => (
          <div key={account.id} className="p-5 rounded-lg border bg-card shadow-sm space-y-4 relative group">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-lg">{account.bankName}</p>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  •••• •••• {account.accountNumber?.slice(-4) || "****"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {account.isVerified ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                    <Clock className="w-3 h-3 mr-1" /> Pending
                  </Badge>
                )}
                {account.isDefault && (
                  <Badge variant="secondary" className="text-[10px]">Primary</Badge>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t grid grid-cols-2 text-sm gap-2">
              <div className="text-muted-foreground">Account Name</div>
              <div className="font-medium truncate" title={account.accountName || ""}>
                {account.accountName}
              </div>
            </div>

            <div className="absolute -top-3 -right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm"
                onClick={() => handleEdit(account)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm"
                onClick={() => setDeletingId(account.id)}
                disabled={deleteBankMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {bankAccounts?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg border-muted">
            <Landmark className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-base mb-1">No Bank Accounts Found</h4>
            <p className="text-sm text-muted-foreground mb-4">You have not added any payout methods yet.</p>
            <Button onClick={handleOpenAdd} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Account
            </Button>
          </div>
        )}
      </div>

      <ActionDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={isEditing ? "Edit Settlement Account" : "Add Settlement Account"}
        description={isEditing ? "Update your bank account details." : "Register a Côte d'Ivoire Bank or Mobile Money wallet."}
        footer={
          <div className="flex flex-col-reverse sm:flex-row w-full justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleCloseDrawer} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={addBankAccountMutation.isPending || updateBankAccountMutation.isPending} className="w-full sm:w-auto">
              {(addBankAccountMutation.isPending || updateBankAccountMutation.isPending) ? "Submitting..." : "Save Account"}
            </Button>
          </div>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 py-2 pb-20">
          <Field>
            <FieldLabel>Payout Provider *</FieldLabel>
            <Combobox
              value={form.watch("bankCode") || ""}
              onValueChange={(val) => {
                if (val) form.setValue("bankCode", val);
              }}
            >
              <ComboboxInput placeholder={isLoadingBanks ? "Loading banks..." : "Search for a bank..."} />
              <ComboboxContent>
                <ComboboxList>
                  {paystackBanks?.map((provider: any) => (
                    <ComboboxItem key={provider.code} value={provider.code}>
                      {provider.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError errors={[form.formState.errors.bankCode as any]} />
          </Field>

          <Field>
            <FieldLabel>Account / Wallet Number *</FieldLabel>
            <Input
              placeholder="RIB number or phone format"
              {...form.register("accountNumber")}
            />
            <FieldError errors={[form.formState.errors.accountNumber as any]} />
          </Field>

          <Field>
            <FieldLabel>Account Holder Name *</FieldLabel>
            <Input
              placeholder="Enter account holder name"
              {...form.register("accountName")}
            />
            <FieldError errors={[form.formState.errors.accountName as any]} />
          </Field>

          <Field>
            <FieldLabel>Branch Location (Optional)</FieldLabel>
            <Input
              {...form.register("branch")}
            />
            <FieldError errors={[form.formState.errors.branch as any]} />
          </Field>

          <Field>
            <FieldLabel>SWIFT / BIC Code (Optional)</FieldLabel>
            <Input
              {...form.register("swiftCode")}
            />
            <FieldError errors={[form.formState.errors.swiftCode as any]} />
          </Field>

          <Field>
            <FieldLabel>IBAN (Optional)</FieldLabel>
            <Input
              {...form.register("iban")}
            />
            <FieldError errors={[form.formState.errors.iban as any]} />
          </Field>
        </form>
      </ActionDrawer>

      {/* Delete Warning */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="size-6 text-red-600" />
            </div>
            <AlertDialogTitle>Delete Payout Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this bank account? This action cannot be undone and may delay your settlements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Yes, delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Verified Warning */}
      <AlertDialog open={editingVerifiedWarning} onOpenChange={setEditingVerifiedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 mb-4">
              <AlertTriangle className="size-6 text-amber-600" />
            </div>
            <AlertDialogTitle>Edit Verified Account</AlertDialogTitle>
            <AlertDialogDescription>
              This bank account is currently verified. If you edit these details, payouts to this account will be paused until an admin re-verifies it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setEditingVerifiedWarning(false); setPendingSubmitData(null); }}>
              Cancel Edit
            </AlertDialogCancel>
            <AlertDialogAction 
              variant="default"
              onClick={() => pendingSubmitData && executeSubmit(pendingSubmitData)}
            >
              Understand & Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
