import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { BlogEditView } from "@/features/admin/views/blog-edit-view";

export default async function EditBlogPostPage({
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
