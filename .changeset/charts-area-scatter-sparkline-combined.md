---
"@properui/ui": minor
---

Adds four chart groups to round out coverage against the top component libraries: `area-charts`
(stacked, gradient, stepped, a brush range selector, small multiples), `scatter-bubble-charts`
(scatter, a z-axis-sized bubble chart, a fitted regression line, categorical colors), `sparklines`
(a standalone `Sparkline` primitive for metric cards and table cells, plus demos dropping it into
existing `MetricSimple` cards and a `Table`), and `combined-charts` (bar + line, dual y-axes, a bar
with a target `ReferenceLine`, a waterfall built from stacked bars, and a `Funnel`).

Also adds `chartColorTokens`, `chartColors` and `sequentialScale` to `charts-base`: an ordered,
documented categorical color list (and a single-hue scale builder) for charts that assign color to
an unknown number of series, resolved from the same `--color-utility-*` tokens every chart already
uses. `ChartLegendContent`'s swatch now also reads a series' `style.color`, alongside the existing
`className` support, so a series colored this way still gets a correctly tinted legend swatch.

The four new chart docs pages each cover their own examples, and a "Chart colours" section explaining
the ordering and dark-mode behavior was added to all eight chart docs pages (`line-bar-charts`,
`pie-charts`, `radar-charts`, `activity-gauges`, and the four new ones).
