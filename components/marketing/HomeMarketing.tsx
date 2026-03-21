"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import {
  ArrowRight,
  Table2,
  KanbanSquare,
  Calendar,
  GanttChart,
  MapPin,
  LayoutGrid,
  PenLine,
  Blocks,
  Sparkles,
  Zap,
  Shield,
  WifiOff,
  Workflow,
  Keyboard,
  Globe,
  BarChart3,
  Brain,
} from "lucide-react";

import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/utils";

function FadeInWhenVisible({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

const VIEWS = [
  { icon: Table2, label: "Table" },
  { icon: KanbanSquare, label: "Board" },
  { icon: Calendar, label: "Calendar" },
  { icon: GanttChart, label: "Timeline" },
  { icon: MapPin, label: "Map" },
  { icon: LayoutGrid, label: "Gallery" },
  { icon: BarChart3, label: "Charts" },
  { icon: Brain, label: "Mind" },
] as const;

const CAPABILITIES = [
  {
    icon: PenLine,
    title: "Block editor",
    desc: "31 block types. Slash commands, drag to reorder, columns, synced blocks, math, code with syntax highlighting.",
  },
  {
    icon: Blocks,
    title: "Structured data",
    desc: "20 property types — selects, dates, relations, rollups, formulas, files, people, locations. Filter, sort, group anything.",
  },
  {
    icon: Sparkles,
    title: "8 ways to see it",
    desc: "Table, board, gallery, list, calendar, timeline, map, and mind view. Same data, different lens. Switch in one click.",
  },
  {
    icon: Zap,
    title: "Realtime collaboration",
    desc: "Live cursors, presence indicators, inline and block comments, @mentions. See who's editing what, right now.",
  },
  {
    icon: Shield,
    title: "Roles & permissions",
    desc: "Owner, admin, editor, viewer, commenter. Private sections stay private. Lock any document read-only.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    desc: "Local-first mutation queue. Edit without connection, sync automatically when you're back. No work lost.",
  },
] as const;

const BEYOND = [
  {
    icon: Brain,
    title: "Mind view",
    desc: "Your entire workspace as a zoomable, interactive flowchart. See the shape of your thinking.",
  },
  {
    icon: MapPin,
    title: "Location property & map",
    desc: "Geocoded pins on a real map. Filter entries, click to open, add pins by dropping on the canvas.",
  },
  {
    icon: Calendar,
    title: "Reminder events",
    desc: "Lightweight calendar entries with checkboxes and recurrence. Not everything needs to be a full entry.",
  },
  {
    icon: BarChart3,
    title: "Built-in charts",
    desc: "Bar, line, and donut charts generated from your data. No third-party embed needed.",
  },
  {
    icon: Workflow,
    title: "MCP server",
    desc: "Expose your workspace to AI agents via the Model Context Protocol. Search, read, create — programmatically.",
  },
  {
    icon: Keyboard,
    title: "Fully remappable shortcuts",
    desc: "Every keyboard shortcut is customizable. Export and import your keybinding config as JSON.",
  },
  {
    icon: PenLine,
    title: "Daily notes & quick capture",
    desc: "Auto-generated daily pages. Global shortcut to capture a thought from anywhere and append it to your inbox.",
  },
  {
    icon: Globe,
    title: "Publish to web",
    desc: "One toggle to make any page public. Custom slug, SEO fields, optional password gate, embeddable.",
  },
] as const;

export function HomeMarketing(): JSX.Element {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <main className="cursor-default-text hide-scrollbar relative h-screen overflow-y-auto bg-bg-0 text-text-primary antialiased selection:bg-accent-muted selection:text-text-primary">
      {/* ------------------------------------------------------------------ */}
      {/*  HERO                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.04), transparent 70%)",
          }}
        />

        <motion.div
          className="relative z-10 flex max-w-3xl flex-col items-center text-center"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          {/* Giant "Lobe" wordmark */}
          <h1 className="font-display text-[clamp(6rem,22vw,14rem)] font-extrabold leading-[0.85] tracking-[-0.05em] text-transparent [-webkit-text-stroke:2px_var(--text-primary)]">
            {"Lobe".split("").map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.05 + i * 0.06,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="mt-6 font-display text-[clamp(1.1rem,2.5vw,1.5rem)] font-extrabold leading-snug tracking-[-0.01em] text-text-secondary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            Think in structure. Build in flow.
          </motion.p>

          <motion.p
            className="mt-4 max-w-lg text-base leading-relaxed text-text-tertiary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            A workspace where writing, structured data, and visual
            layouts live together — with offline support, realtime
            collaboration, and an API for AI agents.
          </motion.p>

          <motion.div
            className="mt-10 flex gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.85,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <ButtonLink
              href="/signup"
              variant="default"
              size="lg"
              className="group gap-2 px-6"
            >
              Get started
              <ArrowRight
                size={14}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </ButtonLink>
            <ButtonLink href="/login" variant="outline" size="lg" className="px-6">
              Sign in
            </ButtonLink>
          </motion.div>
        </motion.div>

      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  VIEW RIBBON                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border-subtle bg-bg-1/50 backdrop-blur-sm">
        <div className="hide-scrollbar mx-auto flex max-w-5xl items-center justify-center gap-1 overflow-x-auto px-6 py-4 sm:gap-2">
          {VIEWS.map(({ icon: Icon, label }, i) => (
            <FadeInWhenVisible key={label} delay={i * 0.04}>
              <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border-subtle bg-bg-2/60 px-3.5 py-2 text-sm text-text-secondary transition-colors duration-150 hover:border-border-default hover:text-text-primary">
                <Icon size={14} />
                <span className="whitespace-nowrap">{label}</span>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  CAPABILITIES GRID                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-6 py-28 sm:py-36">
        <FadeInWhenVisible>
          <p className="text-xs font-medium uppercase tracking-widest text-text-tertiary">
            What you get
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything in one place.
            <br />
            <span className="text-text-secondary">Nothing in the way.</span>
          </h2>
        </FadeInWhenVisible>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, desc }, i) => (
            <FadeInWhenVisible key={title} delay={i * 0.06}>
              <div className="group flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-1 p-7 transition-colors duration-150 hover:border-border-default hover:bg-bg-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-bg-2 transition-colors duration-150 group-hover:border-border-default">
                  <Icon size={16} className="text-text-secondary" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {desc}
                </p>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  EDITOR SHOWCASE (typographic)                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border-subtle bg-bg-1/40">
        <div className="mx-auto max-w-3xl px-6 py-28 sm:py-36">
          <FadeInWhenVisible>
            <p className="text-xs font-medium uppercase tracking-widest text-text-tertiary">
              The editor
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Write without friction.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-text-secondary">
              31 block types, from paragraphs and headings to LaTeX math,
              syntax-highlighted code, column layouts, synced blocks, and
              embeds from Figma, YouTube, GitHub, and more.
            </p>
          </FadeInWhenVisible>

          {/* Simulated editor chrome */}
          <FadeInWhenVisible delay={0.15}>
            <div className="mt-12 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-bg-0 shadow-lg">
              <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-bg-4" />
                <span className="h-2.5 w-2.5 rounded-full bg-bg-4" />
                <span className="h-2.5 w-2.5 rounded-full bg-bg-4" />
                <span className="ml-3 text-xs text-text-tertiary">
                  Untitled
                </span>
              </div>
              <div className="px-10 py-10 sm:px-16 sm:py-14">
                <div className="space-y-5">
                  <div className="h-8 w-3/4 rounded-[var(--radius-sm)] bg-bg-3/60" />
                  <div className="space-y-2.5">
                    <div className="h-3.5 w-full rounded-[var(--radius-sm)] bg-bg-2" />
                    <div className="h-3.5 w-full rounded-[var(--radius-sm)] bg-bg-2" />
                    <div className="h-3.5 w-5/6 rounded-[var(--radius-sm)] bg-bg-2" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2 rounded-[var(--radius-md)] border border-border-subtle bg-bg-1 p-4">
                      <div className="h-3 w-2/3 rounded-[var(--radius-sm)] bg-bg-3/60" />
                      <div className="h-3 w-full rounded-[var(--radius-sm)] bg-bg-2" />
                      <div className="h-3 w-4/5 rounded-[var(--radius-sm)] bg-bg-2" />
                    </div>
                    <div className="flex-1 space-y-2 rounded-[var(--radius-md)] border border-border-subtle bg-bg-1 p-4">
                      <div className="h-3 w-1/2 rounded-[var(--radius-sm)] bg-bg-3/60" />
                      <div className="h-3 w-full rounded-[var(--radius-sm)] bg-bg-2" />
                      <div className="h-3 w-3/4 rounded-[var(--radius-sm)] bg-bg-2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[true, false, true].map((checked, j) => (
                      <div key={j} className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-[2px] border",
                            checked
                              ? "border-accent bg-accent"
                              : "border-border-default bg-transparent"
                          )}
                        />
                        <div
                          className={cn(
                            "h-3 rounded-[var(--radius-sm)]",
                            checked ? "w-1/3 bg-bg-3/40" : "w-2/5 bg-bg-2"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-bg-1">
                    <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
                      <span className="text-[10px] font-mono text-text-tertiary">
                        typescript
                      </span>
                      <div className="h-2 w-8 rounded-full bg-bg-3" />
                    </div>
                    <div className="space-y-1.5 px-4 py-3">
                      <div className="h-2.5 w-3/4 rounded-[var(--radius-sm)] bg-bg-2" />
                      <div className="h-2.5 w-full rounded-[var(--radius-sm)] bg-bg-2" />
                      <div className="h-2.5 w-2/3 rounded-[var(--radius-sm)] bg-bg-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  BEYOND — what Lobe adds                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-6 py-28 sm:py-36">
        <FadeInWhenVisible>
          <p className="text-xs font-medium uppercase tracking-widest text-text-tertiary">
            Beyond the baseline
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Things you won&rsquo;t find elsewhere.
          </h2>
        </FadeInWhenVisible>

        <div className="mt-16 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BEYOND.map(({ icon: Icon, title, desc }, i) => (
            <FadeInWhenVisible key={title} delay={i * 0.05} className="flex">
              <div className="group flex flex-1 flex-col gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-1 p-6 transition-colors duration-150 hover:border-border-default hover:bg-bg-2">
                <Icon
                  size={18}
                  className="text-text-tertiary transition-colors duration-150 group-hover:text-text-secondary"
                />
                <h3 className="text-sm font-semibold text-text-primary">
                  {title}
                </h3>
                <p className="text-[13px] leading-relaxed text-text-secondary">
                  {desc}
                </p>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  STACK STRIP                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border-subtle bg-bg-1/40">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <FadeInWhenVisible>
            <p className="text-xs font-medium uppercase tracking-widest text-text-tertiary">
              Built with
            </p>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              Next.js 14 &middot; TypeScript &middot; Supabase &middot;
              Tailwind CSS &middot; Zustand &middot; BlockNote &middot;
              Framer Motion &middot; Radix UI &middot; dnd-kit &middot;
              Recharts &middot; React Flow
            </p>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FINAL CTA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(255,255,255,0.03), transparent 70%)",
          }}
        />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 py-32 text-center sm:py-40">
          <FadeInWhenVisible>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Ready when you are.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Free during preview. No credit card. Your data stays yours.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <ButtonLink
                href="/signup"
                variant="default"
                size="lg"
                className="group gap-2 px-6"
              >
                Start building
                <ArrowRight
                  size={14}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </ButtonLink>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FOOTER                                                            */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <span className="font-display text-sm font-medium tracking-tight text-text-secondary">
            Lobe
          </span>
          <span className="text-[11px] text-text-tertiary">
            &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </main>
  );
}
