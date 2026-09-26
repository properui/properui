import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        vue({
            // `<pui-*>` tags are custom elements from @properui/elements, not Vue components.
            template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("pui-") } },
        }),
    ],
});
