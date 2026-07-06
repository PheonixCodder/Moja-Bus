"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
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

  const { data, isLoading } = useQuery(trpc.passenger.listSaved.queryOptions());

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.passenger.listSaved.queryKey(),
    });
  };

  const createMutation = useMutation({
    ...trpc.passenger.createSaved.mutationOptions(),
    onSuccess: () => {
      toast.success("Passenger saved");
      setDialogOpen(false);
      setForm(emptyForm);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    ...trpc.passenger.updateSaved.mutationOptions(),
    onSuccess: () => {
      toast.success("Passenger updated");
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
      <div className="flex justify-center py-16">
        <Spinner className="size-8 text-[#ee237c]" />
      </div>
    );
  }

  const passengers = data?.items ?? [];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary hidden lg:block">
            Saved passengers
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Store family and travel contacts to book trips faster.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#ee237c] hover:bg-[#d01867] text-white font-bold"
        >
          <Plus className="size-4 mr-1.5" />
          Add passenger
        </Button>
      </div>

      {passengers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <UserRound className="size-10 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-800">No saved passengers yet</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Add people you travel with often. You can assign a different passenger
            to each seat when booking.
          </p>
          <Button onClick={openCreate} variant="outline" className="mt-4">
            Add your first passenger
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {passengers.map((passenger) => (
            <li
              key={passenger.id}
              className="rounded-xl border border-slate-100 bg-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900">
                    {passenger.fullName}
                  </p>
                  {passenger.isSelf ? (
                    <Badge variant="outline" className="text-[#ee237c] border-pink-200">
                      Me
                    </Badge>
                  ) : null}
                  {passenger.label ? (
                    <Badge variant="secondary">{passenger.label}</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{passenger.phone}</p>
                {passenger.email ? (
                  <p className="text-xs text-slate-400">{passenger.email}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(passenger)}
                >
                  <Pencil className="size-3.5 mr-1" />
                  Edit
                </Button>
                {!passenger.isSelf ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ id: passenger.id })}
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    Delete
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit passenger" : "Add passenger"}
            </DialogTitle>
            <DialogDescription>
              These details are used when booking tickets. You can update them
              anytime without changing past bookings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sp-name">Full name</Label>
              <Input
                id="sp-name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-phone">Phone number</Label>
              <Input
                id="sp-phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+225 07 00 00 00 00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-email">Email (optional)</Label>
              <Input
                id="sp-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-label">Label (optional)</Label>
              <Input
                id="sp-label"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="Mom, colleague, child..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#ee237c] hover:bg-[#d01867] text-white"
              >
                {isSaving ? <Spinner className="size-4" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
