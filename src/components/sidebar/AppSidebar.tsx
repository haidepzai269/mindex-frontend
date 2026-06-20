"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { NavMain } from "./NavMain"
import { NavRecentDocs } from "./NavRecentDocs"
import { SidebarHeaderContent } from "./SidebarHeader"
import { NavUser } from "./NavUser"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeaderContent />
      <SidebarContent>
        <NavMain />
        <SidebarSeparator />
        <NavRecentDocs />
      </SidebarContent>
      <NavUser />
    </Sidebar>
  )
}
