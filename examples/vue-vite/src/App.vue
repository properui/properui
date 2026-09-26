<script setup lang="ts">
import { toast } from "@properui/elements";
import { ref } from "vue";

const open = ref(false);
const email = ref("");
const updates = ref(true);
const page = ref(1);

function send() {
    open.value = false;
    toast({ title: "Invite sent", description: email.value, variant: "success" });
    email.value = "";
}

function onUpdates(event: Event) {
    updates.value = (event.target as HTMLInputElement).checked;
}

function onAction(event: CustomEvent<{ value: string }>) {
    toast({ title: `Chose "${event.detail.value}"` });
}
</script>

<template>
    <main class="page">
        <header class="header">
            <div class="row">
                <h1 class="title">Workspace</h1>
                <pui-badge color="brand" size="sm">Vue 3</pui-badge>
            </div>
            <div class="row">
                <pui-dropdown label="Actions" @pui-select="onAction">
                    <pui-menu-item value="rename">Rename</pui-menu-item>
                    <pui-menu-item value="duplicate">Duplicate</pui-menu-item>
                    <hr />
                    <pui-menu-item value="archive">Archive</pui-menu-item>
                </pui-dropdown>
                <pui-theme-toggle />
            </div>
        </header>

        <pui-alert variant="info" title="Custom elements in Vue" dismissible>
            Every tag on this page is a &lt;pui-*&gt; element from @properui/elements, rendered by Vue like any other tag.
        </pui-alert>

        <pui-tabs label="Settings">
            <pui-tab value="members">Members</pui-tab>
            <pui-tab value="notifications">Notifications</pui-tab>
            <pui-tab-panel value="members">
                <div class="stack">
                    <div class="row">
                        <pui-avatar initials="OR" alt="Olivia Rhye" status="online" />
                        <pui-avatar initials="PB" alt="Phoenix Baker" />
                        <pui-button color="primary" @click="open = true">Invite teammates</pui-button>
                    </div>
                    <pui-pagination :page="page" total="8" @pui-page-change="page = $event.detail.page" />
                    <p class="muted">Page {{ page }} of 8</p>
                </div>
            </pui-tab-panel>
            <pui-tab-panel value="notifications">
                <div class="stack">
                    <pui-toggle label="Product updates" :checked="updates" @change="onUpdates" />
                    <pui-progress value="64" label="Storage used" show-value />
                </div>
            </pui-tab-panel>
        </pui-tabs>

        <pui-modal :open="open" title="Invite teammates" description="They get an email with a link to join." size="sm" @pui-close="open = false">
            <pui-input v-model="email" label="Email address" type="email" name="email" placeholder="name@example.com" />
            <div slot="footer">
                <pui-button color="secondary" @click="open = false">Cancel</pui-button>
                <pui-button :is-disabled="!email" @click="send">Send invite</pui-button>
            </div>
        </pui-modal>
    </main>
</template>
