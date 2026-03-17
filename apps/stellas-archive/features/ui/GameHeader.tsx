import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { t } from "i18next";
import i18next from "i18next";
import { Settings } from "lucide-react";
import type { InterfaceText } from "../game/engine";
import { type Locale, normalizeLocale, SupportedLocale } from "../i18n/i18n";

type GameHeaderProps = {
  uiText: InterfaceText;
  tokenCount: number;
  onSetLocale: (nextLocale: Locale) => void;
};

export function GameHeader({ tokenCount, uiText, onSetLocale }: GameHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const locale = normalizeLocale(i18next.resolvedLanguage || i18next.language);
  const isEnglishLocale = locale === SupportedLocale.En;
  const languageFallback = locale === SupportedLocale.En ? "Language" : "언어";
  const englishFallback = "English";
  const koreanFallback = "한국어";
  const languageLabel = t("language") || languageFallback;
  const englishLabel = t("languageEnglish") || englishFallback;
  const koreanLabel = t("languageKorean") || koreanFallback;

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
          className="relative inline-block text-4xl font-logo font-black leading-tight tracking-[2px] text-transparent [background-image:linear-gradient(90deg,_#74f5ff,_#ffd97f_45%,_#d18cff_62%,_#74f5ff)] [-webkit-text-stroke:1px_rgba(255,255,255,0.22)] [-webkit-background-clip:text] [background-clip:text] [color:transparent] [text-shadow:0_0_6px_rgba(116,_245,_255,_0.15),_0_0_18px_rgba(255,_195,_129,_0.25)]"
          data-logo={uiText.pageTitle}
        >
          <Link href="/landing" className="inline-block text-inherit no-underline">
            {uiText.pageTitle}
          </Link>
        </h1>
        <p
          role="note"
          aria-label={uiText.subtitle}
          className="mt-1 max-w-[min(56ch,65vw)] overflow-hidden text-[13px] leading-tight text-muted"
        >
          {uiText.subtitle}
        </p>
      </div>
        <div className="relative flex items-start self-start gap-1.5">
        <output
          role="status"
          aria-live="off"
          aria-label={`${uiText.tokens}: ${tokenCount}`}
          className="w-fit border border-panelLine bg-surface/85 px-2.5 py-1.5 text-[12px] leading-tight text-text"
        >
          {uiText.tokens}: {tokenCount}
        </output>
        <div className="relative" ref={menuRef}>
          <button
            className={`grid h-10 w-10 min-w-10 cursor-pointer place-items-center rounded-none border border-[rgba(127,220,255,0.7)] bg-surface/75 px-0 text-[13px] text-text tracking-[0.4px] transition-transform duration-200 ${
              isMenuOpen ? "outline-none ring-0" : ""
            } ${
              isMenuOpen ? "border-[#8ff5ff] shadow-[0_0_16px_rgba(127,232,255,0.35)]" : ""
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
          <span className="sr-only">{languageLabel}</span>
          </button>
          {isMenuOpen ? (
            <div
              className="absolute top-[calc(100%+6px)] right-0 z-10 w-[132px] border border-panelLine bg-surface/95 p-1.5 shadow-[0_0_30px_rgba(102,240,255,0.15),0_0_0_1px_rgba(125,225,255,0.2)_inset]"
              role="menu"
              aria-label={languageLabel}
            >
              <button
                className={`mb-1 w-full rounded-none border border-[rgba(130,199,255,0.32)] bg-surface/85 px-2 py-2 text-left text-[13px] leading-tight text-text ${
                  isEnglishLocale ? "bg-[rgba(40,95,180,0.68)] border-[rgba(143,245,255,1)] text-[#ffffff]" : ""
                } first:mt-0 hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.2)]`}
                onClick={() => handleSelectLocale(SupportedLocale.En)}
                type="button"
                role="menuitemradio"
                aria-checked={locale === SupportedLocale.En}
                aria-label={englishLabel}
              >
                {englishLabel}
                {isEnglishLocale ? " ✓" : ""}
              </button>
              <button
                className={`w-full rounded-none border border-[rgba(130,199,255,0.32)] bg-surface/85 px-2 py-2 text-left text-[13px] leading-tight text-text ${
                  !isEnglishLocale ? "bg-[rgba(40,95,180,0.68)] border-[rgba(143,245,255,1)] text-[#ffffff]" : ""
                } hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.2)]`}
                onClick={() => handleSelectLocale(SupportedLocale.Ko)}
                type="button"
                role="menuitemradio"
                aria-checked={locale === SupportedLocale.Ko}
                aria-label={koreanLabel}
              >
                {koreanLabel}
                {!isEnglishLocale ? " ✓" : ""}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
