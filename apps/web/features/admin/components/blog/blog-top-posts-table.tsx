"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";

import { useTranslations } from "next-intl";

interface BlogTopPostsTableProps {
  posts: Array<{
    id: string;
    title: string;
    status: string;
    viewCount: number;
    category: { name: string } | null;
    _count: { events: number };
  }>;
}

export function BlogTopPostsTable({ posts }: BlogTopPostsTableProps) {
  const t = useTranslations("adminDashboard.blogTopPostsTable");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50%] pl-6">{t("post")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("views")}</TableHead>
              <TableHead className="text-right pr-6">{t("shares")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-slate-500"
                >
                  {t("noPosts")}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-medium">
                    <div className="truncate max-w-[400px]">{post.title}</div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {post.category?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "PUBLISHED" ? "default" : "secondary"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600 font-medium">
                    {post.viewCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums pr-6 text-slate-600">
                    {post._count.events.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
