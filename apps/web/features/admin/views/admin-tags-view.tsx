"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
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
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Edit2, Hash, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export function AdminTagsView() {
  const t = useTranslations("adminDashboard.adminTagsView");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState("");

  const { data: tags } = useSuspenseQuery(
    trpc.admin.listBlogTags.queryOptions(),
  );

  const createTag = useMutation({
    ...trpc.admin.createBlogTag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogTags.pathFilter());
      toast.success(t("tagCreated"));
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("failedToCreate"));
    },
  });

  const updateTag = useMutation({
    ...trpc.admin.updateBlogTag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogTags.pathFilter());
      toast.success(t("tagUpdated"));
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("failedToUpdate"));
    },
  });

  const deleteTag = useMutation({
    ...trpc.admin.deleteBlogTag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogTags.pathFilter());
      toast.success(t("tagDeleted"));
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("failedToDelete"));
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
    if (confirm(t("deleteConfirm"))) {
      deleteTag.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="gap-2 h-9 text-xs font-semibold"
        >
          <Plus className="size-4" />
          {t("addTag")}
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-1/2 text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                {t("tag")}
              </TableHead>
              <TableHead className="w-1/3 text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                {t("urlSlug")}
              </TableHead>
              <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-muted-foreground text-xs"
                >
                  {t("noTags")}
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-muted/50">
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground text-xs font-semibold">
                      <TagIcon className="size-3 text-muted-foreground" />
                      {tag.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {tag.slug}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        onClick={() => handleEdit(tag)}
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="size-3.5" />
                        <span className="sr-only">{t("edit")}</span>
                      </Button>
                      <Button
                        onClick={() => handleDelete(tag.id)}
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        disabled={deleteTag.isPending}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">{t("delete")}</span>
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
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Hash className="size-4 text-primary-foreground" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingTag ? t("editTag") : t("addTagTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("createKeywords")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label
                htmlFor="tag-name"
                className="text-xs font-bold text-foreground uppercase tracking-wider"
              >
                {t("name")}
              </label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="h-9 text-sm bg-background"
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
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  !name.trim() || createTag.isPending || updateTag.isPending
                }
                className="h-9 font-semibold text-xs"
              >
                {createTag.isPending || updateTag.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5" />
                    {t("saving")}
                  </>
                ) : (
                  t("saveTag")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
