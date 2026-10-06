import { HeroVideo } from "~/components/landing/hero-video";

/** Landing section "session" (id `session`): the recorded Claude Code run, moved out of the hero. */
export function Session() {
    return (
        <section className="section session" id="session" aria-labelledby="session-title">
            <div className="container">
                <div className="section-heading">
                    <span className="eyebrow">A real session</span>
                    <h2 id="session-title">One prompt in Claude Code. One production billing page.</h2>
                </div>
                <div className="session-frame">
                    <HeroVideo />
                </div>
            </div>
        </section>
    );
}
