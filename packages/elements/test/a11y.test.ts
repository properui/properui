import axe from "axe-core";
import { beforeAll, expect, it } from "vitest";
import { defineElements } from "../src/index";

beforeAll(() => defineElements());

/** One page with every element, the way an app would compose them. */
const PAGE = `
<header>
    <pui-breadcrumbs><a href="/">Home</a><a href="/projects">Projects</a><span>Proper UI</span></pui-breadcrumbs>
    <pui-theme-toggle></pui-theme-toggle>
    <pui-avatar initials="OR" alt="Olivia Rhye" status="online"></pui-avatar>
    <pui-avatar src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Phoenix Baker" size="sm"></pui-avatar>
</header>
<main>
    <h1>Settings</h1>
    <pui-alert variant="success" title="Saved" dismissible>Your changes are live.</pui-alert>
    <pui-alert variant="warning" title="Trial ends soon">Seven days left.<div slot="actions"><pui-button color="link-color">Upgrade</pui-button></div></pui-alert>
    <pui-badge color="brand">New</pui-badge>
    <pui-badge color="success" dot size="sm">Active</pui-badge>
    <pui-badge type="modern" color="error" dot>Failed</pui-badge>
    <form>
        <pui-input label="Email" name="email" type="email" hint="We never share it." required></pui-input>
        <pui-input label="Username" name="username" error="That name is taken."></pui-input>
        <pui-textarea label="Bio" name="bio"></pui-textarea>
        <pui-select label="Country" name="country"><option value="us">United States</option><option value="ca">Canada</option></pui-select>
        <pui-checkbox name="terms" hint="You can change this later.">Accept the terms</pui-checkbox>
        <pui-toggle label="Email alerts" name="alerts" checked></pui-toggle>
        <pui-button type="submit">Save</pui-button>
        <pui-button color="secondary" is-disabled>Cancel</pui-button>
        <pui-button color="tertiary" label="Settings"><span slot="icon-leading"><svg viewBox="0 0 24 24"></svg></span></pui-button>
        <pui-button href="/docs" color="link-gray">Read the docs</pui-button>
        <pui-button is-loading>Uploading</pui-button>
    </form>
    <pui-tabs label="Sections" selected="billing">
        <pui-tab value="account">Account</pui-tab>
        <pui-tab value="billing">Billing</pui-tab>
        <pui-tab-panel value="account">Account settings</pui-tab-panel>
        <pui-tab-panel value="billing">Billing settings</pui-tab-panel>
    </pui-tabs>
    <pui-dropdown label="Actions">
        <pui-menu-item value="edit" shortcut="⌘E">Edit</pui-menu-item>
        <hr />
        <pui-menu-item value="archive" is-disabled>Archive</pui-menu-item>
        <pui-menu-item href="/logout">Log out</pui-menu-item>
    </pui-dropdown>
    <pui-tooltip text="Copies the link"><pui-button color="secondary">Share</pui-button></pui-tooltip>
    <pui-progress value="40" label="Upload" show-value></pui-progress>
    <div aria-busy="true"><pui-skeleton variant="circle"></pui-skeleton><pui-skeleton></pui-skeleton></div>
    <pui-pagination page="4" total="12"></pui-pagination>
    <pui-modal id="invite" title="Invite a teammate" description="They get an email with a link." open>
        <pui-input label="Their email" type="email"></pui-input>
        <div slot="footer"><pui-button color="secondary">Cancel</pui-button><pui-button>Send invite</pui-button></div>
    </pui-modal>
</main>`;

it("a page composed of every element has no axe violations", async () => {
    document.documentElement.lang = "en";
    document.title = "Elements";
    document.body.innerHTML = PAGE;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Open the dropdown so its menu is audited too.
    document.querySelector<HTMLButtonElement>(".pui-dropdown__trigger")!.click();
    expect(document.querySelectorAll("pui-button button, pui-button a")).toHaveLength(9);

    const results = await axe.run(document.body, {
        // jsdom has no layout or computed colours to check contrast against.
        rules: { "color-contrast": { enabled: false } },
    });
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
});
