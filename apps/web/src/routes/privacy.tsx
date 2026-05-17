import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: "Privacy Policy — Qalbwise" }],
  }),
});

function PrivacyPage() {
  return (
    <article className="prose dark:prose-invert mx-auto max-w-2xl">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: May 18, 2026</p>

      <h2>Information We Collect</h2>
      <p>
        Qalbwise ("we", "our", "the app") only stores data that you explicitly
        provide through your connected Quran Foundation account:
      </p>
      <ul>
        <li>
          <strong>Quran Foundation ID</strong> — a unique identifier provided by
          Quran Foundation when you sign in via their OAuth2 service. This lets
          us associate your bookmarks, notes, and preferences with your account.
        </li>
        <li>
          <strong>Bookmarks and notes</strong> — verses and passages you choose
          to save or annotate while using the app.
        </li>
        <li>
          <strong>Search history</strong> — queries you make so we can improve
          your experience and show you relevant results.
        </li>
        <li>
          <strong>Preferences</strong> — display settings such as font choice,
          serif toggle, and theme selection.
        </li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>
        Your data is used solely to provide and improve the Qalbwise experience:
      </p>
      <ul>
        <li>
          Bookmarks and notes are synced so you can access them across sessions.
        </li>
        <li>
          Preferences are saved to maintain your chosen reading experience.
        </li>
        <li>
          We never sell, rent, or share your personal data with third parties.
        </li>
      </ul>

      <h2>Quran Foundation & Third-Party Services</h2>
      <p>
        Qalbwise uses <strong>Quran Foundation User APIs</strong> for
        authentication. When you sign in, Quran Foundation shares only the
        information needed to identify your account (a unique ID, and optionally
        your email and name if you have granted those scopes). We do not receive
        or store your Quran Foundation password.
      </p>
      <p>
        We may also use third-party services for hosting, analytics, and
        infrastructure. These providers are bound by data-processing agreements
        and are not permitted to use your data for their own purposes.
      </p>

      <h2>Data Storage & Security</h2>
      <p>
        Your data is stored securely in a PostgreSQL database. We follow
        industry-standard practices to protect your information, including
        encryption in transit (TLS) and at rest. Access tokens and refresh
        tokens are handled server-side and are never exposed to client-side
        JavaScript except as needed for the authenticated session.
      </p>

      <h2>Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Export your bookmarks and notes at any time.</li>
        <li>Withdraw consent by signing out or disconnecting your account.</li>
      </ul>
      <p>
        To exercise any of these rights, please open an issue on our{" "}
        <a
          href="https://github.com/qalbwise/app"
          target="_blank"
          rel="noreferrer"
        >
          GitHub repository
        </a>{" "}
        or contact us through the repository discussion board.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        posted on this page with an updated revision date. Continued use of
        Qalbwise after changes constitutes acceptance of the updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        If you have questions about this Privacy Policy, please open a
        discussion or issue on our{" "}
        <a
          href="https://github.com/qalbwise/app"
          target="_blank"
          rel="noreferrer"
        >
          GitHub repository
        </a>
        .
      </p>
    </article>
  );
}
