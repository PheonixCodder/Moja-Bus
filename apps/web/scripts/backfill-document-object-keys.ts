/**
 * One-time backfill: derive `objectKey` for existing public CompanyDocuments
 * from their stored `fileUrl`, so legacy docs can also be deleted via the
 * storage API. Run against a LIVE database:
 *
 *   pnpm --filter web tsx scripts/backfill-document-object-keys.ts
 *
 * Idempotent: skips rows that already have an objectKey.
 */
import { PrismaClient } from "@moja/db";

function deriveObjectKey(fileUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(fileUrl);
  } catch {
    return null;
  }

  const bucket = process.env["S3_BUCKET"];
  const endpoint = process.env["S3_ENDPOINT"];
  const publicBase = process.env["S3_PUBLIC_URL_BASE"];

  let path = url.pathname.replace(/^\/+/, "");

  // Path-style: https://endpoint/bucket/key  -> strip bucket
  if (endpoint && url.hostname === new URL(endpoint).hostname && bucket) {
    path = path.replace(new RegExp(`^${bucket}/`), "");
  }
  // Virtual-hosted with explicit bucket prefix in path (rare) -> strip bucket
  if (bucket && path.startsWith(`${bucket}/`)) {
    path = path.replace(`${bucket}/`, "");
  }
  // Custom public base
  if (publicBase) {
    const base = publicBase.replace(/\/+$/, "");
    if (fileUrl.startsWith(base)) {
      path = fileUrl.slice(base.length).replace(/^\/+/, "");
    }
  }

  return path || null;
}

async function main() {
  const prisma = new PrismaClient();
  const docs = await prisma.companyDocument.findMany({
    where: { objectKey: null, NOT: { fileUrl: "" } },
    select: { id: true, fileUrl: true },
  });

  let updated = 0;
  for (const doc of docs) {
    const objectKey = deriveObjectKey(doc.fileUrl);
    if (!objectKey) {
      console.warn(`[skip] could not derive key for ${doc.id} (${doc.fileUrl})`);
      continue;
    }
    await prisma.companyDocument.update({
      where: { id: doc.id },
      data: { objectKey },
    });
    updated++;
  }

  console.log(`Backfilled ${updated}/${docs.length} document object keys.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
