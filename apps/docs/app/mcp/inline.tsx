/** Renders spans written with backticks as `<code>`, so data files can stay plain strings. */
export function Inline({ text }: { text: string }) {
    return (
        <>
            {text
                .split("`")
                .map((part, index) => (index % 2 === 1 ? <code key={`${index}-${part}`}>{part}</code> : <span key={`${index}-${part}`}>{part}</span>))}
        </>
    );
}

/** The same string with the backticks removed, for JSON-LD and other plain-text surfaces. */
export const plain = (text: string) => text.replaceAll("`", "");
