"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useEffect, useState } from "react";
import { useBankAccounts, useDeleteBankAccount } from "../../api/use-bank-accounts";
import { Badge } from "@moja/ui/components/ui/badge";

import { bankStepSchema, type BankStepInput } from "../../schemas";

type BankFormValues = BankStepInput;

interface BankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BankDrawer({ isOpen, onClose }: BankDrawerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: bankAccounts } = useBankAccounts();
  const deleteBankMutation = useDeleteBankAccount();

  const { data: paystackBanks, isLoading: isLoadingBanks } = useQuery(
    trpc.payments.listBanks.queryOptions({})
  );

  const addBankAccountMutation = useMutation(
    trpc.operator.addBankAccount.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter());
        queryClient.invalidateQueries(trpc.operator.listBankAccounts.queryFilter());
        toast.success("Settlement account submitted for admin verification.");
        setIsAdding(false);
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
        setIsEditing(false);
        setEditingId(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update bank account");
      }
    })
  );

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankStepSchema) as any,
    defaultValues: {
      bankCode: "",
      accountNumber: "",
      accountName: "",
      branch: "",
      swiftCode: "",
      iban: "",
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (bankAccounts && bankAccounts.length > 0) {
        setIsAdding(false);
      } else {
        setIsAdding(true);
      }
      form.reset();
    }
  }, [isOpen, bankAccounts?.length, form]);

  const onSubmit = (data: BankFormValues) => {
    const selectedBank = paystackBanks?.find((p: any) => p.code === data.bankCode);
    const payload = {
      bankName: selectedBank ? selectedBank.name : "Unknown Bank",
      bankCode: data.bankCode,
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
  };

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    setIsEditing(true);
    setIsAdding(false);
    form.reset({
      bankCode: account.bankCode || "",
      accountNumber: account.accountNumber || "",
      accountName: account.accountName || "",
      branch: account.branch || "",
      swiftCode: account.swiftCode || "",
      iban: account.iban || "",
    });
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteBankMutation.mutate({ bankAccountId: deletingId }, {
        onSettled: () => setDeletingId(null)
      });
    }
  };

  const renderList = () => (
    <div className="space-y-4 px-4 py-2">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground">Manage your payout accounts</p>
        <Button size="sm" onClick={() => setIsAdding(true)} variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Account
        </Button>
      </div>
      
      <div className="space-y-3">
        {bankAccounts?.map((account) => (
          <div key={account.id} className="p-4 rounded-lg border bg-card shadow-sm space-y-3 relative group">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{account.bankName}</p>
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
            
            <div className="pt-3 border-t grid grid-cols-2 text-sm gap-2">
              <div className="text-muted-foreground">Account Name</div>
              <div className="font-medium truncate" title={account.accountName || ""}>
                {account.accountName}
              </div>
            </div>

            <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full shadow-sm"
                onClick={() => handleEdit(account)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-7 w-7 rounded-full shadow-sm"
                onClick={() => setDeletingId(account.id)}
                disabled={deleteBankMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 py-2">
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
  );

  return (
    <>
      <ActionDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Edit Settlement Account" : isAdding ? "Add Settlement Account" : "Manage Banks"}
        description={isEditing ? "Update your bank account details." : isAdding ? "Register a Côte d'Ivoire Bank or Mobile Money wallet." : "View and manage your payout methods."}
        footer={
          <div className="flex w-full justify-end gap-3">
            {(isAdding || isEditing) && bankAccounts && bankAccounts.length > 0 ? (
              <Button variant="outline" onClick={() => { setIsAdding(false); setIsEditing(false); setEditingId(null); }}>
                Back to List
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
            {(isAdding || isEditing) && (
              <Button onClick={form.handleSubmit(onSubmit)} disabled={addBankAccountMutation.isPending || updateBankAccountMutation.isPending}>
                {(addBankAccountMutation.isPending || updateBankAccountMutation.isPending) ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        }
      >
        {isAdding || isEditing ? renderForm() : renderList()}
      </ActionDrawer>

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
    </>
  );
}
