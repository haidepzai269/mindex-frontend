import type { Metadata } from "next";
import type { ReactNode } from "react";

import UserLayoutClient from "./UserLayoutClient";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata({
  title: {
    default: "Khong gian hoc tap | Mindex",
    template: "%s | Mindex",
  },
  description: "Khong gian hoc tap ca nhan va cong cu AI noi bo cua Mindex.",
});

export default function UserLayout({ children }: { children: ReactNode }) {
  return <UserLayoutClient>{children}</UserLayoutClient>;
}
