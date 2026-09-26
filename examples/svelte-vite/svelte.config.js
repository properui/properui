import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
    preprocess: vitePreprocess(),
    compilerOptions: {
        // Svelte cannot know that <pui-button> renders a real <button>, so it flags a click handler on it.
        warningFilter: (warning) => !(warning.code.startsWith("a11y_") && warning.message.includes("<pui-")),
    },
};
