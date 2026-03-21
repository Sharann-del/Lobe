import { ButtonLink } from "@/components/ui";

export function HomeMarketing() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-0 px-4">
      <div className="text-center">
        <h1 className="font-display text-[clamp(3.25rem,14vw,8.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] text-text-primary antialiased sm:tracking-[-0.05em]">
          Lobe
        </h1>
        <p className="mt-5 max-w-[20rem] text-sm leading-relaxed text-text-secondary md:max-w-none">
          A personal OS for thought.
        </p>
      </div>

      <div className="-mt-1 flex w-full max-w-[15.5rem] flex-col gap-2.5 sm:max-w-none sm:flex-row sm:justify-center sm:gap-2.5">
        <ButtonLink
          href="/signup"
          variant="default"
          size="lg"
          className="w-full min-h-[44px] shadow-sm sm:w-auto sm:min-w-[9.75rem]"
        >
          Get started
        </ButtonLink>
        <ButtonLink
          href="/login"
          variant="outline"
          size="lg"
          className="w-full min-h-[44px] sm:w-auto sm:min-w-[9.75rem]"
        >
          Sign in
        </ButtonLink>
      </div>
    </main>
  );
}
