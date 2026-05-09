import Link from "next/link";
import { ArrowLeft, BookOpen, Compass, FileSearch, Network, Upload } from "lucide-react";

const recoveryLinks = [
  {
    href: "/library",
    label: "Ve Thu vien",
    description: "Mo lai cac tai lieu va cuoc tro chuyen gan day",
    icon: BookOpen,
    primary: true,
  },
  {
    href: "/upload",
    label: "Tai tai lieu moi",
    description: "Khoi tao mot neural route moi tu tai lieu cua ban",
    icon: Upload,
  },
  {
    href: "/community",
    label: "Kham pha Community",
    description: "Di theo cac luong kien thuc duoc chia se trong Mindex",
    icon: Compass,
  },
];

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_32%)]" />
      <div className="pointer-events-none absolute left-[-10%] top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-primary/10 blur-[160px]" />

      <div className="relative w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card/80 p-8 shadow-xl backdrop-blur-3xl md:p-10">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_30px_hsl(var(--primary)/0.18)]">
                <Network size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/80">Neural Route Lost</p>
                <p className="text-xs font-medium text-muted-foreground">Mindex Intelligence could not map this page.</p>
              </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-[1fr_1.1fr_1fr]">
              <div className="rounded-[1.75rem] border border-border bg-background/70 p-5">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">Node A</span>
                  <div className="h-2 w-2 rounded-full bg-primary/50" />
                </div>
                <div className="text-[clamp(3rem,8vw,5rem)] font-black leading-none tracking-[-0.08em] text-foreground/95">4</div>
                <div className="mt-6 h-2 w-20 rounded-full bg-muted" />
                <div className="mt-2 h-2 w-14 rounded-full bg-muted/70" />
              </div>

              <div className="relative rounded-[1.75rem] border border-primary/20 bg-primary/[0.07] p-5 shadow-[0_0_40px_hsl(var(--primary)/0.12)]">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/80">Core Scan</span>
                  <span className="rounded-full border border-primary/20 bg-background/70 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                    404
                  </span>
                </div>
                <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-primary/20" />
                  <div className="absolute inset-3 rounded-full border border-primary/25 border-dashed animate-spin-slow" />
                  <div className="absolute inset-7 rounded-full border border-primary/15" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-background text-2xl font-black text-primary shadow-[0_0_25px_hsl(var(--primary)/0.18)]">
                    0
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-background/70 p-5">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">Node B</span>
                  <div className="h-2 w-2 rounded-full bg-rose-400/80" />
                </div>
                <div className="text-right text-[clamp(3rem,8vw,5rem)] font-black leading-none tracking-[-0.08em] text-foreground/95">4</div>
                <div className="mt-6 ml-auto h-2 w-20 rounded-full bg-muted" />
                <div className="mt-2 ml-auto h-2 w-12 rounded-full bg-muted/70" />
              </div>
            </div>

            <div className="max-w-2xl">
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
                Khong tim thay trang trong mang tri thuc nay
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Lien ket ban mo co the da het han, bi di chuyen, hoac khong con nam trong luong hoc tap hien tai cua
                Mindex.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/library"
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/15 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
              >
                <ArrowLeft size={16} />
                Quay ve thu vien
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/80 px-5 py-3 text-sm font-bold text-foreground transition-all hover:border-primary/20 hover:bg-accent"
              >
                <Upload size={16} />
                Tao route moi
              </Link>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-border bg-card/70 p-6 shadow-lg backdrop-blur-2xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <FileSearch size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">AI Recovery Suggestions</p>
                  <p className="text-sm font-semibold text-foreground">Chon diem quay lai hop ly</p>
                </div>
              </div>

              <div className="space-y-3">
                {recoveryLinks.map(({ href, label, description, icon: Icon, primary }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-start gap-4 rounded-[1.5rem] border p-4 transition-all ${
                      primary
                        ? "border-primary/20 bg-primary/10 hover:bg-primary/15"
                        : "border-border bg-background/70 hover:border-primary/20 hover:bg-accent/40"
                    }`}
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-background/80 text-primary">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black tracking-tight text-foreground">{label}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-muted/30 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/80">Neural Core Status</p>
              <div className="mt-4 flex items-center justify-between rounded-[1.5rem] border border-border bg-background/80 px-4 py-3">
                <div>
                  <p className="text-sm font-black tracking-tight text-foreground">Route integrity check</p>
                  <p className="text-xs text-muted-foreground">Khong co du lieu hop le tai diem truy cap nay</p>
                </div>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                  Reroute
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
