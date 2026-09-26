import type { MDXComponents } from "mdx/types";
import { FAQs } from "~/components/faqs";
import { Install } from "~/components/install";
import { Playground } from "~/components/playground";
import { Preview } from "~/components/preview";
import { DottedDivider } from "~/components/primitives";
import { ThemeGenerator } from "~/components/theme-generator";
import { VariantGrid } from "~/components/variant-grid";

/**
 * The MDX contract from docs/spec/manifest/AGENT-BRIEF.md §5 — these are the only components
 * an authoring agent may use (see docs/contributing-components.md for the current list) —
 * plus the prose defaults, whose classes come from the captured reference DOM.
 */

const headingLink = "[&_a]:text-current [&_a]:no-underline";

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: (props) => <h1 {...props} className={`text-primary md:text-display-xs max-w-3xl scroll-mt-20 text-xl font-semibold text-balance ${headingLink}`} />,
        h2: (props) => <h2 {...props} className={`text-primary mt-16 mb-4 scroll-mt-20 text-lg font-semibold md:text-xl ${headingLink}`} />,
        h3: (props) => <h3 {...props} className={`text-md text-primary mt-10 mb-3 scroll-mt-20 font-semibold ${headingLink}`} />,
        h4: (props) => <h4 {...props} className={`text-md text-primary mt-8 mb-2 scroll-mt-20 font-semibold ${headingLink}`} />,
        p: (props) => <p {...props} className="text-md text-tertiary my-4 first:mt-0 last:mb-0" />,
        a: (props) => (
            <a
                {...props}
                className="text-primary decoration-utility-neutral-200 outline-focus-ring hover:decoration-utility-neutral-400 font-medium underline underline-offset-3 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2"
            />
        ),
        ul: (props) => <ul {...props} className="text-md text-tertiary my-4 flex list-disc flex-col gap-2 pl-5" />,
        ol: (props) => <ol {...props} className="text-md text-tertiary my-4 flex list-decimal flex-col gap-2 pl-5" />,
        li: (props) => <li {...props} className="marker:text-fg-quaternary" />,
        blockquote: (props) => <blockquote {...props} className="border-brand text-md text-tertiary my-6 border-l-2 pl-4" />,
        code: (props) => (
            <code
                {...props}
                className="bg-secondary text-tertiary ring-secondary rounded-md px-1.5 py-0.5 font-mono text-sm font-bold whitespace-nowrap ring-1 ring-inset"
            />
        ),
        pre: (props) => (
            <pre
                {...props}
                className="bg-secondary_alt text-tertiary ring-secondary my-6 overflow-x-auto rounded-xl p-5 font-mono text-sm leading-6 ring-1 ring-inset [&_code]:bg-transparent [&_code]:p-0 [&_code]:ring-0"
            />
        ),
        table: (props) => (
            <div className="my-6 w-full overflow-x-auto">
                <table {...props} className="w-full border-collapse text-left text-sm" />
            </div>
        ),
        th: (props) => <th {...props} className="border-primary text-secondary border-b px-3 py-2 font-semibold" />,
        td: (props) => <td {...props} className="border-secondary text-tertiary border-b px-3 py-2" />,
        hr: () => <DottedDivider />,

        Preview,
        Install,
        FAQs,
        VariantGrid,
        ThemeGenerator,
        Playground,

        ...components,
    };
}
