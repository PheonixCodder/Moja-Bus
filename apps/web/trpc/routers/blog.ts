import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@moja/db";

export const blogRouter = createTRPCRouter({
  // --- PUBLIC ENDPOINTS ---
  getPublishedPosts: publicProcedure
    .input(z.object({
      limit: z.number().default(20),
      cursor: z.string().nullish(),
      offset: z.number().int().min(0).optional(),
      categorySlug: z.string().optional(),
      tagSlug: z.string().optional(),
      searchQuery: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.BlogPostWhereInput = {
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
        ...(input.offset !== undefined && { skip: input.offset }),
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { fullName: true, image: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { id: true, name: true, slug: true } },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (posts.length > input.limit) {
        const nextItem = posts.pop();
        if (nextItem) {
          nextCursor = nextItem.id;
        }
      }

      // Sanitize internal moderation and analytics fields before returning to client
      const sanitizedPosts = posts.map((post) => {
        const {
          lastReviewedById,
          deletedById,
          robots,
          viewCount,
          completionRate,
          ...publicPost
        } = post;
        return publicPost;
      });

      return {
        posts: sanitizedPosts,
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

      // Sanitize internal moderation and analytics fields before returning to client
      const {
        lastReviewedById,
        deletedById,
        robots,
        viewCount,
        completionRate,
        ...publicPost
      } = post;

      return publicPost;
    }),

  trackEvent: publicProcedure
    .input(z.object({
      postId: z.string(),
      eventType: z.enum(["VIEW", "READ_25", "READ_50", "READ_75", "READ_100", "CTA_CLICK", "SHARE"]),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate that target post exists and is active (Abuse Prevention)
      const post = await ctx.prisma.blogPost.findUnique({
        where: { id: input.postId, deletedAt: null, status: "PUBLISHED" },
        select: { id: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target post not found or not published",
        });
      }

      // Create the event log and await it
      await ctx.prisma.blogEvent.create({
        data: {
          postId: input.postId,
          eventType: input.eventType,
          metadata: input.metadata ? (input.metadata as any) : undefined,
          userId: ctx.user?.id || null,
        },
      });

      // Increment total view count on the BlogPost model and await it
      if (input.eventType === "VIEW") {
        await ctx.prisma.blogPost.update({
          where: { id: input.postId },
          data: { viewCount: { increment: 1 } },
        });
      }

      return { success: true };
    }),
});
