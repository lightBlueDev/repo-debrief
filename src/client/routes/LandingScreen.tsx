import { ShellButton } from "../components/ShellButton";

type LandingScreenProps = {
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
};

export function LandingScreen({
  onPrimaryAction,
  onSecondaryAction
}: LandingScreenProps) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="hero-kicker">LightBlue Developments</p>
        <h1>Debrief</h1>
        <p className="hero-tagline">Understand the code you built.</p>
        <p className="hero-body">
          A calm, premium shell for the codebase understanding workflow we are
          building. Milestone 0 establishes the foundation. Milestone 1 will
          make this Settings-first flow fully session-backed.
        </p>
      </div>

      <div className="hero-actions">
        <ShellButton onClick={onPrimaryAction}>Start With Settings</ShellButton>
        <ShellButton onClick={onSecondaryAction} variant="ghost">
          Preview Repo Input
        </ShellButton>
      </div>
    </section>
  );
}
