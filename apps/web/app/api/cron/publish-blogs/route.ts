import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@moja/db";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // P3-10 — shared fail-closed cron auth (was an inline variant).
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();

  try {
    const now = new Date();

    // Find posts that are SCHEDULED and whose time has passed
    const postsToPublish = await prisma.blogPost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          lte: now,
        },
        deletedAt: null,
      },
    });

    if (postsToPublish.length === 0) {
      return NextResponse.json({ publishedCount: 0 });
    }

    // Update them to PUBLISHED while filtering by SCHEDULED to prevent race conditions
    const updated = await prisma.blogPost.updateMany({
      where: {
        id: {
          in: postsToPublish.map((p) => p.id),
        },
        status: "SCHEDULED",
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        scheduledFor: null,
      },
    });

    // Revalidate the public blog index and each newly published post details cache
    revalidatePath("/blog");
    for (const post of postsToPublish) {
      revalidatePath(`/blog/${post.slug}`);
    }

    return NextResponse.json({
      success: true,
      publishedCount: updated.count,
    });
  } catch (error) {
    console.error("Failed to execute publish-blogs cron:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
