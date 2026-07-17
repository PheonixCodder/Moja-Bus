"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Button } from "@moja/ui/components/ui/button";

type Redirect = {
  id: string;
  source: string;
  destination: string;
  type: number;
  createdAt: Date;
};

interface RedirectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirect?: Redirect | null;
}

const formSchema = z.object({
  source: z.string().min(1, "Source path is required").startsWith("/", "Must start with a /"),
  destination: z.string().min(1, "Destination path is required").startsWith("/", "Must start with a /"),
  type: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export function RedirectFormDialog({ open, onOpenChange, redirect }: RedirectFormDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!redirect;

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source: "",
      destination: "",
      type: 301,
    },
  });

  // Reset form when dialog opens/closes or when redirect prop changes
  useEffect(() => {
    if (open) {
      if (redirect) {
        reset({
          source: redirect.source,
          destination: redirect.destination,
          type: redirect.type,
        });
      } else {
        reset({
          source: "",
          destination: "",
          type: 301,
        });
      }
    }
  }, [open, redirect, reset]);

  const createMutation = useMutation(
    trpc.admin.createBlogRedirect.mutationOptions({
      onSuccess: () => {
        toast.success("Redirect created successfully");
        queryClient.invalidateQueries(trpc.admin.listBlogRedirects.pathFilter());
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create redirect");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.admin.updateBlogRedirect.mutationOptions({
      onSuccess: () => {
        toast.success("Redirect updated successfully");
        queryClient.invalidateQueries(trpc.admin.listBlogRedirects.pathFilter());
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update redirect");
      },
    })
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: FormValues) {
    if (isEditing && redirect) {
      updateMutation.mutate({ id: redirect.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Redirect" : "Create Redirect"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the source, destination, or redirect type." 
              : "Map an old URL path to a new destination to preserve SEO rankings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Source Path</label>
            <Input placeholder="/old-blog-post-url" className="font-mono text-sm" {...register("source")} />
            {errors.source && <p className="text-[0.8rem] font-medium text-destructive">{errors.source.message}</p>}
            <p className="text-[0.8rem] text-muted-foreground">The old URL path (must start with /)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Destination Path</label>
            <Input placeholder="/blog/new-post-url" className="font-mono text-sm" {...register("destination")} />
            {errors.destination && <p className="text-[0.8rem] font-medium text-destructive">{errors.destination.message}</p>}
            <p className="text-[0.8rem] text-muted-foreground">Where the user should be redirected</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Redirect Type</label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val as string, 10))}
                  value={field.value.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301 - Permanent</SelectItem>
                    <SelectItem value="302">302 - Temporary</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-[0.8rem] font-medium text-destructive">{errors.type.message}</p>}
            <p className="text-[0.8rem] text-muted-foreground">Use 301 for SEO preservation. Use 302 for temporary campaigns.</p>
          </div>

          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Redirect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
