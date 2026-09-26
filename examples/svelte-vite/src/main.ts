import { mount } from "svelte";
import "@properui/elements/register";
import "@properui/tokens/properui.css";
import App from "./App.svelte";
import "./style.css";

mount(App, { target: document.getElementById("app")! });
