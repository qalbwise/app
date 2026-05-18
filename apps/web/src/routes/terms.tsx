import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [{ title: "Terms of Service — Qalbwise" }],
  }),
});

function TermsPage() {
  return (
    <article className="prose dark:prose-invert mx-auto max-w-2xl">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: May 18, 2026</p>

      <h2>Acceptance of Terms</h2>
      <p>
        By accessing or using Qalbwise ("the app"), you agree to be bound by
        these Terms of Service. If you do not agree, please do not use the app.
      </p>

      <h2>Description of Service</h2>
      <p>
        Qalbwise is a Quranic search and reflection tool that allows you to
        search verses, bookmark passages, take notes, and personalize your
        reading experience. The app connects to the{" "}
        <a href="https://quran.foundation" target="_blank" rel="noreferrer">
          Quran Foundation
        </a>{" "}
        User APIs for authentication and data sync.
      </p>

      <h2>User Accounts</h2>
      <p>
        To use certain features (bookmarks, notes, preferences), you must sign
        in through a Quran Foundation account. You are responsible for
        maintaining the confidentiality of your account credentials. Quran
        Foundation handles authentication; Qalbwise never receives or stores
        your password.
      </p>

      <h2>Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the app for any unlawful purpose or in violation of any applicable
          laws.
        </li>
        <li>
          Attempt to access, probe, or scan the app's infrastructure beyond the
          intended public interface.
        </li>
        <li>
          Interfere with or disrupt the app's servers, networks, or connected
          services.
        </li>
        <li>
          Use any automated means (bots, scrapers, crawlers) to access or
          collect data from the app without explicit permission.
        </li>
      </ul>

      <h2>Intellectual Property</h2>
      <p>
        The Qalbwise app code is open-source and available on{" "}
        <a
          href="https://github.com/qalbwise/app"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        . The Quranic text and related content accessed through the Quran
        Foundation APIs are the property of their respective owners and are used
        in accordance with Quran Foundation's terms.
      </p>

      <h2>Disclaimer of Warranties</h2>
      <p>
        The app is provided "as is" and "as available" without warranties of any
        kind, either express or implied. We do not guarantee that the app will
        be uninterrupted, secure, or error-free.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        Qalbwise and its contributors shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising from
        your use of the app.
      </p>

      <h2>Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time. Changes will be
        posted on this page with an updated revision date. Your continued use of
        the app after changes constitutes acceptance of the new terms.
      </p>

      <h2>Governing Law</h2>
      <p>
        These terms shall be governed by and construed in accordance with the
        laws of the United Arab Emirates, without regard to its conflict of law
        provisions.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, please open a discussion or issue on
        our{" "}
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
