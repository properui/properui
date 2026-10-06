import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inline } from "~/app/mcp/inline";
import { ForFooter, ForHeader } from "~/components/landing/for-shell";
import "~/components/landing/landing-compare.css";
import "~/components/landing/landing-for.css";
import "~/components/landing/landing.css";
import { CONDITION_IDS, type Condition, type ConditionId, type PageMetrics, getBillingBenchmark } from "~/lib/benchmarks";
import { SITE_NAME } from "~/lib/site";

const TITLE = "Proper UI vs shadcn/ui: same brief, measured";
const DESCRIPTION =
    "One billing page, built by the same model in Proper UI, shadcn/ui and plain Tailwind. The metrics, what they cannot show, and when to keep shadcn/ui.";
const CANONICAL = "https://properui.dev/compare/shadcn-ui";

export const metadata: Metadata = {
    metadataBase: new URL("https://properui.dev/"),
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    icons: { icon: "/favicon.svg" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const LABELS: Record<ConditionId, string> = { properui: "Proper UI", shadcn: "shadcn/ui", tailwind: "Tailwind only" };
const VIEWPORTS = ["desktop", "mobile"] as const;

type FaqItem = { question: string; answer: string };

/** Backticks become `<code>` and `[text](href)` becomes a link, so copy can stay in plain strings. */
const MD_TOKEN = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
function Md({ text }: { text: string }) {
    return (
        <>
            {text.split(MD_TOKEN).map((part, index) => {
                const key = `${index}-${part}`;
                if (part.startsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
                const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (link)
                    return (
                        <a key={key} href={link[2]}>
                            {link[1]}
                        </a>
                    );
                return <span key={key}>{part}</span>;
            })}
        </>
    );
}
const plainText = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replaceAll("`", "");

const faqJsonLd = (items: FaqItem[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: plainText(answer) } })),
});

const num = (value: number) => value.toLocaleString("en-US");
const plural = (count: number, one: string, many = `${one}s`) => `${num(count)} ${count === 1 ? one : many}`;

type Row = { label: string; cells: [ReactNode, ReactNode, ReactNode]; note: ReactNode };

const axeCell = (page: PageMetrics) =>
    page.axeViolations === 0 ? (
        "0 violations"
    ) : (
        <>
            {plural(page.axeViolations, "violation")}: <code>{page.axe.map((v) => v.id).join(", ")}</code>, {plural(page.axeNodes, "node")}
        </>
    );

const dialogChecks = (c: Condition) => [c.metrics.dialog.opened, c.metrics.dialog.roleDialog, c.metrics.dialog.focusInside, c.metrics.dialog.escapeCloses];

export default function CompareShadcnPage() {
    const bench = getBillingBenchmark();
    const { properui: p, shadcn: s, tailwind: t } = bench.conditions;
    const all = CONDITION_IDS.map((id) => bench.conditions[id]);

    // The prose below states these facts in words. If a re-run changes any of them, fail the build
    // so the copy gets rewritten instead of quietly going stale.
    const claims: Array<[string, boolean]> = [
        [
            "Proper UI and shadcn/ui have identical token counts, both zero",
            JSON.stringify(p.metrics.tokens) === JSON.stringify(s.metrics.tokens) && p.metrics.tokens.rawPaletteClasses === 0,
        ],
        [
            "Proper UI is slowest on wall clock and tool calls",
            p.report.wallClockSeconds > s.report.wallClockSeconds &&
                s.report.wallClockSeconds > t.report.wallClockSeconds &&
                p.report.toolCalls > s.report.toolCalls &&
                s.report.toolCalls > t.report.toolCalls,
        ],
        ["Only Proper UI needed a build fix", p.report.buildFixes > 0 && s.report.buildFixes === 0 && t.report.buildFixes === 0],
        [
            "Only shadcn/ui has axe findings, one rule, same on both viewports",
            s.metrics.page.desktop.axe.length === 1 &&
                s.metrics.page.mobile.axe.length === 1 &&
                p.metrics.page.desktop.axeViolations +
                    p.metrics.page.mobile.axeViolations +
                    t.metrics.page.desktop.axeViolations +
                    t.metrics.page.mobile.axeViolations ===
                    0,
        ],
        [
            "Only Tailwind overflows, and only on mobile",
            t.metrics.page.mobile.horizontalOverflow && !p.metrics.page.mobile.horizontalOverflow && !s.metrics.page.mobile.horizontalOverflow,
        ],
        ["All three dialogs pass every check", all.every((c) => dialogChecks(c).every(Boolean))],
    ];
    for (const [claim, holds] of claims) if (!holds) throw new Error(`compare/shadcn-ui: copy no longer matches the benchmark data: ${claim}`);

    const each = <T,>(pick: (c: Condition) => T) => all.map(pick) as [T, T, T];

    const rows: Row[] = [
        {
            label: "Build",
            cells: each((c) => (c.report.buildFixes === 0 ? "Passed first run" : `Passed after ${plural(c.report.buildFixes, "fix", "fixes")}`)),
            note: (
                <>
                    The Proper UI build failed once and the agent fixed it: <Inline text={p.report.buildFailureNote ?? ""} />. The other two builds passed the
                    first time.
                </>
            ),
        },
        ...(all.every((c) => c.metrics.setup)
            ? [
                  {
                      label: "Setup command",
                      cells: each((c) => `${c.metrics.setup?.seconds} s`),
                      note: "Time for the condition's own setup step, before the agent started.",
                  },
              ]
            : []),
        {
            label: "Tool calls",
            cells: each((c) => num(c.report.toolCalls)),
            note: `Proper UI took ${p.report.toolCalls} calls against ${s.report.toolCalls} and ${t.report.toolCalls}. Its report lists checking the project, searching and listing the registry and reading an example before installing entries.`,
        },
        {
            label: "Wall clock",
            cells: each((c) => `${num(c.report.wallClockSeconds)} s`),
            note: `Proper UI was slowest: ${p.report.wallClockSeconds} s against ${s.report.wallClockSeconds} s and ${t.report.wallClockSeconds} s. Time per step was not measured, so the table shows that it took longer, not which step cost the most.`,
        },
        {
            label: "Files authored",
            cells: each((c) => num(c.metrics.files.authoredCount)),
            note: "Files the agent wrote by hand. Library files a CLI copied in are counted on the next row.",
        },
        {
            label: "Lines authored",
            cells: each((c) => num(c.metrics.files.authoredLines)),
            note: "Lower when a library ships pages as source, which is how Proper UI works. Read it as where the code lives, not as quality.",
        },
        {
            label: "Library files installed",
            cells: each((c) =>
                c.metrics.files.libraryCount === 0 ? "None" : `${num(c.metrics.files.libraryCount)} files, ${num(c.metrics.files.libraryLines)} lines`,
            ),
            note: `Source copied into the repository, including dependencies. Proper UI put ${p.metrics.files.libraryCount} files in the project to own; shadcn/ui put ${s.metrics.files.libraryCount}.`,
        },
        {
            label: "Raw palette classes",
            cells: each((c) => num(c.metrics.tokens.rawPaletteClasses)),
            note: "Classes such as bg-purple-600 in authored files. Zero in both library runs; the Tailwind run has no token layer to use, so this is not a defect there.",
        },
        {
            label: "Arbitrary values",
            cells: each((c) => num(c.metrics.tokens.arbitraryValues)),
            note: "Classes such as p-[13px] in authored files.",
        },
        {
            label: "dark: variants",
            cells: each((c) => num(c.metrics.tokens.darkVariants)),
            note: "Dark mode written element by element. The two token-based runs have none.",
        },
        {
            label: "axe, desktop",
            cells: each((c) => axeCell(c.metrics.page.desktop)),
            note: `axe-core, WCAG 2 A, AA and best practice, on the rendered page. axe rates the shadcn/ui finding ${s.metrics.page.desktop.axe[0]?.impact}.`,
        },
        {
            label: "axe, mobile",
            cells: each((c) => axeCell(c.metrics.page.mobile)),
            note: "The same checks at a phone viewport. A clean result is not proof the page is accessible; see the limits below.",
        },
        {
            label: "Mobile overflow",
            cells: each((c) => (c.metrics.page.mobile.horizontalOverflow ? "Yes" : "No")),
            note: all.every((c) => !c.metrics.page.desktop.horizontalOverflow)
                ? "The Tailwind page scrolls sideways at phone width. No run overflows on desktop."
                : "Whether the page is wider than the viewport.",
        },
        {
            label: "Console errors",
            cells: each((c) => num(VIEWPORTS.reduce((sum, v) => sum + c.metrics.page[v].consoleErrors.length, 0))),
            note: "Errors logged while loading the page, desktop and mobile together.",
        },
        {
            label: "Cancel dialog",
            cells: each((c) => `${dialogChecks(c).filter(Boolean).length} of ${dialogChecks(c).length} checks`),
            note: "The dialog opens, has the dialog role, takes focus and closes on Escape. All three runs pass.",
        },
    ];

    const faq: FaqItem[] = [
        {
            question: "Is Proper UI a replacement for shadcn/ui?",
            answer: "It is a different set of choices, not a drop-in swap. Proper UI builds on React Aria Components, one token file and full-page examples. If an app already has a theme of its own, read [Adopting Proper UI](/docs/adopting) first, since a few utility names collide. Trying it on one new screen is cheaper than a migration.",
        },
        {
            question: "Why did the Proper UI run take more calls and more time?",
            answer: `It followed the Skill: check the project, search and list the registry, read an example, then install entries. That took ${p.report.toolCalls} tool calls and ${p.report.wallClockSeconds} s, against ${s.report.toolCalls} and ${s.report.wallClockSeconds} s for shadcn/ui. Whether the up-front cost pays back across many screens is not something a single page can show.`,
        },
        {
            question: "Does zero axe violations mean Proper UI is accessible?",
            answer: "No. axe-core checks rendered markup only, and the Tailwind run also had none. It cannot judge focus order, screen reader wording or whether a flow makes sense. See [Accessibility](/docs/accessibility) for what the number covers.",
        },
        {
            question: "Can I reproduce this run?",
            answer: "Yes. The protocol, the prompt and the measuring script are in the repository, and every number above comes from the `metrics.json` files there. A different run of the same model will differ, so run it more than once before you trust any single result.",
        },
    ];

    const limits = [
        "One run per condition, so the spread between runs is unknown. A second run of the same agent would differ.",
        "One brief, a billing settings page, written by the Proper UI maintainers. A different brief could favour a different condition.",
        `One model, ${bench.model}. Other models and other agent harnesses may behave differently.`,
        "No real users. Nobody used these pages, so nothing here says which one is easier to use.",
        "axe-core checks rendered markup only. Zero violations is not the same as accessible, and the one shadcn/ui finding says nothing about the library on other pages. See [Accessibility](/docs/accessibility).",
        "Lines authored favour libraries that ship pages as source. A lower number there is the design of the library, not a measure of quality.",
        "The token counts are regexes over class strings. They show how much of a page's look lives in one-off values, not whether the page looks right.",
    ];

    const keepShadcn = [
        {
            title: "You already have it, and a design system around it",
            text: "A team with shadcn/ui components, a tuned theme and screens in production gains little from one comparison page. Migration cost is real and this run does not measure it.",
        },
        {
            title: "You want Radix primitives",
            text: "shadcn/ui builds on Radix. Proper UI builds on React Aria Components. If your team knows and wants Radix behaviour, that settles it.",
        },
        {
            title: "You do not use AI agents to build screens",
            text: `Tool calls and wall clock only matter for an agent run. For a person writing components, shadcn/ui is a strong default with a small footprint: ${s.metrics.files.libraryCount} library files in this run against ${p.metrics.files.libraryCount}.`,
        },
        {
            title: "You need the shadcn ecosystem",
            text: "Templates, blocks and community registries built on shadcn/ui are a large body of work that Proper UI does not try to match.",
        },
        {
            title: "You are not on React 19 and Tailwind v4",
            text: "Proper UI's components need both. If your project cannot move yet, that rules it out for now.",
        },
    ];

    const fitsProperUI = [
        {
            title: "AI agents build most of your screens",
            text: "That is the case this run tests. The agent searched a registry and installed source instead of writing every screen from memory. See [Proper UI for Claude Code](/for/claude-code).",
        },
        {
            title: "You want full pages and flows as source",
            text: "Screens, sections and curated [flows](/flows) install as files you own and edit, not as a component set you assemble.",
        },
        {
            title: "You want one token file and a rule the agent follows",
            text: "A single token file, a Skill and an [MCP server](/mcp) give the agent the same rules on every screen. In this run the token counts were zero.",
        },
        {
            title: "You are on React 19 and Tailwind v4",
            text: "Proper UI targets both, and ships under the MIT license with no account.",
        },
    ];

    const jsonLd = [{ "@context": "https://schema.org", "@type": "WebPage", name: TITLE, description: DESCRIPTION, url: CANONICAL }, faqJsonLd(faq)];

    const shotSets: Array<{ key: "desktop" | "dialog" | "mobile"; heading: string; intro: string; caption: (c: Condition) => ReactNode }> = [
        {
            key: "desktop",
            heading: "Desktop",
            intro: "Full-page captures at desktop width. Click one to open the full image in a new tab.",
            caption: (c) => {
                if (c.id === "shadcn")
                    return `Rendered in a serif fallback font, because the shadcn/ui init rewrote the scaffold's font setup. axe: ${c.metrics.page.desktop.axeViolations} violation (color-contrast on ${c.metrics.page.desktop.axeNodes} nodes).`;
                return `${c.metrics.page.desktop.axeViolations} axe violations. ${plural(c.metrics.files.authoredCount, "file")} authored.`;
            },
        },
        {
            key: "dialog",
            heading: "Cancel dialog",
            intro: "The cancel-subscription dialog, open.",
            caption: () => "The dialog opens with the dialog role, takes focus and closes on Escape.",
        },
        {
            key: "mobile",
            heading: "Mobile",
            intro: "Full-page captures at phone width, cropped here to the top. The full image opens in a new tab.",
            caption: (c) => {
                if (c.id === "tailwind")
                    return `Horizontal overflow: the capture is ${c.shots.mobile.width} px wide against ${p.shots.mobile.width} px for the others.`;
                if (c.id === "shadcn")
                    return `No horizontal overflow. axe: ${c.metrics.page.mobile.axeViolations} violation (color-contrast on ${c.metrics.page.mobile.axeNodes} nodes).`;
                return "No horizontal overflow. 0 axe violations.";
            },
        },
    ];

    return (
        <div className="pui-landing">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <ForHeader ctaHref="#results" ctaLabel="See results" />

            <main id="top">
                <section className="hero for-hero" aria-labelledby="cmp2-title">
                    <div className="hero-grid" aria-hidden="true" />
                    <div className="hero-glow" aria-hidden="true" />
                    <div className="hero-copy container">
                        <span className="eyebrow">Comparison</span>
                        <h1 id="cmp2-title">Proper UI vs shadcn/ui: the same brief, the same model, measured.</h1>
                        <p>
                            Three identical {bench.nextVersion} scaffolds, one prompt, {bench.model}, one run each on {bench.dateLabel}. One scaffold had Proper
                            UI and its Skill, one had shadcn/ui, and one had nothing added: plain Tailwind is the control. The prompt:
                        </p>
                        <blockquote className="cmp2-prompt">
                            <Md text={bench.prompt} />
                        </blockquote>
                        <div className="hero-actions">
                            <a className="button button-primary button-lg" href="#results">
                                See the results
                            </a>
                            <a className="button button-secondary button-lg" href={bench.protocolUrl} target="_blank" rel="noreferrer">
                                Protocol on GitHub
                            </a>
                        </div>
                    </div>
                </section>

                <section className="section" id="results" aria-labelledby="cmp2-results-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Results</span>
                            <h2 id="cmp2-results-title">What was measured</h2>
                            <p>
                                Every number comes from a <code>metrics.json</code> or an <code>agent-report.md</code> in the repository. Proper UI is not ahead
                                on wall clock, tool calls or files copied in, and the table says so.
                            </p>
                        </div>

                        {/* A scroll container must be keyboard focusable (axe: scrollable-region-focusable). */}
                        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                        <div className="cmp2-table-wrap" role="region" aria-label="Results table, scrolls sideways on narrow screens" tabIndex={0}>
                            <table className="cmp2-table">
                                <caption>Billing settings page, one run per condition.</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Measure</th>
                                        {CONDITION_IDS.map((id) => (
                                            <th scope="col" key={id}>
                                                {LABELS[id]}
                                            </th>
                                        ))}
                                        <th scope="col">What it means</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.label}>
                                            <th scope="row">{row.label}</th>
                                            {row.cells.map((cell, index) => (
                                                <td key={CONDITION_IDS[index]}>{cell}</td>
                                            ))}
                                            <td className="cmp2-note">{row.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section className="section for-alt" id="screens" aria-labelledby="cmp2-shots-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Screenshots</span>
                            <h2 id="cmp2-shots-title">What each run rendered</h2>
                            <p>Taken by the measuring script, not edited. Captions state only what the script and the captures show.</p>
                        </div>

                        {shotSets.map((set) => (
                            <div className="cmp2-shotset" key={set.key}>
                                <h3>{set.heading}</h3>
                                <p>{set.intro}</p>
                                <ul className="cmp2-shots">
                                    {all.map((c) => {
                                        const shot = c.shots[set.key];
                                        return (
                                            <li key={c.id}>
                                                <figure className="cmp2-shot" data-kind={set.key}>
                                                    <a href={shot.src} target="_blank" rel="noreferrer">
                                                        <img
                                                            src={shot.src}
                                                            width={shot.width}
                                                            height={shot.height}
                                                            loading="lazy"
                                                            alt={`${LABELS[c.id]} billing page, ${set.heading.toLowerCase()} render. Opens the full size in a new tab.`}
                                                        />
                                                    </a>
                                                    <figcaption>
                                                        <strong>{LABELS[c.id]}.</strong> {set.caption(c)}
                                                    </figcaption>
                                                </figure>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="section" id="numbers" aria-labelledby="cmp2-numbers-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Reading it</span>
                            <h2 id="cmp2-numbers-title">What the numbers show</h2>
                        </div>
                        <div className="cmp2-prose">
                            <h3>Consistency</h3>
                            <p>
                                The Proper UI and shadcn/ui runs have {p.metrics.tokens.rawPaletteClasses} raw palette classes,{" "}
                                {p.metrics.tokens.arbitraryValues} arbitrary values and {p.metrics.tokens.darkVariants} <code>dark:</code> variants in the files
                                the agent wrote. The Tailwind run has {t.metrics.tokens.rawPaletteClasses}, {t.metrics.tokens.arbitraryValues} and{" "}
                                {t.metrics.tokens.darkVariants}. That is how much of a page's look sits in one-off values rather than a shared token file. It is
                                not a defect in a project with no token layer, and shadcn/ui, with its own theme variables, scores the same as Proper UI here.
                            </p>
                            <h3>Accessibility</h3>
                            <p>
                                axe-core found no violations in the Proper UI and Tailwind runs. It found {s.metrics.page.desktop.axeViolations} in the
                                shadcn/ui run, a <code>{s.metrics.page.desktop.axe[0]?.id}</code> issue on {s.metrics.page.desktop.axeNodes} nodes, at both
                                viewports. All three cancel dialogs open with the dialog role, take focus and close on Escape. axe reads rendered markup only,
                                so a clean result is a floor, not a verdict; see the limits below and <a href="/docs/accessibility">Accessibility</a>.
                            </p>
                            <h3>Effort</h3>
                            <p>
                                The Proper UI agent used {p.report.toolCalls} tool calls and {p.report.wallClockSeconds} s, against {s.report.toolCalls} and{" "}
                                {s.report.wallClockSeconds} s for shadcn/ui and {t.report.toolCalls} and {t.report.wallClockSeconds} s for plain Tailwind. Per
                                its report, the agent followed the Skill: checking the project, searching and listing the registry, reading the{" "}
                                <code>settings-13</code> example, and installing <code>table</code>, <code>confirm-dialog</code>,{" "}
                                <code>progress-indicators</code>, <code>badges</code>, <code>buttons</code> and <code>section-headers</code> instead of writing
                                those parts. That put {num(p.metrics.files.libraryCount)} files in the repository, against {s.metrics.files.libraryCount} for
                                shadcn/ui, and left {p.metrics.files.authoredLines} authored lines in {p.metrics.files.authoredCount} files against{" "}
                                {s.metrics.files.authoredLines} in {s.metrics.files.authoredCount} and {t.metrics.files.authoredLines} in{" "}
                                {t.metrics.files.authoredCount}. Time per step was not measured, and whether the install pays back over many screens is outside
                                what one run can show.
                            </p>
                            <h3>The fix it needed</h3>
                            <p>
                                The first <code>pnpm build</code> of the Proper UI run failed: <Inline text={p.report.buildFailureNote ?? ""} />. The build then
                                passed. A typed API turned a wrong guess into a build error, which is useful, and it was also a failed step that the other two
                                runs did not have.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="section for-alt" id="limits" aria-labelledby="cmp2-limits-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Know the edges</span>
                            <h2 id="cmp2-limits-title">What this does not show</h2>
                        </div>
                        <ul className="for-limits">
                            {limits.map((item) => (
                                <li key={item}>
                                    <Md text={item} />
                                </li>
                            ))}
                        </ul>
                        <p className="cmp2-after">
                            Re-run it yourself: the steps, the prompt and the measuring script are in the{" "}
                            <a href={bench.protocolUrl} target="_blank" rel="noreferrer">
                                benchmark protocol on GitHub
                            </a>
                            .
                        </p>
                    </div>
                </section>

                <section className="section" id="keep" aria-labelledby="cmp2-keep-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">An honest default</span>
                            <h2 id="cmp2-keep-title">When to keep shadcn/ui</h2>
                            <p>shadcn/ui is a strong default, and for many teams it is the right one. Keep it if any of these is true.</p>
                        </div>
                        <ul className="cmp2-cards">
                            {keepShadcn.map((item) => (
                                <li className="cmp2-card" key={item.title}>
                                    <h3>{item.title}</h3>
                                    <p>
                                        <Md text={item.text} />
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="section for-alt" id="fit" aria-labelledby="cmp2-fit-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Where it fits</span>
                            <h2 id="cmp2-fit-title">When Proper UI fits</h2>
                        </div>
                        <ul className="cmp2-cards">
                            {fitsProperUI.map((item) => (
                                <li className="cmp2-card" key={item.title}>
                                    <h3>{item.title}</h3>
                                    <p>
                                        <Md text={item.text} />
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="section" id="faq" aria-labelledby="cmp2-faq-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Questions</span>
                            <h2 id="cmp2-faq-title">Frequently asked questions</h2>
                        </div>
                        <div className="for-faq">
                            {faq.map(({ question, answer }) => (
                                <details className="for-faq-item" name="compare-shadcn-faq" key={question}>
                                    <summary>
                                        {question}
                                        <b aria-hidden="true">+</b>
                                    </summary>
                                    <p>
                                        <Md text={answer} />
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="final-cta" id="get-started" aria-labelledby="cmp2-cta-title">
                    <div className="final-cta-inner container">
                        <h2 id="cmp2-cta-title">Check it against your own screens.</h2>
                        <p>Try the MCP on one screen, or re-run the benchmark with your own brief.</p>
                        <div className="final-cta-actions">
                            <a className="button light-button button-xl" href="/mcp">
                                See the MCP
                            </a>
                            <a className="button outline-button button-xl" href={bench.protocolUrl} target="_blank" rel="noreferrer">
                                Read the protocol
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <ForFooter />
        </div>
    );
}
