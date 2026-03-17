import Link from "next/link";
import { ASSET_PATHS } from "../../lib/assets";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_20%_10%,rgba(116,245,255,0.16),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(255,178,108,0.16),transparent_38%),linear-gradient(145deg,rgba(5,12,28,0.98),rgba(10,21,44,0.9))] text-[#ecf7ff]">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-[900px] flex-col items-center justify-center px-4 text-center">
        <div className="w-full rounded-none border border-[rgba(130,199,255,0.35)] bg-[rgba(10,18,38,0.78)] p-6 sm:p-10">
          <img
            src={ASSET_PATHS.imgs.logo}
            alt="Stella's Archive"
            className="mx-auto h-[200px] w-auto object-contain sm:h-[600px]"
          />
          <h1 className="mt-5 text-3xl font-logo font-black tracking-[2px] text-transparent [background-image:linear-gradient(90deg,_#74f5ff,_#ffd97f_45%,_#d18cff_62%,_#74f5ff)] [-webkit-text-stroke:1px_rgba(255,255,255,0.22)] [-webkit-background-clip:text] [background-clip:text] [color:transparent] [text-shadow:0_0_6px_rgba(116,_245,_255,_0.15),_0_0_18px_rgba(255,_195,_129,_0.25)]">
            Stella&apos;s Archive
          </h1>
          <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-[var(--muted)]">
            Observe emotional creatures, interact, evolve, and record their emotional stories in a living laboratory.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex min-h-[44px] items-center justify-center border-2 border-[rgba(130,199,255,0.9)] bg-[linear-gradient(180deg,rgba(46,93,176,0.76),rgba(17,30,66,0.88))] px-6 py-3 text-sm font-semibold tracking-[0.4px] text-[#ebfeff] transition hover:border-[#9ef6ff] hover:shadow-[0_0_15px_rgba(140,234,255,0.35)]"
          >
            시작하기
          </Link>
        </div>
      </section>
    </main>
  );
}
