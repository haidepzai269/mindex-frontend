"use client";

import { use } from "react";
import { Loader2, UserRoundX } from "lucide-react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { ProfileBadgesCard } from "@/components/user/profile/ProfileBadgesCard";
import { ProfileDocumentsCard } from "@/components/user/profile/ProfileDocumentsCard";
import { ProfileHero } from "@/components/user/profile/ProfileHero";

type PublicDoc = {
  id: string;
  title: string;
  upvote_count: number;
  query_count: number;
};

type PublicProfile = {
  name: string;
  tier: string;
  bio?: string;
  avatar_url?: string;
  badges?: string[];
  public_docs?: PublicDoc[];
};

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useSWR(`/users/${id}/profile`, (url: string) => fetchApi(url)) as {
    data: { data?: PublicProfile } | undefined;
    isLoading: boolean;
  };

  const profile = data?.data;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Dang tai ho so cong khai...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-4">
        <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/40 px-8 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/60">
            <UserRoundX className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">Khong tim thay nguoi dung</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ho so nay co the da bi an hoac khong ton tai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="relative overflow-hidden border-b border-border/60 px-4 pb-6 pt-6 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_22%)]" />
        <div className="relative space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-background/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            Public Learning Profile
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            Ho so cong khai
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Xem thanh tich hoc tap va nhung tai lieu cong khai ma nguoi dung dang chia se tren Mindex.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 pb-20 md:px-8">
        <ProfileHero profile={profile} />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <ProfileBadgesCard badges={profile.badges || []} />
          <ProfileDocumentsCard docs={profile.public_docs || []} />
        </div>
      </div>
    </div>
  );
}
