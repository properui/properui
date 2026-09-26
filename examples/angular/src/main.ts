import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import "@properui/elements/register";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent, { providers: [provideZonelessChangeDetection()] }).catch((error) => console.error(error));
