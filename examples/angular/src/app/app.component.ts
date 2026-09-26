import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from "@angular/core";
import { toast } from "@properui/elements";

@Component({
    selector: "app-root",
    // Lets the template use the <pui-*> custom elements and any attribute on them.
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <main class="page">
            <header class="header">
                <div class="row">
                    <h1 class="title">Workspace</h1>
                    <pui-badge color="brand" size="sm">Angular</pui-badge>
                </div>
                <div class="row">
                    <pui-dropdown label="Actions" (pui-select)="onAction($event)">
                        <pui-menu-item value="rename">Rename</pui-menu-item>
                        <pui-menu-item value="duplicate">Duplicate</pui-menu-item>
                        <hr />
                        <pui-menu-item value="archive">Archive</pui-menu-item>
                    </pui-dropdown>
                    <pui-theme-toggle></pui-theme-toggle>
                </div>
            </header>

            <pui-alert variant="info" title="Custom elements in Angular" dismissible>
                Every tag on this page is a &lt;pui-*&gt; element from &#64;properui/elements, allowed by CUSTOM_ELEMENTS_SCHEMA.
            </pui-alert>

            <pui-tabs label="Settings">
                <pui-tab value="members">Members</pui-tab>
                <pui-tab value="notifications">Notifications</pui-tab>
                <pui-tab-panel value="members">
                    <div class="stack">
                        <div class="row">
                            <pui-avatar initials="OR" alt="Olivia Rhye" status="online"></pui-avatar>
                            <pui-avatar initials="PB" alt="Phoenix Baker"></pui-avatar>
                            <pui-button color="primary" (click)="open.set(true)">Invite teammates</pui-button>
                        </div>
                        <pui-pagination [attr.page]="page()" total="8" (pui-page-change)="onPage($event)"></pui-pagination>
                        <p class="muted">Page {{ page() }} of 8</p>
                    </div>
                </pui-tab-panel>
                <pui-tab-panel value="notifications">
                    <div class="stack">
                        <pui-toggle label="Product updates" checked></pui-toggle>
                        <pui-progress value="64" label="Storage used" show-value></pui-progress>
                    </div>
                </pui-tab-panel>
            </pui-tabs>

            <pui-modal
                title="Invite teammates"
                description="They get an email with a link to join."
                size="sm"
                [attr.open]="open() ? '' : null"
                (pui-close)="open.set(false)"
            >
                <pui-input
                    label="Email address"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    [value]="email()"
                    (input)="onEmail($event)"
                ></pui-input>
                <div slot="footer">
                    <pui-button color="secondary" (click)="open.set(false)">Cancel</pui-button>
                    <pui-button [attr.is-disabled]="email() ? null : ''" (click)="send()">Send invite</pui-button>
                </div>
            </pui-modal>
        </main>
    `,
})
export class AppComponent {
    readonly open = signal(false);
    readonly email = signal("");
    readonly page = signal(1);

    onEmail(event: Event): void {
        this.email.set((event.target as HTMLInputElement).value);
    }

    onPage(event: Event): void {
        this.page.set((event as CustomEvent<{ page: number }>).detail.page);
    }

    onAction(event: Event): void {
        toast({ title: `Chose "${(event as CustomEvent<{ value: string }>).detail.value}"` });
    }

    send(): void {
        this.open.set(false);
        toast({ title: "Invite sent", description: this.email(), variant: "success" });
        this.email.set("");
    }
}
