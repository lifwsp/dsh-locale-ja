# ADR-0007: Serve dsh-better-sidebar through the `betterLocale` store

- Status: Accepted
- Date: 2026-10-20

## Context

`dsh-better-sidebar` registers `zh`/`en` dictionaries under the `betterSidebar`
namespace, but its chrome renders through its own module-level `t()`, which
does not call `locale.lookup`. `t()` consults only (1) the optional
`betterLocale` service (`getOverride`, `isOverrideActive`, `active`, `register`,
`subscribe`) and (2) a zh/en choice from the active locale. With `ja` active it
therefore shows English even if `betterSidebar` has a `ja` dictionary. The
sidebar re-reads `ctx.get('betterLocale')` on every locale revision bump.

## Decision

- Keep the cleaned dictionary in `src/client/sidebar-dictionary.ts` and register
  it under `betterSidebar` like every other namespace (for callers that go
  through the locale service).
- `src/client/better-locale.ts` publishes a small stateless `betterLocale`
  store with `ctx.provide`, answering from that dictionary while the active
  locale is `ja` and returning `undefined`/`false` otherwise.
- The store is published only when the name is free (`ctx.get` absence check),
  because cordis throws on a duplicate `provide`; its disposer withdraws it.
- The store carries no state and no subscription: the consumer passes the
  active locale id on each call.

## Consequences

- The sidebar follows the locale selector with no change to the sidebar itself.
- Another plugin owning `betterLocale` wins; the sidebar then stays on whatever
  that store serves.
- A key the sidebar adds later falls back to English until the dictionary is
  extended (not covered by `pnpm typecheck`).
