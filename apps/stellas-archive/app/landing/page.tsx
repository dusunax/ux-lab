import Link from "next/link";
import { ASSET_PATHS } from "../../lib/assets";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-stellaBg text-text">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-[900px] flex-col items-center justify-center px-4 text-center">
        <div className="w-full rounded-none border border-panelLine bg-surface/80 p-6 text-left sm:p-10">
          <img
            src={ASSET_PATHS.imgs.logo}
            alt="Stella's Archive"
            className="mx-auto h-[200px] w-auto object-contain sm:h-[600px]"
          />
          <h1 className="mt-5 text-3xl font-logo font-black tracking-[2px] text-transparent [background-image:linear-gradient(90deg,_#74f5ff,_#ffd97f_45%,_#d18cff_62%,_#74f5ff)] [-webkit-text-stroke:1px_rgba(255,255,255,0.22)] [-webkit-background-clip:text] [background-clip:text] [color:transparent] [text-shadow:0_0_6px_rgba(116,_245,_255,_0.15),_0_0_18px_rgba(255,_195,_129,_0.25)]">
            Stella&apos;s Archive
          </h1>
          <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-muted">
            Observe emotional creatures, interact, evolve, and record their emotional stories in a living laboratory.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex min-h-[44px] w-fit items-center justify-center border border-primary/80 bg-[rgba(8,14,32,0.85)] px-6 py-3 text-sm font-semibold tracking-[0.2px] text-text transition hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
          >
            시작하기
          </Link>
        </div>
      </section>
    </main>
  );
}
