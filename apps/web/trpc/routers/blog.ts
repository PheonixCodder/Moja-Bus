import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init";
import { TRPCError } from "@trpc/server";

export const blogRouter = createTRPCRouter({
  // --- PUBLIC ENDPOINTS ---
  getPublishedPosts: publicProcedure
    .input(z.object({
      limit: z.number().default(20),
      cursor: z.string().nullish(),
      categorySlug: z.string().optional(),
      tagSlug: z.string().optional(),
      searchQuery: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        status: "PUBLISHED",
        deletedAt: null,
      };

      if (input.categorySlug) {
        where.category = { slug: input.categorySlug };
      }

      if (input.tagSlug) {
        where.tags = { some: { slug: input.tagSlug } };
      }

      if (input.searchQuery) {
        where.OR = [
          { title: { contains: input.searchQuery, mode: "insensitive" } },
          { excerpt: { contains: input.searchQuery, mode: "insensitive" } },
        ];
      }

      const posts = await ctx.prisma.blogPost.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { fullName: true, image: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (posts.length > input.limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  listCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        parent: { select: { name: true, slug: true } },
      },
    });
  }),

  listTags: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.blogTag.findMany({
      orderBy: { name: "asc" },
    });
  }),

  getPostBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.blogPost.findUnique({
        where: { slug: input.slug },
        include: {
          author: { select: { fullName: true, image: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!post || post.deletedAt || (post.status !== "PUBLISHED" && ctx.user?.role !== "ADMIN")) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return post;
    }),

  trackEvent: publicProcedure
    .input(z.object({
      postId: z.string(),
      eventType: z.enum(["VIEW", "READ_25", "READ_50", "READ_75", "READ_100", "CTA_CLICK", "SHARE"]),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create the event log
      ctx.prisma.blogEvent.create({
        data: {
          postId: input.postId,
          eventType: input.eventType,
          metadata: input.metadata ? (input.metadata as any) : undefined,
          userId: ctx.user?.id || null,
        },
      }).catch(console.error);

      // Increment total view count on the BlogPost model
      if (input.eventType === "VIEW") {
        ctx.prisma.blogPost.update({
          where: { id: input.postId },
          data: { viewCount: { increment: 1 } },
        }).catch(console.error);
      }

      return { success: true };
    }),
});
