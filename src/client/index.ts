import type { Context as ClientContext } from "@deepseek-ai/cordis";
import { provideBetterLocale } from "./better-locale.ts";
import { DICTS } from "./dictionaries.ts";
import { EXTENSION_DICTS } from "./extension-dictionaries.ts";
import { createFontStylesheet } from "./font.ts";
import { extendLocaleService, isJapaneseActive, JA } from "./locale-extension.ts";
import { SIDEBAR_JA, SIDEBAR_NS } from "./sidebar-dictionary.ts";

export const inject = ["locale"];

export function apply(ctx: ClientContext): void {
  const { locale } = ctx;

  // Published first so a consumer that re-reads it on the next locale
  // revision bump (the registrations below) already finds it.
  ctx.effect(() => provideBetterLocale(ctx), "locale-ja: betterLocale store");

  ctx.effect(() => {
    const disposers = [
      ...Object.entries(DICTS),
      ...Object.entries(EXTENSION_DICTS),
      [SIDEBAR_NS, SIDEBAR_JA] as const,
    ].map(([ns, dict]) => locale.register(ns, JA, dict));
    return () => {
      for (const dispose of disposers) dispose();
    };
  }, "locale-ja: japanese dictionaries");

  // Dictionaries must land before the language exists: a stored `ja`
  // preference re-resolves on registration and would otherwise flip the UI
  // onto English fallback copy.
  ctx.effect(() => extendLocaleService(locale), "locale-ja: selectable ja locale");

  ctx.effect(() => {
    const font = createFontStylesheet();
    const sync = (): void => {
      font.sync(isJapaneseActive(locale));
    };
    sync();
    const unsubscribe = locale.subscribe(sync);
    return () => {
      unsubscribe();
      font.dispose();
    };
  }, "locale-ja: japanese font");
}
