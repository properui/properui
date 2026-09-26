"use client";

import { useState } from "react";
import { type Selection as AriaSelection, SubmenuTrigger as AriaSubmenuTrigger } from "react-aria-components";
import { Clipboard, Copy01, CornerUpLeft, CornerUpRight, Download01, FilePlus02, Save01, Scissors01, XClose } from "@properui/icons";
import { Dropdown } from "../dropdown/dropdown";
import { Menubar } from "./menubar";

/** A `File`/`Edit`/`View` application menu bar: shortcuts, a submenu, and checkbox/radio groups. */
export const MenubarExample = () => {
    const [viewOptions, setViewOptions] = useState<AriaSelection>(new Set(["sidebar"]));
    const [zoom, setZoom] = useState<AriaSelection>(new Set(["100"]));

    return (
        <Menubar aria-label="Main menu">
            <Menubar.Menu id="file" label="File">
                <Menubar.Item icon={FilePlus02} addon="⌘T">
                    New tab
                </Menubar.Item>
                <Menubar.Item icon={FilePlus02} addon="⌘N">
                    New window
                </Menubar.Item>
                <Menubar.Separator />
                <Menubar.Item icon={Save01} addon="⌘S">
                    Save
                </Menubar.Item>

                <AriaSubmenuTrigger>
                    <Menubar.Item icon={Download01}>Export</Menubar.Item>
                    <Dropdown.Popover placement="right top">
                        <Dropdown.Menu aria-label="Export as" selectionMode="none">
                            <Dropdown.Item>PDF</Dropdown.Item>
                            <Dropdown.Item>HTML</Dropdown.Item>
                            <Dropdown.Item>Markdown</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </AriaSubmenuTrigger>

                <Menubar.Separator />
                <Menubar.Item icon={XClose} addon="⌘W">
                    Close
                </Menubar.Item>
            </Menubar.Menu>

            <Menubar.Menu id="edit" label="Edit">
                <Menubar.Item icon={CornerUpLeft} addon="⌘Z">
                    Undo
                </Menubar.Item>
                <Menubar.Item icon={CornerUpRight} addon="⌘⇧Z">
                    Redo
                </Menubar.Item>
                <Menubar.Separator />
                <Menubar.Item icon={Scissors01} addon="⌘X">
                    Cut
                </Menubar.Item>
                <Menubar.Item icon={Copy01} addon="⌘C">
                    Copy
                </Menubar.Item>
                <Menubar.Item icon={Clipboard} addon="⌘V">
                    Paste
                </Menubar.Item>
            </Menubar.Menu>

            <Menubar.Menu id="view" label="View">
                <Menubar.Section selectionMode="multiple" selectedKeys={viewOptions} onSelectionChange={setViewOptions}>
                    <Menubar.Item id="sidebar" selectionIndicator="checkbox">
                        Show sidebar
                    </Menubar.Item>
                    <Menubar.Item id="status-bar" selectionIndicator="checkbox">
                        Show status bar
                    </Menubar.Item>
                </Menubar.Section>

                <Menubar.Separator />

                <Menubar.SectionHeader className="text-quaternary px-2.5 pt-1.5 pb-1 text-xs font-medium">Zoom level</Menubar.SectionHeader>
                <Menubar.Section selectionMode="single" selectedKeys={zoom} onSelectionChange={setZoom}>
                    <Menubar.Item id="50" selectionIndicator="radio">
                        50%
                    </Menubar.Item>
                    <Menubar.Item id="100" selectionIndicator="radio">
                        100%
                    </Menubar.Item>
                    <Menubar.Item id="150" selectionIndicator="radio">
                        150%
                    </Menubar.Item>
                </Menubar.Section>
            </Menubar.Menu>
        </Menubar>
    );
};

/** A menu bar with a disabled top-level menu and a disabled item — both keep their place, dimmed and non-interactive. */
export const WithDisabledItems = () => (
    <Menubar aria-label="Main menu">
        <Menubar.Menu id="file" label="File">
            <Menubar.Item icon={FilePlus02}>New tab</Menubar.Item>
            <Menubar.Item icon={Save01} isDisabled>
                Save (nothing to save)
            </Menubar.Item>
        </Menubar.Menu>

        <Menubar.Menu id="edit" label="Edit" isDisabled>
            <Menubar.Item>Undo</Menubar.Item>
        </Menubar.Menu>

        <Menubar.Menu id="help" label="Help">
            <Menubar.Item>Documentation</Menubar.Item>
            <Menubar.Item>Keyboard shortcuts</Menubar.Item>
        </Menubar.Menu>
    </Menubar>
);

/** A minimal two-menu bar — the smallest useful shape, with no shortcuts, submenus or selection. */
export const Minimal = () => (
    <Menubar aria-label="Document menu">
        <Menubar.Menu id="file" label="File">
            <Menubar.Item>New</Menubar.Item>
            <Menubar.Item>Open…</Menubar.Item>
            <Menubar.Item>Save</Menubar.Item>
        </Menubar.Menu>

        <Menubar.Menu id="help" label="Help">
            <Menubar.Item>About</Menubar.Item>
        </Menubar.Menu>
    </Menubar>
);
