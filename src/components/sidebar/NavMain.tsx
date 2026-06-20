"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Sparkles,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavSubItem = {
  title: string
  href: string
}

type NavItem = {
  title: string
  icon: LucideIcon
  children: NavSubItem[]
}

const navItems: NavItem[] = [
  {
    title: "Tài liệu",
    icon: BookOpen,
    children: [
      { title: "Thư viện của tôi", href: "/library" },
      { title: "Tải lên mới", href: "/upload" },
    ],
  },
  {
    title: "Trợ lý AI",
    icon: Sparkles,
    children: [
      { title: "Chat với AI", href: "/chat/ai/new" },
      { title: "Kế hoạch học", href: "/planner" },
    ],
  },
  {
    title: "Cộng đồng",
    icon: Users,
    children: [
      { title: "Phòng học nhóm", href: "/rooms" },
      { title: "Thư viện chung", href: "/community" },
    ],
  },
  {
    title: "Theo dõi",
    icon: BarChart3,
    children: [
      { title: "Trang chủ", href: "/dashboard" },
      { title: "Tiến trình", href: "/analytics" },
    ],
  },
  {
    title: "Cài đặt",
    icon: Settings,
    children: [
      { title: "Hồ sơ", href: "/settings/profile" },
      { title: "Mật khẩu", href: "/settings/password" },
      { title: "Thanh toán", href: "/settings/billings" },
      { title: "Giao diện", href: "/settings/theme" },
      { title: "Góp ý", href: "/settings/feedbacks" },
      { title: "Giới thiệu", href: "/settings/abouts" },
    ],
  },
]

function isChildActive(item: NavItem, pathname: string): boolean {
  return item.children.some((child) => {
    if (child.href === "/chat/ai/new") {
      return pathname.startsWith("/chat/ai")
    }
    return pathname === child.href || pathname.startsWith(child.href + "/")
  })
}

export function NavMain() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    for (const item of navItems) {
      if (isChildActive(item, pathname)) {
        initial[item.title] = true
      }
    }
    setOpenItems((prev) => ({ ...prev, ...initial }))
  }, [pathname])

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {navItems.map((item) => {
          const isOpen = openItems[item.title] ?? false
          return (
            <Collapsible
              key={item.title}
              open={isOpen}
              onOpenChange={() => toggleItem(item.title)}
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<CollapsibleTrigger />}
                  tooltip={item.title}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  <ChevronRight
                    className={`ml-auto transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </SidebarMenuButton>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children.map((child) => {
                      const active =
                        child.href === "/chat/ai/new"
                          ? pathname.startsWith("/chat/ai")
                          : pathname === child.href ||
                            pathname.startsWith(child.href + "/")
                      return (
                        <SidebarMenuSubItem key={child.href}>
                          <SidebarMenuSubButton
                            render={<Link href={child.href} />}
                            isActive={active}
                            onClick={() => setOpenMobile(false)}
                          >
                            <span>{child.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
