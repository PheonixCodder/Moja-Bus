"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Search, UserRound, Mail, Phone, Tag } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Card, CardContent } from "@moja/ui/components/ui/card";
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
import { useTRPC } from "@/trpc/client";
import type { SavedPassengerDTO } from "@moja/types";

type PassengerFormState = {
  fullName: string;
  phone: string;
  email: string;
  label: string;
};

const emptyForm: PassengerFormState = {
  fullName: "",
  phone: "",
  email: "",
  label: "",
};

function toForm(passenger: SavedPassengerDTO): PassengerFormState {
  return {
    fullName: passenger.fullName,
    phone: passenger.phone,
    email: passenger.email ?? "",
    label: passenger.label ?? "",
  };
}

export function SavedPassengersView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavedPassengerDTO | null>(null);
  const [form, setForm] = useState<PassengerFormState>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery(trpc.passenger.listSaved.queryOptions());

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.passenger.listSaved.queryKey(),
    });
  };

  const createMutation = useMutation({
    ...trpc.passenger.createSaved.mutationOptions(),
    onSuccess: () => {
      toast.success("Passenger saved successfully");
      setDialogOpen(false);
      setForm(emptyForm);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    ...trpc.passenger.updateSaved.mutationOptions(),
    onSuccess: () => {
      toast.success("Passenger details updated");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    ...trpc.passenger.deleteSaved.mutationOptions(),
    onSuccess: () => {
      toast.success("Passenger removed");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(passenger: SavedPassengerDTO) {
    setEditing(passenger);
    setForm(toForm(passenger));
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      label: form.label.trim() || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const passengers = data?.items ?? [];

  // Filter passengers locally by search query
  const filteredPassengers = passengers.filter((p) => {
    const term = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.phone.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.label && p.label.toLowerCase().includes(term))
    );
  });

  // Helper for initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const firstChar = parts[0][0] || "";
      const secondChar = parts[1][0] || "";
      return `${firstChar}${secondChar}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Color tones for avatars
  const avatarColors = [
    "bg-indigo-50 text-indigo-700 border-indigo-100",
    "bg-emerald-50 text-emerald-700 border-emerald-100",
    "bg-amber-50 text-amber-700 border-amber-100",
    "bg-purple-50 text-purple-700 border-purple-100",
    "bg-rose-50 text-rose-700 border-rose-100",
  ];
  const getAvatarColor = (name: string) => {
    return avatarColors[name.length % avatarColors.length];
  };

  return (
    <div className="space-y-4">
      {/* Table Actions Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 size-4 text-slate-400" />
          <Input
            placeholder="Search saved travelers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-primary"
          />
        </div>

        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl shadow-sm w-full sm:w-auto"
        >
          <Plus className="size-4 mr-1.5" />
          Add Passenger
        </Button>
      </div>

      <Card className="border-border bg-bg-surface overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {filteredPassengers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-12 h-12 bg-bg-base rounded-full flex items-center justify-center text-text-muted border border-border">
                <UserRound className="w-6 h-6" />
              </div>
              <p className="font-semibold text-text-primary">No passengers found</p>
              <p className="text-xs text-text-secondary max-w-[280px]">
                {searchQuery ? "No travelers match your search query." : "Save details of people you travel with often for 1-click checkout."}
              </p>
              {!searchQuery && (
                <Button onClick={openCreate} variant="outline" className="mt-2 rounded-xl text-xs font-bold">
                  Add Traveler Profile
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-base">
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6">Passenger</TableHead>
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6">Contact Info</TableHead>
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6">Label / Tag</TableHead>
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPassengers.map((passenger) => (
                    <TableRow key={passenger.id} className="border-b border-border/50 hover:bg-bg-base/30 transition-colors">
                      
                      {/* Passenger Name & Avatar */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${getAvatarColor(passenger.fullName)}`}>
                            {getInitials(passenger.fullName)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-text-primary flex items-center gap-2">
                              {passenger.fullName}
                              {passenger.isSelf && (
                                <Badge variant="outline" className="text-primary border-pink-200 bg-pink-50/50 text-[9px] font-extrabold h-4 px-1.5 py-0">
                                  Me
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Details */}
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1 text-xs font-semibold text-text-secondary">
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3 text-text-muted shrink-0" />
                            <span>{passenger.phone}</span>
                          </div>
                          {passenger.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                              <Mail className="size-3 text-text-muted shrink-0" />
                              <span className="truncate max-w-[180px]">{passenger.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Label badge */}
                      <TableCell className="px-6 py-4">
                        {passenger.label ? (
                          <Badge variant="secondary" className="bg-bg-base text-text-primary border border-border text-[10px] font-extrabold py-0.5 px-2 rounded-md gap-1">
                            <Tag className="size-2.5 text-text-muted" />
                            {passenger.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-text-muted font-medium">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(passenger)}
                            className="h-8 text-xs font-semibold rounded-lg border-border"
                          >
                            <Pencil className="size-3 mr-1" />
                            Edit
                          </Button>
                          {!passenger.isSelf && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold rounded-lg border-border text-red-600 hover:text-red-700 hover:bg-red-50/30"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate({ id: passenger.id })}
                            >
                              <Trash2 className="size-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-2xl p-6 shadow-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
              {editing ? "Edit Passenger Details" : "Add New Passenger"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              These details are used when booking tickets. You can update them anytime without changing past bookings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sp-name" className="text-xs font-bold text-slate-600">Full Name</Label>
              <Input
                id="sp-name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                required
                placeholder="e.g. John Doe"
                className="rounded-xl border-slate-200 h-10 text-sm focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-phone" className="text-xs font-bold text-slate-600">Phone Number</Label>
              <Input
                id="sp-phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+225 07 00 00 00 00"
                required
                className="rounded-xl border-slate-200 h-10 text-sm focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-email" className="text-xs font-bold text-slate-600">Email (optional)</Label>
              <Input
                id="sp-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="e.g. email@example.com"
                className="rounded-xl border-slate-200 h-10 text-sm focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-label" className="text-xs font-bold text-slate-600">Label (optional)</Label>
              <Input
                id="sp-label"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="e.g. Spouse, Friend, Colleague..."
                className="rounded-xl border-slate-200 h-10 text-sm focus-visible:ring-primary"
              />
            </div>
            
            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
                className="h-10 rounded-xl border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/95 text-white h-10 rounded-xl font-bold shadow-sm"
              >
                {isSaving ? <Spinner className="size-4 text-white" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
