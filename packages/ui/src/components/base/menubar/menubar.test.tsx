import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { Menubar } from "./menubar";
import * as Demos from "./menubar.demo";

/** React Aria listens for pointer events, so a plain `click` is not enough to press a trigger. */
const press = (element: HTMLElement) => {
    fireEvent.pointerDown(element, { pointerType: "mouse", button: 0 });
    fireEvent.pointerUp(element, { pointerType: "mouse", button: 0 });
    fireEvent.click(element);
};

describe("Menubar", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("is closed until a top-level trigger is pressed", async () => {
        render(
            <Menubar aria-label="Main menu">
                <Menubar.Menu id="file" label="File">
                    <Menubar.Item>New</Menubar.Item>
                </Menubar.Menu>
                <Menubar.Menu id="edit" label="Edit">
                    <Menubar.Item>Undo</Menubar.Item>
                </Menubar.Menu>
            </Menubar>,
        );

        expect(screen.queryByRole("menu")).toBeNull();

        press(screen.getByRole("button", { name: "File" }));
        await waitFor(() => expect(screen.getByRole("menu", { name: "File" })).toBeInTheDocument());
    });

    it("moves focus between top-level menus with the arrow keys", () => {
        render(
            <Menubar aria-label="Main menu">
                <Menubar.Menu id="file" label="File">
                    <Menubar.Item>New</Menubar.Item>
                </Menubar.Menu>
                <Menubar.Menu id="edit" label="Edit">
                    <Menubar.Item>Undo</Menubar.Item>
                </Menubar.Menu>
            </Menubar>,
        );

        const file = screen.getByRole("button", { name: "File" });
        const edit = screen.getByRole("button", { name: "Edit" });

        file.focus();
        expect(file).toHaveFocus();

        fireEvent.keyDown(file, { key: "ArrowRight" });
        expect(edit).toHaveFocus();

        fireEvent.keyDown(edit, { key: "ArrowLeft" });
        expect(file).toHaveFocus();
    });

    it("switches to a sibling menu on hover once one is already open", async () => {
        render(
            <Menubar aria-label="Main menu">
                <Menubar.Menu id="file" label="File">
                    <Menubar.Item>New</Menubar.Item>
                </Menubar.Menu>
                <Menubar.Menu id="edit" label="Edit">
                    <Menubar.Item>Undo</Menubar.Item>
                </Menubar.Menu>
            </Menubar>,
        );

        press(screen.getByRole("button", { name: "File" }));
        await waitFor(() => expect(screen.getByRole("menu", { name: "File" })).toBeInTheDocument());

        fireEvent.mouseEnter(screen.getByRole("button", { name: "Edit" }));
        await waitFor(() => expect(screen.getByRole("menu", { name: "Edit" })).toBeInTheDocument());
        expect(screen.queryByRole("menu", { name: "File" })).toBeNull();
    });

    it("closes the open menu on Escape", async () => {
        render(
            <Menubar aria-label="Main menu">
                <Menubar.Menu id="file" label="File">
                    <Menubar.Item>New</Menubar.Item>
                </Menubar.Menu>
            </Menubar>,
        );

        press(screen.getByRole("button", { name: "File" }));
        const menu = await waitFor(() => screen.getByRole("menu"));

        fireEvent.keyDown(menu, { key: "Escape" });
        await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    });

    it("does not open a disabled top-level menu", () => {
        render(
            <Menubar aria-label="Main menu">
                <Menubar.Menu id="file" label="File" isDisabled>
                    <Menubar.Item>New</Menubar.Item>
                </Menubar.Menu>
            </Menubar>,
        );

        const file = screen.getByRole("button", { name: "File" });
        expect(file).toBeDisabled();

        press(file);
        expect(screen.queryByRole("menu")).toBeNull();
    });
});
