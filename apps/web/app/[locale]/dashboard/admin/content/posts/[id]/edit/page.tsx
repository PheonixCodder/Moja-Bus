import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { BlogEditView } from "@/features/admin/views/blog-edit-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Post | Admin",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await Promise.all([
    prefetch(trpc.admin.getBlogPostById.queryOptions({ id })),
    prefetch(trpc.admin.listBlogCategories.queryOptions()),
    prefetch(trpc.admin.listBlogTags.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <BlogEditView postId={id} />
    </HydrateClient>
  );
}
