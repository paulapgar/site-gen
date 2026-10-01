# WFC Documentation and Source Structure

## Current Documentation

The repository currently has four WFC-specific documents in `docs/research/`:

```text
docs/
├── README.md
└── research/
    ├── wfc-plan-phase1.md
    ├── wfc-plan.md
    ├── wfc-research-algorithm.md
    └── wfc-research-structure.md
```

Their responsibilities are:

- [`wfc-plan-phase1.md`](./wfc-plan-phase1.md): current implementation status, public API, known limitations, and Phase 1 completion plan.
- [`wfc-plan.md`](./wfc-plan.md): longer-term WFC roadmap and milestone ordering.
- [`wfc-research-algorithm.md`](./wfc-research-algorithm.md): behavior and limitations of the current solver.
- [`wfc-research-structure.md`](./wfc-research-structure.md): this documentation and source map.

[`docs/README.md`](../README.md) defines the repository's generic documentation conventions. It is not WFC-specific.

## Current WFC Source Module

```text
src/wfc/
├── config-loader.ts
├── excalibur-integration.ts
├── seeded-floor-constraints.ts
├── types.ts
├── wfc-engine.ts
└── wfc-model.ts
```

- [`types.ts`](../../src/wfc/types.ts) contains public and internal WFC types.
- [`config-loader.ts`](../../src/wfc/config-loader.ts) loads, validates, and converts configuration data.
- [`wfc-engine.ts`](../../src/wfc/wfc-engine.ts) contains the constrained WFC solver.
- [`seeded-floor-constraints.ts`](../../src/wfc/seeded-floor-constraints.ts) exposes the intentionally unimplemented seeded floor-mask placeholder.
- [`excalibur-integration.ts`](../../src/wfc/excalibur-integration.ts) contains the current sprite-oriented Excalibur helper.
- [`wfc-model.ts`](../../src/wfc/wfc-model.ts) is the public barrel export.

The active castle configuration is [`public/configs/castle-tiles.json`](../../public/configs/castle-tiles.json).

## Documentation Maintenance Rules

When changing the WFC module:

1. Update `wfc-plan-phase1.md` when implementation status, public API, known limitations, or Phase 1 tasks change.
2. Update `wfc-research-algorithm.md` when solver semantics or algorithmic guarantees change.
3. Update `wfc-plan.md` when future milestone order or scope changes.
4. Keep this file aligned with the actual documentation and `src/wfc/` file trees.
5. Do not present a planned feature as implemented. Label placeholders, partial behavior, and known limitations explicitly.
