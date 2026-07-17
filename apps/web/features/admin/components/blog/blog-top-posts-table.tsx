"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Posts</CardTitle>
        <CardDescription>Most viewed content in the selected period</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50%] pl-6">Post</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right pr-6">Shares</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  No posts found.
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
                      variant={post.status === "PUBLISHED" ? "default" : "secondary"}
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
