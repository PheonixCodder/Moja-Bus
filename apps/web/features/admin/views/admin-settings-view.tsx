"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import {
  Layers,
  Percent,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@moja/ui/components/ui/card";
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
import { Switch } from "@moja/ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";
import { Badge } from "@moja/ui/components/ui/badge";

export function AdminSettingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "global" });

  // Suspense Queries
  const { data: settings } = useSuspenseQuery(
    trpc.payments.getPlatformSettings.queryOptions()
  );

  const { data: tiers } = useSuspenseQuery(
    trpc.payments.listCommissionTiers.queryOptions()
  );

  // Mutations
  const updateSettingsMutation = useMutation(
    trpc.payments.updatePlatformSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Platform settings updated successfully");
        queryClient.invalidateQueries(trpc.payments.getPlatformSettings.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update platform settings");
      },
    })
  );

  const createTierMutation = useMutation(
    trpc.payments.createCommissionTier.mutationOptions({
      onSuccess: () => {
        toast.success("Distance tier created successfully");
        setIsTierModalOpen(false);
        queryClient.invalidateQueries(trpc.payments.listCommissionTiers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create distance tier");
      },
    })
  );

  const updateTierMutation = useMutation(
    trpc.payments.updateCommissionTier.mutationOptions({
      onSuccess: () => {
        toast.success("Distance tier updated successfully");
        setIsTierModalOpen(false);
        queryClient.invalidateQueries(trpc.payments.listCommissionTiers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update distance tier");
      },
    })
  );

  const deleteTierMutation = useMutation(
    trpc.payments.deleteCommissionTier.mutationOptions({
      onSuccess: () => {
        toast.success("Distance tier deleted successfully");
        setIsDeleteConfirmOpen(false);
        queryClient.invalidateQueries(trpc.payments.listCommissionTiers.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete distance tier");
      },
    })
  );

  // Local Form state
  const [commissionPct, setCommissionPct] = useState<number | null>(null);
  const [conveniencePct, setConveniencePct] = useState<number | null>(null);

  // Synchronize state when settings data changes
  useEffect(() => {
    if (settings) {
      setCommissionPct(settings.defaultCommissionBps / 100);
      setConveniencePct(settings.defaultConvenienceFeeBps / 100);
    }
  }, [settings]);

  // Tier form state
  type Tier = (typeof tiers)[number];
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [tierLabel, setTierLabel] = useState("");
  const [tierMinDist, setTierMinDist] = useState("");
  const [tierMaxDist, setTierMaxDist] = useState("");
  const [tierCommBps, setTierCommBps] = useState("");
  const [tierSortOrder, setTierSortOrder] = useState("0");
  const [tierIsActive, setTierIsActive] = useState(true);

  // Delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<Tier | null>(null);

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (commissionPct === null || conveniencePct === null) return;
    
    updateSettingsMutation.mutate({
      defaultCommissionBps: Math.round(commissionPct * 100),
      defaultConvenienceFeeBps: Math.round(conveniencePct * 100),
    });
  };

  const openAddTier = () => {
    setEditingTier(null);
    setTierLabel("");
    setTierMinDist("");
    setTierMaxDist("");
    setTierCommBps("");
    setTierSortOrder("0");
    setTierIsActive(true);
    setIsTierModalOpen(true);
  };

  const openEditTier = (tier: any) => {
    setEditingTier(tier);
    setTierLabel(tier.label);
    setTierMinDist(tier.minDistanceKm.toString());
    setTierMaxDist(tier.maxDistanceKm ? tier.maxDistanceKm.toString() : "");
    setTierCommBps(tier.commissionBps.toString());
    setTierSortOrder(tier.sortOrder.toString());
    setTierIsActive(tier.isActive);
    setIsTierModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierLabel.trim() || !tierMinDist || !tierCommBps) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      label: tierLabel,
      minDistanceKm: parseFloat(tierMinDist),
      maxDistanceKm: tierMaxDist ? parseFloat(tierMaxDist) : null,
      commissionBps: parseInt(tierCommBps),
      sortOrder: parseInt(tierSortOrder) || 0,
      isActive: tierIsActive,
    };

    if (editingTier) {
      updateTierMutation.mutate({
        id: editingTier.id,
        ...payload,
      });
    } else {
      createTierMutation.mutate(payload);
    }
  };

  const confirmDeleteTier = (tier: any) => {
    setTierToDelete(tier);
    setIsDeleteConfirmOpen(true);
  };

  return (
    <Tabs value={activeTab ?? "global"} onValueChange={(val) => setActiveTab(val)} className="space-y-6">
      <TabsList className="bg-slate-100 p-1 rounded-md border border-slate-200">
        <TabsTrigger value="global" className="px-4 py-2 font-semibold text-xs flex items-center gap-1.5 rounded-sm transition-all">
          <Percent className="size-3.5" />
          Global Settings
        </TabsTrigger>
        <TabsTrigger value="tiers" className="px-4 py-2 font-semibold text-xs flex items-center gap-1.5 rounded-sm transition-all">
          <Layers className="size-3.5" />
          Commission Distance Tiers
        </TabsTrigger>
      </TabsList>

      {/* Global Settings Content */}
      <TabsContent value="global">
        <Card className="bg-white border-border shadow-sm max-w-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Default Global Rates</CardTitle>
            <CardDescription>
              These fee percentages apply to checkout calculations when no distance-based tier matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Default Commission */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Default Commission Rate (%)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={commissionPct !== null ? commissionPct : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCommissionPct(val === "" ? null : Number(val));
                      }}
                      className="h-10 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Platform's base revenue cut from operator seat ticket sales.
                  </p>
                </div>

                {/* Default Convenience Fee */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Convenience Fee Rate (%)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={conveniencePct !== null ? conveniencePct : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConveniencePct(val === "" ? null : Number(val));
                      }}
                      className="h-10 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Passenger service fee added to ticket subtotal during checkout.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white h-10 px-6 font-semibold"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-white" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Commission Tiers Content */}
      <TabsContent value="tiers">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Distance Commission Bands</h3>
              <p className="text-xs text-slate-500">
                Map platform commission rates dynamically based on the route travel distance.
              </p>
            </div>
            <Button onClick={openAddTier} className="bg-primary hover:bg-primary-hover text-white gap-1.5 h-9 font-semibold text-xs">
              <Plus className="size-3.5" />
              Add Distance Tier
            </Button>
          </div>

          {tiers && tiers.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Layers className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Distance Tiers</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  You haven't defined any distance-based commission tiers. All routes default to global platform rates.
                </p>
              </div>
            </div>
          ) : tiers ? (
            <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Label</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Distance Range</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Commission (Bps)</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Commission %</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Sort Order</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id} className="hover:bg-slate-50/50">
                      <TableCell className="px-4 py-3 font-semibold text-slate-900">{tier.label}</TableCell>
                      <TableCell className="px-4 py-3 text-slate-600 text-xs">
                        {tier.minDistanceKm} km
                        {tier.maxDistanceKm ? ` - ${tier.maxDistanceKm} km` : " +"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-600 text-xs font-mono">{tier.commissionBps} bps</TableCell>
                      <TableCell className="px-4 py-3 text-slate-900 text-xs font-bold">{(tier.commissionBps / 100).toFixed(2)}%</TableCell>
                      <TableCell className="px-4 py-3 text-slate-600 text-xs">{tier.sortOrder}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={tier.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                          {tier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                            onClick={() => openEditTier(tier)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => confirmDeleteTier(tier)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
      </TabsContent>

      {/* Tier Add/Edit Modal */}
      <Dialog open={isTierModalOpen} onOpenChange={setIsTierModalOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingTier ? "Edit Commission Distance Tier" : "Add Commission Distance Tier"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Setup distance bands in km and define the commission in basis points (1% = 100 bps).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTier} className="space-y-4 py-2">
            {/* Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tier Label
              </label>
              <Input
                type="text"
                placeholder="e.g. Short haul (Under 100km)"
                value={tierLabel}
                onChange={(e) => setTierLabel(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Min Distance */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Min Distance (km)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.1"
                  value={tierMinDist}
                  onChange={(e) => setTierMinDist(e.target.value)}
                  required
                />
              </div>

              {/* Max Distance */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Max Distance (km)
                </label>
                <Input
                  type="number"
                  placeholder="No limit"
                  min="0"
                  step="0.1"
                  value={tierMaxDist}
                  onChange={(e) => setTierMaxDist(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Commission in Bps */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Commission (Bps)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="500"
                    min="0"
                    max="10000"
                    value={tierCommBps}
                    onChange={(e) => setTierCommBps(e.target.value)}
                    required
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-semibold">bps</span>
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Sort Order
                </label>
                <Input
                  type="number"
                  min="0"
                  value={tierSortOrder}
                  onChange={(e) => setTierSortOrder(e.target.value)}
                />
              </div>
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <div className="text-xs font-bold text-slate-800">Tier Status</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Toggle active state for matching calculations</div>
              </div>
              <Switch checked={tierIsActive} onCheckedChange={setTierIsActive} />
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="h-9" onClick={() => setIsTierModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white h-9"
                disabled={createTierMutation.isPending || updateTierMutation.isPending}
              >
                {createTierMutation.isPending || updateTierMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5 text-white" />
                    Saving...
                  </>
                ) : (
                  "Save Tier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        {tierToDelete && (
          <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="size-5 text-red-600" />
                Delete Distance Tier
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Are you sure you want to delete the commission tier "{tierToDelete.label}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button variant="outline" className="h-9" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white h-9"
                disabled={deleteTierMutation.isPending}
                onClick={() => deleteTierMutation.mutate({ id: tierToDelete.id })}
              >
                {deleteTierMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5 text-white" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Tabs>
  );
}
