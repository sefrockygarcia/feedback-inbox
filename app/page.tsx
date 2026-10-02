import { FeedbackForm } from "./feedback-form";

// Server Component: renders on the server, like an ERB view. The interactive
// form is a separate Client Component (see feedback-form.tsx).
export default function HomePage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <section className="lg:pt-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Residents &amp; families
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Tell us how we&apos;re doing
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted">
          Your feedback goes straight to the care team. Low ratings alert a manager right away, and
          you can leave your name and email if you&apos;d like a reply.
        </p>
      </section>
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <FeedbackForm />
      </section>
    </div>
  );
}
