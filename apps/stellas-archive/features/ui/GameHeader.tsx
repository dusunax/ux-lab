import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import type { Locale } from "../game/engine";
import type { InterfaceText } from "../game/engine";

type GameHeaderProps = {
  locale: Locale;
  uiText: InterfaceText;
  tokenCount: number;
  onSetLocale: (nextLocale: Locale) => void;
};

export function GameHeader({ locale, tokenCount, uiText, onSetLocale }: GameHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleSelectLocale = (nextLocale: Locale) => {
    onSetLocale(nextLocale);
    setIsMenuOpen(false);
  };

  return (
    <div className="mb-3.5 flex py-2 min-h-20 max-h-[112px] flex-wrap items-start justify-between gap-3">
      <div>
        <h1
          className="relative inline-block text-4xl font-black leading-tight tracking-[2px] text-transparent [font-family:Orbitron,_'Press_Start_2P',_'Courier_New',_monospace] [background-image:linear-gradient(90deg,_#74f5ff,_#ffd97f_45%,_#d18cff_62%,_#74f5ff)] [-webkit-text-stroke:1px_rgba(255,255,255,0.22)] [-webkit-background-clip:text] [background-clip:text] [color:transparent] [text-shadow:0_0_6px_rgba(116,_245,_255,_0.15),_0_0_18px_rgba(255,_195,_129,_0.25)]"
          data-logo={uiText.pageTitle}
        >
          <Link href="/landing" className="inline-block text-inherit no-underline">
            {uiText.pageTitle}
          </Link>
        </h1>
        <p
          role="note"
          aria-label={uiText.subtitle}
          className="mt-1 max-w-[min(56ch,65vw)] overflow-hidden text-[13px] leading-tight text-[var(--muted)]"
        >
          {uiText.subtitle}
        </p>
      </div>
      <div className="relative flex items-start self-start gap-1.5">
        <output
          role="status"
          aria-live="off"
          aria-label={`${uiText.tokens}: ${tokenCount}`}
          className="w-fit border border-[rgba(130,199,255,0.5)] bg-[rgba(8,14,32,0.85)] px-2.5 py-1.5 text-[12px] leading-tight text-[#d8f2ff]"
        >
          {uiText.tokens}: {tokenCount}
        </output>
        <div className="relative" ref={menuRef}>
          <button
            className={`grid h-10 w-10 min-w-10 cursor-pointer place-items-center rounded-none border border-[rgba(127,220,255,0.7)] bg-[linear-gradient(180deg,rgba(30,60,120,0.56),rgba(9,17,39,0.66))] px-0 text-[13px] text-[#fbfdff] tracking-[0.4px] ${
              isMenuOpen ? "outline-none ring-0" : ""
            }`}
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            type="button"
          >
            <Settings
              className={`h-5 w-5 transition-transform duration-200 ${isMenuOpen ? "rotate-[48deg]" : ""}`}
              aria-hidden
            />
            <span className="sr-only">Language</span>
          </button>
          {isMenuOpen ? (
            <div
              className="absolute top-[calc(100%+6px)] right-0 z-8 w-[132px] border border-[rgba(130,199,255,0.5)] bg-[rgba(10,18,38,0.94)] p-1.5 shadow-[var(--shadow),0_0_0_1px_rgba(125,225,255,0.2)_inset]"
              role="menu"
              aria-label="Language"
            >
              <button
                className={`mb-1 w-full rounded-none border border-[rgba(130,199,255,0.32)] bg-[rgba(8,14,32,0.85)] px-2 py-2 text-left text-[13px] leading-tight text-[#f2fcff] ${
                  locale === "en" ? "bg-[rgba(40,95,180,0.68)] border-[rgba(143,245,255,1)]" : ""
                } first:mt-0 hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.2)]`}
                onClick={() => handleSelectLocale("en")}
                type="button"
                role="menuitemradio"
                aria-checked={locale === "en"}
                aria-label="English"
              >
                English
                {locale === "en" ? " ✓" : ""}
              </button>
              <button
                className={`w-full rounded-none border border-[rgba(130,199,255,0.32)] bg-[rgba(8,14,32,0.85)] px-2 py-2 text-left text-[13px] leading-tight text-[#f2fcff] ${
                  locale === "ko" ? "bg-[rgba(40,95,180,0.68)] border-[rgba(143,245,255,1)]" : ""
                } hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.2)]`}
                onClick={() => handleSelectLocale("ko")}
                type="button"
                role="menuitemradio"
                aria-checked={locale === "ko"}
                aria-label="한국어"
              >
                한국어
                {locale === "ko" ? " ✓" : ""}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
