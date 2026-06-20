"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import useSWR from "swr"
import { fetcher } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { formatTimeAgo } from "@/lib/time"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavRecentDocs() {
  const { state, setOpenMobile } = useSidebar()
  const user = useAuthStore((state) => state.user)

  const { data: docsData } = useSWR<{ success: boolean; data: any[] }>(
    user ? "/documents" : null,
    fetcher as any
  )
  const recentDocs = docsData?.data?.slice(0, 10) || []

  if (state === "collapsed") return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tài liệu gần đây</SidebarGroupLabel>
      <SidebarMenu>
        {recentDocs.length > 0 ? (
          recentDocs.map((doc) => (
            <SidebarMenuItem key={doc.id}>
              <SidebarMenuButton
                render={<Link href={`/doc/${doc.id}/chat`} />}
                onClick={() => setOpenMobile(false)}
                className="h-auto py-1.5"
              >
                <FileText className="shrink-0" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm">{doc.title}</span>
                  {(doc.shared_at || doc.created_at) && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(doc.shared_at || doc.created_at)}
                    </span>
                  )}
                </div>
                {doc.expired_at && (
                  <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        ) : (
          <div className="px-4 py-2 text-xs italic text-muted-foreground">
            Chưa có tài liệu nào
          </div>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
