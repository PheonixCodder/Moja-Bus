"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PenLine } from "lucide-react";
import { Input } from "@moja/ui/components/ui/input";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@moja/ui/components/ui/dialog";

interface NewBlogPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBlogPostDialog({ open, onOpenChange }: NewBlogPostDialogProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [title, setTitle] = useState("");

  const createDraft = useMutation({
    ...trpc.admin.createBlogPostDraft.mutationOptions(),
    onSuccess: (data: any) => {
      onOpenChange(false);
      setTitle("");
      router.push(`/dashboard/admin/content/posts/${data.id}/edit`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create blog post draft");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createDraft.mutate({ title, content: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <PenLine className="size-4 text-white" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create New Post
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Give your post a title to get started. You can change everything later in the full editor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label
              htmlFor="new-post-title"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Post Title
            </label>
            <Input
              id="new-post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5 Tips for Safe Intercity Travel"
              className="h-10 text-sm"
              autoFocus
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => onOpenChange(false)}
              disabled={createDraft.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createDraft.isPending}
              className="h-9 bg-slate-900 hover:bg-slate-800 text-white"
            >
              {createDraft.isPending ? (
                <>
                  <Spinner className="mr-2 size-3.5 text-white" />
                  Creating...
                </>
              ) : (
                "Create Draft"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
