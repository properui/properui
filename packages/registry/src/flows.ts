/**
 * Curated user flows: ordered sequences of example entries that together cover a product journey
 * (sign up, onboard, bill, recover from an error). Written verbatim to dist/flows.json by build.ts,
 * which fails the build if a step names an entry that does not exist or has no light thumbnail.
 *
 * Add a flow: append an object below. `entry` must be an "example" entry name from dist/index.json
 * (an app-examples, marketing-examples or marketing variant). Copy rules: no em dashes, no ellipsis
 * character; one sentence per `purpose`; 4 to 8 `tags` using the words people search for.
 */

export type FlowStep = {
    /** Registry entry name of an example, e.g. "login-simple". */
    entry: string;
    /** One sentence on what this screen does in the journey. */
    purpose: string;
};

export type Flow = {
    id: string;
    title: string;
    description: string;
    tags: string[];
    steps: FlowStep[];
};

export const FLOWS: Flow[] = [
    {
        id: "auth",
        title: "Authentication",
        description: "Sign up, confirm the email address, log in, and recover a forgotten password.",
        tags: ["login", "sign up", "register", "authentication", "forgot password", "verify email", "reset password"],
        steps: [
            { entry: "signup-simple", purpose: "A short sign-up form that asks for the minimum to create an account." },
            { entry: "step-1-check-email", purpose: "Tells the new user a confirmation email is on its way." },
            { entry: "step-3-success", purpose: "Confirms the email address is verified and points to the next action." },
            { entry: "login-simple", purpose: "The returning-user log-in form with email, password and a forgot-password link." },
            { entry: "step-1-forgot-password", purpose: "Collects the email address to send a password reset link to." },
            { entry: "step-3-set-new-password", purpose: "Lets the user choose a new password after following the reset link." },
        ],
    },
    {
        id: "onboarding",
        title: "Onboarding to first dashboard",
        description: "A multi-step sign-up that ends on an empty dashboard prompting the first action.",
        tags: ["onboarding", "welcome", "first run", "empty state", "setup", "progress steps", "activation"],
        steps: [
            { entry: "signup-progress-01", purpose: "First step of a progress-tracked sign-up, collecting the account basics." },
            { entry: "signup-progress-02", purpose: "Second step, gathering details about the person or company." },
            { entry: "signup-progress-03", purpose: "Final sign-up step before the user lands in the product." },
            { entry: "settings-10", purpose: "A complete-your-account checklist that nudges the user to finish setup." },
            { entry: "dashboard-01", purpose: "A dashboard with empty-state prompts to create the first post and member." },
        ],
    },
    {
        id: "settings",
        title: "Account settings",
        description: "The pages behind a settings area: profile, password, team, notifications and integrations.",
        tags: ["settings", "profile", "account", "password", "notifications", "preferences", "integrations"],
        steps: [
            { entry: "settings-03", purpose: "Edit the public profile: photo, bio, job title and website." },
            { entry: "settings-05", purpose: "Change the password with current, new and confirm fields." },
            { entry: "settings-09", purpose: "List team members with roles and last-active dates." },
            { entry: "settings-17", purpose: "Choose which events send email or text notifications." },
            { entry: "settings-21", purpose: "Browse and connect third-party apps by category." },
        ],
    },
    {
        id: "billing",
        title: "Billing and subscription",
        description: "Choose a plan, update the card on file and review past invoices.",
        tags: ["billing", "checkout", "paywall", "subscription", "upgrade", "invoices", "payment method", "pricing"],
        steps: [
            { entry: "pricing-page-01", purpose: "Compare plans and pick the one to upgrade to." },
            { entry: "settings-12", purpose: "Show the current plan next to the other plans on offer." },
            { entry: "settings-14", purpose: "Add or update the payment card with address details." },
            { entry: "settings-13", purpose: "Show the payment method and upcoming billing date in one place." },
            { entry: "settings-11", purpose: "List past invoices with amount, date and status for download." },
        ],
    },
    {
        id: "team-management",
        title: "Team management",
        description: "Invite people, assign roles and organise members into teams.",
        tags: ["team", "invite", "members", "roles", "permissions", "users", "admin"],
        steps: [
            { entry: "settings-07", purpose: "Invite team members by email and set their access level." },
            { entry: "settings-09", purpose: "Review every account user, split into admins and standard users." },
            { entry: "settings-08", purpose: "Group members into teams and see who belongs to which." },
        ],
    },
    {
        id: "dashboards",
        title: "Dashboard and analytics layouts",
        description: "Five dashboard layouts on different sidebar styles, from product overview to finance.",
        tags: ["dashboard", "analytics", "sidebar", "navigation", "charts", "metrics", "overview", "admin"],
        steps: [
            { entry: "dashboard-01", purpose: "A simple-sidebar overview with headline metrics and getting-started cards." },
            { entry: "dashboard-04", purpose: "A dual-tier sidebar with a revenue chart and recent customers." },
            { entry: "dashboard-06", purpose: "A slim sidebar and a filterable customer table for dense data." },
            { entry: "dashboard-17", purpose: "A website analytics view with traffic sources and sessions by country." },
            { entry: "dashboard-13", purpose: "A banking dashboard with balance history and spending breakdown." },
        ],
    },
    {
        id: "error-recovery",
        title: "Error and recovery",
        description: "Not-found screens that explain what went wrong and send the user somewhere useful.",
        tags: ["404", "not found", "error", "empty state", "recovery", "broken link", "fallback"],
        steps: [
            { entry: "not-found-page-01", purpose: "A full marketing-site 404 page with header, footer and a way home." },
            { entry: "not-found-simple-02", purpose: "A minimal in-app 404 with a short message and one primary action." },
            { entry: "not-found-illustration-01", purpose: "A friendlier 404 that uses an illustration to soften the dead end." },
            { entry: "not-found-screen-mockup", purpose: "A 404 that shows the product itself to keep the visitor engaged." },
        ],
    },
    {
        id: "email-lifecycle",
        title: "Email lifecycle",
        description: "Transactional and onboarding emails from address verification to team invites.",
        tags: ["email", "transactional", "welcome email", "verification", "invite", "onboarding email", "template"],
        steps: [
            { entry: "simple-verification", purpose: "Sends the verification code or link to confirm an email address." },
            { entry: "simple-welcome-01", purpose: "A plain, text-first welcome email sent right after sign-up." },
            { entry: "simple-invite", purpose: "Invites someone to join a team, with a clear accept button." },
            { entry: "video-welcome-01", purpose: "A welcome email built around an intro video to drive activation." },
            { entry: "mockup-02", purpose: "A product-mockup email that shows the app in action." },
        ],
    },
    {
        id: "marketing-site",
        title: "Marketing site",
        description: "The core pages of a company website, from landing page to contact.",
        tags: ["marketing", "landing page", "website", "pricing", "about", "contact", "faq", "company site"],
        steps: [
            { entry: "landing-page-01", purpose: "The home page that explains the product and drives sign-ups." },
            { entry: "pricing-page-01", purpose: "Plans and prices with a clear call to action on each tier." },
            { entry: "about-page-01", purpose: "Tells the company story with metrics and social proof." },
            { entry: "team-page-01", purpose: "Introduces the people behind the company." },
            { entry: "faq-page-01", purpose: "Answers the objections that stop visitors from signing up." },
            { entry: "contact-page-01", purpose: "Gives prospects and customers a way to reach the team." },
        ],
    },
    {
        id: "saas-launch",
        title: "SaaS launch",
        description: "The funnel from a launch landing page through sign-up and verification to the first dashboard.",
        tags: ["saas", "launch", "landing page", "funnel", "conversion", "sign up", "trial", "pricing"],
        steps: [
            { entry: "landing-page-02", purpose: "The launch landing page that pitches the product and collects clicks." },
            { entry: "pricing-page-02", purpose: "Plans and pricing for visitors who are ready to commit." },
            { entry: "signup-split-image", purpose: "A split-screen sign-up with brand imagery beside the form." },
            { entry: "step-1-check-email", purpose: "Prompts the new user to check their inbox for a confirmation." },
            { entry: "step-3-success", purpose: "Confirms verification and sends the user into the product." },
            { entry: "dashboard-01", purpose: "The first dashboard the new customer sees after verifying." },
        ],
    },
    {
        id: "content-site",
        title: "Content site",
        description: "A blog index, an article page and a newsletter sign-up for a publishing site.",
        tags: ["blog", "content", "article", "newsletter", "publishing", "subscribe", "post", "editorial"],
        steps: [
            { entry: "blog-page-01", purpose: "The blog index listing recent and featured posts." },
            { entry: "blog-post-01", purpose: "A single article layout with author, date and readable body text." },
            { entry: "newsletter-card-horizontal", purpose: "A newsletter sign-up block to capture readers after an article." },
            { entry: "about-page-02", purpose: "An about page that tells readers who writes the publication." },
        ],
    },
    {
        id: "legal-informational",
        title: "Legal and informational pages",
        description: "Terms, privacy, help and support pages that every product site needs.",
        tags: ["legal", "terms", "privacy", "policy", "faq", "help", "support", "compliance"],
        steps: [
            { entry: "legal-page-01", purpose: "A long-form legal page layout, suited to terms of service." },
            { entry: "legal-page-02", purpose: "A second legal page layout, suited to a privacy policy." },
            { entry: "faq-page-02", purpose: "Questions and answers for self-serve help." },
            { entry: "contact-page-03", purpose: "A support contact page for when the FAQ does not answer the question." },
        ],
    },
    {
        id: "app-screens",
        title: "Core app screens",
        description: "Common working screens inside an app: messages, calendar, files, orders and customer tables.",
        tags: ["inbox", "messages", "chat", "calendar", "files", "orders", "data table", "app shell"],
        steps: [
            { entry: "informational-11", purpose: "A messaging view with threads, attachments and message actions." },
            { entry: "informational-08", purpose: "A calendar view with event filters and a sidebar." },
            { entry: "informational-03", purpose: "A file manager with shared and attached files." },
            { entry: "informational-05", purpose: "An order detail page with billing history and subscription orders." },
            { entry: "informational-06", purpose: "A customer table with status filters and totals." },
        ],
    },
];
