import type { ReactNode } from "react";

import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata({
  title: "Tai khoan",
  description: "Dang nhap, dang ky va khoi phuc tai khoan Mindex.",
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
