<script lang="ts">
    import { toast } from "@properui/elements";

    let open = $state(false);
    let email = $state("");
    let page = $state(1);

    function send() {
        open = false;
        toast({ title: "Invite sent", description: email, variant: "success" });
        email = "";
    }
</script>

<main class="page">
    <header class="header">
        <div class="row">
            <h1 class="title">Workspace</h1>
            <pui-badge color="brand" size="sm">Svelte 5</pui-badge>
        </div>
        <div class="row">
            <pui-dropdown label="Actions" onpui-select={(e: CustomEvent<{ value: string }>) => toast({ title: `Chose "${e.detail.value}"` })}>
                <pui-menu-item value="rename">Rename</pui-menu-item>
                <pui-menu-item value="duplicate">Duplicate</pui-menu-item>
                <hr />
                <pui-menu-item value="archive">Archive</pui-menu-item>
            </pui-dropdown>
            <pui-theme-toggle></pui-theme-toggle>
        </div>
    </header>

    <pui-alert variant="info" title="Custom elements in Svelte" dismissible>
        Every tag on this page is a &lt;pui-*&gt; element from @properui/elements, rendered by Svelte like any other tag.
    </pui-alert>

    <pui-tabs label="Settings">
        <pui-tab value="members">Members</pui-tab>
        <pui-tab value="notifications">Notifications</pui-tab>
        <pui-tab-panel value="members">
            <div class="stack">
                <div class="row">
                    <pui-avatar initials="OR" alt="Olivia Rhye" status="online"></pui-avatar>
                    <pui-avatar initials="PB" alt="Phoenix Baker"></pui-avatar>
                    <pui-button color="primary" onclick={() => (open = true)}>Invite teammates</pui-button>
                </div>
                <pui-pagination page={page} total="8" onpui-page-change={(e: CustomEvent<{ page: number }>) => (page = e.detail.page)}></pui-pagination>
                <p class="muted">Page {page} of 8</p>
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
        open={open || undefined}
        title="Invite teammates"
        description="They get an email with a link to join."
        size="sm"
        onpui-close={() => (open = false)}
    >
        <pui-input
            label="Email address"
            type="email"
            name="email"
            placeholder="name@example.com"
            value={email}
            oninput={(e: Event) => (email = (e.currentTarget as HTMLInputElement).value)}
        ></pui-input>
        <div slot="footer">
            <pui-button color="secondary" onclick={() => (open = false)}>Cancel</pui-button>
            <pui-button is-disabled={!email || undefined} onclick={send}>Send invite</pui-button>
        </div>
    </pui-modal>
</main>
