import type { LibraryItem } from "~/lib/library-index";

/** A step or card thumbnail. Light and dark renders are swapped with the theme class; a missing render shows a neutral tile. */
export const FlowThumb = ({ item, className = "" }: { item: LibraryItem; className?: string }) => {
    if (!item.thumb) {
        return (
            <div className={`bg-secondary text-quaternary flex aspect-[16/10] w-full items-center justify-center rounded-lg text-sm font-medium ${className}`}>
                {item.title}
            </div>
        );
    }

    const { light, dark } = item.thumb;
    return (
        <>
            <img
                src={light}
                alt={item.title}
                loading="lazy"
                className={`bg-primary outline-secondary_alt h-auto w-full max-w-full rounded-lg object-cover object-top outline-1 ${dark ? "dark:hidden" : ""} ${className}`}
            />
            {dark && (
                <img
                    src={dark}
                    alt={item.title}
                    loading="lazy"
                    className={`bg-primary outline-secondary_alt h-auto w-full max-w-full rounded-lg object-cover object-top outline-1 not-dark:hidden ${className}`}
                />
            )}
        </>
    );
};
