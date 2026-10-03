"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-lg">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-white">
              Privacy Policy
            </h1>

            <p className="mt-1 text-xs text-zinc-500">
              Last updated: October 2026
            </p>
          </div>

          <div className="space-y-4 text-xs leading-5 text-zinc-400">
            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                1. Information We Collect
              </h2>

              <p>
                ShopSphere may collect information such as your name, email
                address, phone number, account details, order information,
                shipping address, and product-related activity.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                2. How We Use Your Information
              </h2>

              <p>
                We use your information to manage accounts, process orders,
                provide customer support, improve the platform, and provide
                ShopSphere features.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                3. Seller Information
              </h2>

              <p>
                Sellers may provide product, pricing, stock, and business
                information. Some information may be displayed to customers
                when required for marketplace functionality.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                4. Orders and Transactions
              </h2>

              <p>
                We use order and shipping information to process purchases,
                deliveries, order history, and related customer support.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                5. AI Shopping Assistant
              </h2>

              <p>
                Information provided during interactions with the AI Shopping
                Assistant may be processed to provide shopping-related
                responses and improve the user experience.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                6. Cookies and Local Storage
              </h2>

              <p>
                ShopSphere may use cookies, browser storage, or similar
                technologies to maintain login sessions, remember preferences,
                and support application functionality.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                7. Sharing Information
              </h2>

              <p>
                Information may be shared with service providers when
                necessary to operate hosting, email, authentication, payments,
                or order fulfillment.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                8. Data Security
              </h2>

              <p>
                We take reasonable measures to protect account and application
                information. However, no online system can guarantee complete
                security.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                9. Data Retention
              </h2>

              <p>
                Information may be retained as necessary to provide services,
                maintain records, resolve disputes, comply with requirements,
                or protect the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                10. Your Privacy Choices
              </h2>

              <p>
                Depending on applicable law, you may have rights regarding
                access, correction, deletion, or other handling of your
                personal information.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                11. Changes to This Policy
              </h2>

              <p>
                We may update this Privacy Policy when necessary. Changes will
                be posted on this page with a revised date.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                12. Contact
              </h2>

              <p>
                If you have questions about this Privacy Policy, please
                contact the ShopSphere support team.
              </p>
            </section>
          </div>

          <div className="mt-5 border-t border-zinc-800 pt-4">
            <Link
              href="/signup"
              className="text-xs font-medium text-blue-400 underline underline-offset-4 hover:text-blue-300"
            >
              Back to Signup
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}