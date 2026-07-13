import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@moja/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Check authorization header (Vercel Cron sends a Bearer token)
  const authHeader = request.headers.get("authorization");
  if (
    process.env["CRON_SECRET"] &&
    authHeader !== `Bearer ${process.env["CRON_SECRET"]}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // Update them to PUBLISHED
    const updated = await prisma.blogPost.updateMany({
      where: {
        id: {
          in: postsToPublish.map((p) => p.id),
        },
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        scheduledFor: null,
      },
    });

    // Revalidate the blog cache so Next.js serves the new posts
    revalidatePath("/blog");

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
