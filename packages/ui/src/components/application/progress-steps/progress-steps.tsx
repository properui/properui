import type { CSSProperties, FC, ReactNode } from "react";
import { cx, sortCx } from "../../../utils/cx";
import { FeaturedIcon } from "../../foundations/featured-icon/featured-icon";

const styles = sortCx({
    common: {
        // The dot/number indicator shared by the `dot` and `number` types.
        indicator: "z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
        title: "text-sm font-semibold",
        description: "text-sm",
        // Horizontal steps share the width of the row equally.
        list: "grid w-full items-start justify-start",
    },

    indicators: {
        dot: {
            complete: "bg-brand-solid",
            current: "bg-brand-solid ring-2 ring-focus-ring ring-offset-2 ring-offset-bg-primary",
            incomplete: "bg-primary ring-[1.5px] ring-primary ring-inset",
        },
        number: {
            complete: "bg-success-solid text-fg-white",
            current: "bg-primary text-secondary ring-1 ring-secondary ring-inset",
            incomplete: "bg-primary text-quaternary opacity-60 ring-1 ring-secondary ring-inset",
        },
        "featured-icon": {
            complete: "",
            current: "",
            incomplete: "text-fg-quaternary",
        },
        // The `line` type has no circle — the "indicator" is the bar above the label.
        line: {
            complete: "bg-fg-brand-primary_alt",
            current: "bg-fg-brand-primary_alt",
            incomplete: "bg-quaternary",
        },
    },

    connectors: {
        dot: {
            complete: "border-brand",
            current: "border-secondary",
            incomplete: "border-secondary",
        },
        number: {
            complete: "border-secondary",
            current: "border-secondary",
            incomplete: "border-secondary",
        },
        "featured-icon": {
            complete: "border-fg-secondary",
            current: "border-secondary",
            incomplete: "border-secondary",
        },
        line: {
            complete: "",
            current: "",
            incomplete: "",
        },
    },
});

/** How far along a single step is. `locked` is a step the user cannot jump to yet (e.g. a later step in a wizard that depends on earlier ones); it looks like `incomplete` and, when `onStepPress` is set, cannot be pressed. */
export type ProgressStepStatus = "complete" | "current" | "incomplete" | "locked";

/** The indicator/connector style maps only define looks for complete/current/incomplete — `locked` reuses `incomplete`'s. */
const asStyleStatus = (status: ProgressStepStatus): "complete" | "current" | "incomplete" => (status === "locked" ? "incomplete" : status);

/** The visual treatment of the step indicator. */
export type ProgressStepsType = keyof typeof styles.indicators;

/** The line drawn between two steps. */
export type ProgressStepsConnector = "solid" | "dashed" | "none";

/** The direction the steps flow in. */
export type ProgressStepsOrientation = "horizontal" | "vertical";

/**
 * Types that convey "not reached yet" by dimming the step instead of by
 * recolouring the indicator.
 */
const dimmingTypes: ProgressStepsType[] = ["number", "featured-icon"];

/** Types whose current step is highlighted with the brand text colors. */
const brandCurrentTypes: ProgressStepsType[] = ["dot", "line"];

export interface ProgressStepItem {
    /** A unique id for the step. */
    id: string;
    /** The title of the step. */
    title: ReactNode;
    /** A supporting description rendered below the title. */
    description?: ReactNode;
    /** The icon of the step — only rendered by the `featured-icon` type. */
    icon?: FC<{ className?: string }>;
    /**
     * How far along the step is.
     *
     * @default "incomplete"
     */
    status?: ProgressStepStatus;
    /** Extra content rendered under the step's description. */
    children?: ReactNode;
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className={cx("size-3", className)}>
        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/** The dashed connector is an SVG because a dotted border cannot render round dots. */
const DashedConnector = ({ orientation, className }: { orientation: ProgressStepsOrientation; className?: string }) =>
    orientation === "horizontal" ? (
        <svg aria-hidden="true" className={cx("absolute start-[53%] top-1/2 z-0 h-[2.5px] w-full flex-1 -translate-y-1/2", className)}>
            <line x1="1.2" y1="1.2" x2="100%" y2="1.2" strokeWidth="2.4" strokeDasharray="0,6" strokeLinecap="round" className="stroke-border-primary" />
        </svg>
    ) : (
        <div className={cx("relative my-1 flex h-full w-full justify-center self-center overflow-hidden", className)}>
            <svg aria-hidden="true" width="3" className="absolute">
                <line x1="1.2" y1="1.2" x2="1.2" y2="100%" strokeWidth="2.4" strokeDasharray="0,6" strokeLinecap="round" className="stroke-border-primary" />
            </svg>
        </div>
    );

interface ConnectorProps {
    type: ProgressStepsType;
    connector: ProgressStepsConnector;
    orientation: ProgressStepsOrientation;
    status: ProgressStepStatus;
    /** Dim the connector when it leads into a step that has not been reached yet. */
    isDimmed?: boolean;
}

const Connector = ({ type, connector, orientation, status, isDimmed }: ConnectorProps) => {
    if (connector === "none") return null;

    if (connector === "dashed") {
        return <DashedConnector orientation={orientation} className={isDimmed ? "opacity-60" : undefined} />;
    }

    return (
        <span
            className={cx(
                "rounded-xs",
                orientation === "horizontal" ? "absolute start-[53%] top-1/2 z-0 w-full flex-1 -translate-y-1/2 border-t-2" : "my-1 flex-1 border-s-2",
                styles.connectors[type][asStyleStatus(status)],
                isDimmed && "opacity-60",
            )}
        />
    );
};

interface IndicatorProps {
    type: ProgressStepsType;
    status: ProgressStepStatus;
    orientation: ProgressStepsOrientation;
    /** The 1-based position of the step, rendered by the `number` type. */
    position: number;
    icon?: FC<{ className?: string }>;
}

const Indicator = ({ type, status, orientation, position, icon }: IndicatorProps) => {
    if (type === "featured-icon") {
        return (
            <FeaturedIcon
                theme="modern"
                color="gray"
                size="md"
                icon={icon}
                className={cx(
                    "z-10",
                    // Vertical steps dim the whole item, so recolouring the icon there would dim it twice.
                    orientation === "horizontal" && styles.indicators["featured-icon"][asStyleStatus(status)],
                )}
            />
        );
    }

    if (type === "number") {
        return (
            <span className={cx(styles.common.indicator, styles.indicators.number[asStyleStatus(status)])}>
                {status === "complete" ? <CheckIcon /> : <span className="text-xs font-semibold">{position}</span>}
            </span>
        );
    }

    return (
        <span className={cx(styles.common.indicator, styles.indicators.dot[asStyleStatus(status)])}>
            {status === "complete" ? (
                <CheckIcon className="text-fg-white" />
            ) : (
                <span className={cx("size-2 rounded-full", status === "current" ? "bg-fg-white" : "bg-fg-quaternary")} />
            )}
        </span>
    );
};

/**
 * Renders a step's row as a plain `div` by default, or as a `<button>` when `onPress` is
 * given — locked steps stay non-interactive either way. Keeps the exact layout classes the
 * static `div` used, so turning a `ProgressSteps` interactive changes nothing visually.
 */
const StepRow = ({ onPress, isLocked, className, children }: { onPress?: () => void; isLocked?: boolean; className: string; children: ReactNode }) => {
    if (!onPress) {
        return <div className={className}>{children}</div>;
    }

    return (
        <button
            type="button"
            onClick={onPress}
            disabled={isLocked}
            className={cx(
                className,
                "outline-focus-ring cursor-pointer text-start focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
            )}
        >
            {children}
        </button>
    );
};

export interface ProgressStepsProps {
    /** The steps, in order. */
    items: ProgressStepItem[];
    /**
     * The visual treatment of the step indicator.
     *
     * @default "dot"
     */
    type?: ProgressStepsType;
    /**
     * The direction the steps flow in.
     *
     * @default "horizontal"
     */
    orientation?: ProgressStepsOrientation;
    /**
     * The line drawn between two steps.
     *
     * @default "solid"
     */
    connector?: ProgressStepsConnector;
    /**
     * The accessible label of the surrounding navigation landmark.
     *
     * @default "Progress"
     */
    "aria-label"?: string;
    /** The class name applied to the step list. */
    className?: string;
    /**
     * Called with a step's `id` when it is pressed. When provided, every step (other than
     * `locked` ones) renders as a `<button>` instead of static markup, so steps can be used
     * to jump around a wizard. Omit to keep the default, non-interactive rendering.
     */
    onStepPress?: (id: string) => void;
}

const ProgressStepsRoot = ({
    items,
    type = "dot",
    orientation = "horizontal",
    connector = "solid",
    "aria-label": ariaLabel = "Progress",
    className,
    onStepPress,
}: ProgressStepsProps) => {
    const isHorizontal = orientation === "horizontal";
    const dimsIncomplete = dimmingTypes.includes(type);
    const hasBrandCurrent = brandCurrentTypes.includes(type);

    // A horizontal list gives every step an equal share of the row; a vertical one is a single column.
    const listStyle: CSSProperties | undefined = isHorizontal ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined;

    return (
        <nav aria-label={ariaLabel} className="w-full">
            <ol
                style={listStyle}
                className={cx(
                    styles.common.list,
                    isHorizontal ? "gap-4" : "grid-cols-1",
                    // The `line` type has no connector to stretch, so the rows need their own gap.
                    !isHorizontal && type === "line" && "gap-5",
                    className,
                )}
            >
                {items.map((item, index) => {
                    const status = item.status ?? "incomplete";
                    const isLocked = status === "locked";
                    const isLast = index === items.length - 1;
                    const isDimmed = dimsIncomplete && (status === "incomplete" || isLocked);
                    const nextStatus = items[index + 1]?.status;
                    const isConnectorDimmed = !isHorizontal && dimsIncomplete && !isDimmed && (nextStatus === "incomplete" || nextStatus === "locked");

                    const title = (
                        <p
                            className={cx(
                                styles.common.title,
                                hasBrandCurrent && status === "current" ? "text-brand-secondary" : "text-secondary",
                                isHorizontal && type !== "line" && "w-full text-center",
                            )}
                        >
                            {item.title}
                        </p>
                    );

                    const description = item.description && (
                        <p
                            className={cx(
                                styles.common.description,
                                hasBrandCurrent && status === "current" ? "text-brand-tertiary" : "text-tertiary",
                                isHorizontal && type !== "line" && "w-full text-center",
                            )}
                        >
                            {item.description}
                        </p>
                    );

                    if (type === "line") {
                        return (
                            <li key={item.id} aria-current={status === "current" ? "step" : undefined}>
                                <StepRow
                                    onPress={onStepPress && (() => onStepPress(item.id))}
                                    isLocked={isLocked}
                                    className="relative flex w-full flex-col items-center justify-center pt-3"
                                >
                                    <span aria-hidden="true" className={cx("absolute inset-x-0 top-0 h-1", styles.indicators.line[asStyleStatus(status)])} />
                                    <div className="flex w-full flex-col items-start self-stretch">
                                        {title}
                                        {description}
                                        {item.children}
                                    </div>
                                </StepRow>
                            </li>
                        );
                    }

                    const indicator = <Indicator type={type} status={status} orientation={orientation} position={index + 1} icon={item.icon} />;
                    const line = !isLast && (
                        <Connector type={type} connector={connector} orientation={orientation} status={status} isDimmed={isConnectorDimmed} />
                    );

                    if (isHorizontal) {
                        return (
                            <li key={item.id} aria-current={status === "current" ? "step" : undefined}>
                                <StepRow
                                    onPress={onStepPress && (() => onStepPress(item.id))}
                                    isLocked={isLocked}
                                    className="flex w-full flex-col items-center justify-center gap-3"
                                >
                                    <div className="relative flex w-full flex-col items-center self-stretch">
                                        {indicator}
                                        {line}
                                    </div>
                                    <div className={cx("flex w-full flex-col items-start self-stretch", isDimmed && "opacity-60")}>
                                        {title}
                                        {description}
                                        {item.children}
                                    </div>
                                </StepRow>
                            </li>
                        );
                    }

                    return (
                        <li key={item.id} aria-current={status === "current" ? "step" : undefined}>
                            <StepRow
                                onPress={onStepPress && (() => onStepPress(item.id))}
                                isLocked={isLocked}
                                className={cx("flex flex-row items-start justify-start gap-3", type !== "featured-icon" && "h-max", isDimmed && "opacity-60")}
                            >
                                <div className="flex flex-col items-center self-stretch">
                                    {indicator}
                                    {line}
                                </div>
                                <div
                                    className={cx(
                                        "flex flex-col items-start",
                                        type !== "featured-icon" && "pt-0.5",
                                        !isLast && (type === "featured-icon" ? "pb-8" : "pb-6"),
                                    )}
                                >
                                    {title}
                                    {description}
                                    {item.children}
                                </div>
                            </StepRow>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

const statusLabels: Record<ProgressStepStatus, string> = {
    complete: "completed",
    current: "current",
    incomplete: "not started",
    locked: "locked",
};

export interface ProgressStepsMinimalProps {
    /** The status of every step, in order. */
    items: ProgressStepStatus[];
    /** A label rendered before the indicators, e.g. `Step 1 of 4`. */
    label?: ReactNode;
    /**
     * The line drawn between two steps.
     *
     * @default "none"
     */
    connector?: Exclude<ProgressStepsConnector, "dashed">;
    /**
     * The accessible label of the surrounding navigation landmark.
     *
     * @default "Progress"
     */
    "aria-label"?: string;
    /** The class name applied to the root element. */
    className?: string;
}

const ProgressStepsMinimal = ({ items, label, connector = "none", "aria-label": ariaLabel = "Progress", className }: ProgressStepsMinimalProps) => (
    <nav aria-label={ariaLabel} className={cx("flex w-full flex-row items-center justify-center gap-3", className)}>
        {label && <p className="text-secondary text-sm font-medium">{label}</p>}

        <ol className={cx("flex items-center justify-center", connector === "none" && "gap-3")}>
            {items.map((status, index) => (
                <li key={index} aria-current={status === "current" ? "step" : undefined} className="flex items-center justify-center">
                    <span className="sr-only">{`Step ${index + 1}, ${statusLabels[status]}`}</span>

                    <Indicator type="dot" status={status} orientation="horizontal" position={index + 1} />

                    {connector === "solid" && index < items.length - 1 && (
                        <span aria-hidden="true" className={cx("w-20 flex-1 border-t-2", styles.connectors.dot[asStyleStatus(status)])} />
                    )}
                </li>
            ))}
        </ol>
    </nav>
);

export const ProgressSteps = Object.assign(ProgressStepsRoot, {
    Minimal: ProgressStepsMinimal,
});
