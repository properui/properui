"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { BarChartSquare02, Folder, HomeLine, Settings01, Users01 } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

const Frame = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cx("bg-primary ring-secondary h-80 w-full max-w-3xl overflow-hidden rounded-xl shadow-xs ring-1 ring-inset", className)}>{children}</div>
);

const Placeholder = ({ title, detail, className }: { title: string; detail?: string; className?: string }) => (
    <div className={cx("flex h-full flex-col items-center justify-center gap-1 p-4 text-center", className)}>
        <p className="text-primary text-sm font-semibold">{title}</p>
        {detail && <p className="text-tertiary text-xs">{detail}</p>}
    </div>
);

export const ResizableExample = () => (
    <Frame>
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="bg-secondary">
                <Placeholder title="Sidebar" detail="15–40%" />
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize sidebar" />
            <ResizablePanel defaultSize={50} minSize={30}>
                <Placeholder title="Content" detail="at least 30%" />
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize inspector" />
            <ResizablePanel defaultSize={25} minSize={15} className="bg-secondary">
                <Placeholder title="Inspector" detail="at least 15%" />
            </ResizablePanel>
        </ResizablePanelGroup>
    </Frame>
);

export const Vertical = () => (
    <Frame>
        <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65} minSize={25}>
                <Placeholder title="Editor" />
            </ResizablePanel>
            <ResizableHandle aria-label="Resize terminal" />
            <ResizablePanel defaultSize={35} minSize={15} className="bg-secondary">
                <Placeholder title="Terminal" detail="Use the arrow keys on the divider" />
            </ResizablePanel>
        </ResizablePanelGroup>
    </Frame>
);

const navigation = [
    { label: "Home", icon: HomeLine },
    { label: "Projects", icon: Folder },
    { label: "Reports", icon: BarChartSquare02 },
    { label: "Team", icon: Users01 },
    { label: "Settings", icon: Settings01 },
];

export const CollapsibleSidebar = () => {
    const [layout, setLayout] = useState([28, 72]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex w-full max-w-3xl flex-col gap-3">
            <Frame className="max-w-none">
                <ResizablePanelGroup direction="horizontal" defaultLayout={layout} onLayoutChange={setLayout}>
                    <ResizablePanel minSize={20} maxSize={40} collapsible collapsedSize={8} onCollapsedChange={setIsCollapsed} className="bg-secondary">
                        <nav aria-label="Workspace" className="flex flex-col gap-1 p-2">
                            {navigation.map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    type="button"
                                    aria-current={label === "Home" ? "page" : undefined}
                                    className={cx(
                                        "text-secondary outline-focus-ring hover:bg-primary_hover flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold focus-visible:outline-2",
                                        isCollapsed && "justify-center",
                                    )}
                                >
                                    <Icon aria-hidden="true" className="text-fg-quaternary size-5 shrink-0" />
                                    <span className={cx("truncate", isCollapsed && "sr-only")}>{label}</span>
                                </button>
                            ))}
                        </nav>
                    </ResizablePanel>
                    <ResizableHandle withHandle aria-label="Resize navigation" />
                    <ResizablePanel>
                        <Placeholder title="Dashboard" detail="Drag the divider past its minimum, or press Enter on it, to collapse the navigation." />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </Frame>
            <p aria-live="polite" className="text-tertiary text-sm">
                Saved layout: {layout.map((size) => `${Math.round(size)}%`).join(" / ")}
                {isCollapsed ? " (navigation collapsed)" : ""}
            </p>
        </div>
    );
};

export const Nested = () => (
    <Frame>
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={35} minSize={20} className="bg-secondary">
                <Placeholder title="Files" />
            </ResizablePanel>
            <ResizableHandle aria-label="Resize file list" />
            <ResizablePanel defaultSize={65} minSize={30}>
                <ResizablePanelGroup direction="vertical">
                    <ResizablePanel defaultSize={60} minSize={20}>
                        <Placeholder title="Preview" />
                    </ResizablePanel>
                    <ResizableHandle aria-label="Resize details" />
                    <ResizablePanel defaultSize={40} minSize={20} className="bg-secondary">
                        <Placeholder title="Details" />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    </Frame>
);
