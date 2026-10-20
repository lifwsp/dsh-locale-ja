// dsh-better-sidebar renders its chrome through its own `t()`, which knows
// only zh/en plus the optional `betterLocale` override store (the seam the
// third-party better-locale plugin used to publish). Serving the Japanese
// dictionary through that same store makes the sidebar follow the locale
// service; see ADR-0007. Nothing here touches DSH runtime objects.
import { SIDEBAR_JA, SIDEBAR_NS } from "./sidebar-dictionary.ts";
import { JA } from "./locale-extension.ts";

export const BETTER_LOCALE_SERVICE = "betterLocale";

/** The consumer-facing face of the `betterLocale` store, as dsh-better-sidebar reads it. */
export interface BetterLocaleStore {
  readonly active: string | undefined;
  getOverride(dshActive: string, ns: string, key: string): string | undefined;
  isOverrideActive(dshActive: string): boolean;
  register(ns: string, dicts: Record<string, Record<string, string>>): () => void;
  subscribe(listener: () => void): () => void;
}

const noop = (): void => {};

// Stateless: the override is derived from the locale service's active id, which
// the consumer passes on every call, so there is nothing to subscribe to.
// `register` is accepted but ignored — the dictionary is owned by this plugin.
export function createBetterLocaleStore(): BetterLocaleStore {
  return {
    active: JA,
    getOverride: (dshActive, ns, key) =>
      dshActive === JA && ns === SIDEBAR_NS ? SIDEBAR_JA[key] : undefined,
    isOverrideActive: (dshActive) => dshActive === JA,
    register: () => noop,
    subscribe: () => noop,
  };
}

interface Provider {
  get(name: string): unknown;
  provide(name: string, value?: unknown): () => void;
}

// Publishes the store unless another plugin already owns the name (cordis
// throws on a duplicate provide); returns the disposer.
export function provideBetterLocale(ctx: Provider): () => void {
  if (ctx.get(BETTER_LOCALE_SERVICE) !== undefined) return noop;
  return ctx.provide(BETTER_LOCALE_SERVICE, createBetterLocaleStore());
}
