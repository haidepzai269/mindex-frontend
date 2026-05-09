"use client";

import { Globe, LibraryBig, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PublicProfile = {
  name: string;
  tier: string;
  bio?: string;
  avatar_url?: string;
  public_docs?: Array<{ id: string }>;
  badges?: string[];
};

function tierClasses(tier: string) {
  if (tier === "PRO") {
    return {
      border: "border-amber-400/40",
      ring: "ring-amber-400/25",
      badge: "border-amber-400/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    };
  }

  if (tier === "ULTRA") {
    return {
      border: "border-rose-400/40",
      ring: "ring-rose-400/25",
      badge: "border-rose-400/30 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    };
  }

  return {
    border: "border-border",
    ring: "ring-border/50",
    badge: "border-border bg-muted/30 text-muted-foreground",
  };
}

export function ProfileHero({ profile }: { profile: PublicProfile }) {
  const tierStyle = tierClasses(profile.tier);

  return (
    <Card className="overflow-hidden border-border/60 bg-card/85 shadow-sm backdrop-blur">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <CardContent className="relative pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
          <Avatar className={cn("h-24 w-24 border-2 ring-4", tierStyle.border, tierStyle.ring)}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="text-2xl font-black">
                {profile.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                  {profile.name}
                </h1>
                <Badge variant="outline" className={tierStyle.badge}>
                  {profile.tier}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {profile.bio || "Nguoi dung nay chua them mo ta ca nhan."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LibraryBig className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Tai lieu cong khai</span>
                </div>
                <p className="mt-2 text-2xl font-black text-foreground">{profile.public_docs?.length || 0}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Huy hieu</span>
                </div>
                <p className="mt-2 text-2xl font-black text-foreground">{profile.badges?.length || 0}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Ho so cong khai</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">Dang hien thi</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
