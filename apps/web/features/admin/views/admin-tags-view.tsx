"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Tag as TagIcon, Hash } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@moja/ui/components/ui/dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";

export function AdminTagsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [name, setName] = useState("");

  const { data: tags } = useSuspenseQuery(
    trpc.admin.listBlogTags.queryOptions()
  );

  const createTag = useMutation({
    ...trpc.admin.createBlogTag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogTags.pathFilter());
      toast.success("Tag created successfully");
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create tag");
    },
  });

  const updateTag = useMutation({
    ...trpc.admin.updateBlogTag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogTags.pathFilter());
      toast.success("Tag updated successfully");
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update tag");
    },
  });

  const deleteTag = useMutation({
    ...trpc.admin.deleteBlogTag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogTags.pathFilter());
      toast.success("Tag deleted");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to delete tag");
    },
  });

  const resetForm = () => {
    setName("");
    setEditingTag(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (tag: any) => {
    setEditingTag({ id: tag.id, name: tag.name });
    setName(tag.name);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTag) {
      updateTag.mutate({ id: editingTag.id, name });
    } else {
      createTag.mutate({ name });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tag? It will be removed from all posts using it.")) {
      deleteTag.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Blog Tags</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage keywords used to label and filter blog content.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="gap-2 bg-slate-900 text-white hover:bg-slate-800 h-9 text-xs font-semibold"
        >
          <Plus className="size-4" />
          Add Tag
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="w-1/2 text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Tag</TableHead>
              <TableHead className="w-1/3 text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">URL Slug</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-slate-400 text-xs">
                  No tags found. Click "Add Tag" to get started.
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-slate-50/50">
                  <TableCell className="px-4 py-3 text-sm font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                      <TagIcon className="size-3 text-slate-500" />
                      {tag.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-500 font-mono">
                    {tag.slug}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        onClick={() => handleEdit(tag)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
                      >
                        <Edit2 className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleDelete(tag.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        disabled={deleteTag.isPending}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                <Hash className="size-4 text-white" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingTag ? "Edit Tag" : "Add Tag"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Create keywords to label posts (e.g. news, safety, travel).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label htmlFor="tag-name" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Name
              </label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. travel-safety"
                className="h-9 text-sm bg-white"
                required
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={resetForm}
                disabled={createTag.isPending || updateTag.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || createTag.isPending || updateTag.isPending}
                className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
              >
                {createTag.isPending || updateTag.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5 text-white" />
                    Saving...
                  </>
                ) : (
                  "Save Tag"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
