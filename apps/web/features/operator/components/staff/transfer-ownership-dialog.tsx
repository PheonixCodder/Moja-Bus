"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@moja/ui/components/ui/alert-dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";
import type { StaffMember } from "@/features/operator/lib/staff";

interface TransferOwnershipDialogProps {
  member: StaffMember | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (memberId: string, otp: string) => Promise<void>;
  onRequestOtp: () => Promise<void>;
  otpPending: boolean;
}

export function TransferOwnershipDialog({
  member,
  open,
  onClose,
  onConfirm,
  onRequestOtp,
  otpPending,
}: TransferOwnershipDialogProps) {
  const [otp, setOtp] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    try {
      await onRequestOtp();
      startCooldown();
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code");
    }
  }

  async function handleConfirm() {
    if (!member || !otp) return;
    setConfirming(true);
    try {
      await onConfirm(member.id, otp);
      setOtp("");
      onClose();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setOtp("");
          onClose();
        }
      }}
    >
      <AlertDialogContent className="border-border bg-card max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle className="text-base font-semibold">
              Transfer Ownership
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[13px] text-muted-foreground space-y-2">
            <p>
              You are about to transfer ownership of the company to{" "}
              <strong className="text-foreground">
                {member?.user.fullName}
              </strong>
              .
            </p>
            <p className="text-amber-600 font-medium">
              You will lose owner access. This cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 px-0 pb-2">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <Label
                htmlFor="transfer-otp"
                className="text-[12px] font-medium text-muted-foreground"
              >
                Verification Code
              </Label>
              <Input
                id="transfer-otp"
                type="text"
                placeholder="000000"
                maxLength={6}
                className="h-9 text-[13px] border-border tracking-wider font-mono"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-[12px]"
              onClick={handleSendOtp}
              disabled={otpPending || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Send Code"}
            </Button>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="h-9 text-[13px]"
            onClick={() => setOtp("")}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-9 text-[13px] bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={handleConfirm}
            disabled={confirming || otp.length < 6}
          >
            {confirming ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              "Transfer Ownership"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
