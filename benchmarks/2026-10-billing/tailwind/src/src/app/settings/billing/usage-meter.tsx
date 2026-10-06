import { formatNumber } from "./format";

type Props = { label: string; used: number; limit: number; unit: string };

export function UsageMeter({ label, used, limit, unit }: Props) {
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const tone = pct >= 90 ? "bg-red-600" : pct >= 75 ? "bg-amber-500" : "bg-indigo-600";
    const suffix = unit ? ` ${unit}` : "";
    return (
        <div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-foreground font-medium">{label}</span>
                <span className="text-zinc-600 tabular-nums dark:text-zinc-400">
                    {formatNumber(used)} / {formatNumber(limit)}
                    {suffix}
                </span>
            </div>
            <div
                role="progressbar"
                aria-label={`${label} usage`}
                aria-valuemin={0}
                aria-valuemax={limit}
                aria-valuenow={used}
                aria-valuetext={`${formatNumber(used)}${suffix} of ${formatNumber(limit)}${suffix} used (${pct}%)`}
                className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            >
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
