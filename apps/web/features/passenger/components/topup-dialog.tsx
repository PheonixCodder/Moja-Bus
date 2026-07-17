"use client";

import { useState } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";

interface TopupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTopup: (amount: number) => void;
  isPending: boolean;
}

export function TopupDialog({ isOpen, onClose, onSubmitTopup, isPending }: TopupDialogProps) {
  const [topupAmount, setTopupAmount] = useState("");

  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(topupAmount);
    if (!isNaN(amount) && amount >= 100) {
      onSubmitTopup(amount);
    }
  };

  const handlePresetSelect = (amount: number) => {
    setTopupAmount(amount.toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border border-border bg-white rounded-2xl p-6 shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">Top Up Wallet</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Load prepaid balance into your Moja Ride digital wallet using credit card or mobile money. Minimum deposit is 100 XOF.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTopupSubmit} className="space-y-5 py-2">
          
          {/* Amount Presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Select Quick Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 25000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  onClick={() => handlePresetSelect(amount)}
                  className={`h-9 text-xs font-bold rounded-xl border-slate-200 hover:border-primary hover:text-primary transition-colors ${
                    topupAmount === amount.toString() 
                      ? "border-primary text-primary bg-primary/5" 
                      : ""
                  }`}
                >
                  +{amount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Or Enter Custom Amount (XOF)
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="e.g. 5000"
                min="100"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                required
                className="pr-12 rounded-xl border-slate-200 h-10 text-sm focus-visible:ring-primary"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">XOF</span>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200 text-slate-700 font-semibold"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/95 text-white h-10 rounded-xl font-bold shadow-sm"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2 size-4 text-white" />
                  Initializing...
                </>
              ) : (
                "Proceed to Paystack"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
