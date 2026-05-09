"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PublicDoc = {
  id: string;
  title: string;
  upvote_count: number;
  query_count: number;
};

export function ProfileDocumentsCard({ docs }: { docs: PublicDoc[] }) {
  return (
    <Card className="border-border/60 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 text-primary" />
          Tai lieu da chia se
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {docs.length > 0 ? (
          <div className="grid gap-3">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href="/community"
                className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-background/55 p-4 transition-all hover:border-primary/20 hover:bg-accent/35"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {doc.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {doc.upvote_count} vote • {doc.query_count} luot dung
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">Chua chia se tai lieu nao</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thu vien cong khai se xuat hien tai day khi nguoi dung chia se tai lieu.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
