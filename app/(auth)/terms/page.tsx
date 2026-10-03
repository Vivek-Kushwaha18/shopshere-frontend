"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-lg">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-white">
              Terms of Service
            </h1>

            <p className="mt-1 text-xs text-zinc-500">
              Last updated: October 2026
            </p>
          </div>

          <div className="space-y-4 text-xs leading-5 text-zinc-400">
            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                1. Acceptance of Terms
              </h2>

              <p>
                By using ShopSphere, you agree to these Terms of Service. If
                you do not agree with these terms, please do not use the
                platform.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                2. Accounts
              </h2>

              <p>
                You must provide accurate information when creating an
                account. You are responsible for keeping your account
                credentials secure and for activity performed through your
                account.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                3. Customers
              </h2>

              <p>
                Customers can browse products, place orders, manage their
                account, and use available ShopSphere features.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                4. Sellers
              </h2>

              <p>
                Sellers are responsible for their products, descriptions,
                prices, stock information, and other details they publish.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                5. Orders
              </h2>

              <p>
                When an order is placed, the information provided by the
                customer is used to process and fulfill the order.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                6. Payments and Refunds
              </h2>

              <p>
                Payment, cancellation, return, and refund rules may depend on
                the applicable ShopSphere features and seller policies.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                7. Prohibited Use
              </h2>

              <p>
                You must not use ShopSphere for fraud, unauthorized access,
                harmful activities, misleading listings, or activities that
                violate applicable laws.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                8. AI Shopping Assistant
              </h2>

              <p>
                ShopSphere may provide AI-powered shopping assistance. AI
                responses are provided for general shopping assistance.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                9. Account Suspension
              </h2>

              <p>
                ShopSphere may restrict or suspend an account if it is used in
                violation of these terms or applicable laws.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                10. Changes to These Terms
              </h2>

              <p>
                We may update these terms when necessary. Updated terms will
                be posted on this page with a revised date.
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                11. Contact
              </h2>

              <p>
                If you have questions about these Terms of Service, please
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