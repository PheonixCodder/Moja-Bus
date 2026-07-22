import type { Metadata } from "next";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Moja Ride",
  description:
    "Learn how Moja Ride collects, uses, and protects your personal data in accordance with the ARTCI (Law 2013-450) and GDPR (EU Regulation 2016/679).",
};

const sections = [
  { id: "general", title: "1. General Information" },
  { id: "definitions", title: "1.1 Definitions" },
  { id: "controller", title: "1.2 Controller Identity" },
  { id: "dpo", title: "1.3 Data Protection Officer" },
  { id: "legal-basis", title: "1.4 Legal Basis" },
  { id: "recipients", title: "1.5 Categories of Recipients" },
  { id: "third-country", title: "1.6 International Transfers" },
  { id: "retention", title: "1.7 Retention & Erasure" },
  { id: "automated", title: "1.8 Automated Decision-Making" },
  { id: "obligation", title: "1.9 & 1.10 Data Obligations" },
  { id: "security", title: "1.11 Data Security" },
  { id: "rights", title: "1.12 Your Rights" },
  { id: "special", title: "2. Special Information" },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell
      title="Privacy Policy"
      description="Last updated: July 2026 — This policy explains how Moja Ride collects, uses, and protects your personal data in compliance with ARTCI Law 2013-450 and the GDPR (EU Regulation 2016/679)."
      badge="Legal"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-16 relative">

          {/* Sticky sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Table of Contents
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-slate-500 hover:text-[#ee237c] py-1.5 px-3 rounded-lg hover:bg-pink-50 transition-all leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-1">Data Protection</p>
                <a
                  href="mailto:data.protection@mojaride.com"
                  className="text-xs text-[#ee237c] font-semibold hover:underline"
                >
                  data.protection@mojaride.com
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-14 text-slate-600 leading-relaxed text-sm min-w-0">

            {/* Preamble */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <p className="font-semibold text-slate-800 mb-2">Preliminary Note</p>
              <p>
                We, Moja Ride, including our subsidiaries (collectively: &ldquo;MojaBus&rdquo;, &ldquo;we&rdquo; or &ldquo;us&rdquo;), wish to inform you about data protection at MojaBus. The applicable data protection regulations — in particular ARTCI Law 2013-450 and EU Regulation 2016/679 (the &ldquo;GDPR&rdquo;) — require us to inform you transparently about the type, scope, purpose, duration, and legal basis of our data processing (cf. Art. 13 and 14 GDPR).
              </p>
              <p className="mt-3">
                This Privacy Policy has a modular structure: a general part covering all personal data processing that applies whenever our website is accessed (Section 1), and a special part specific to particular processing situations (Section 2).
              </p>
            </div>

            {/* Section 1 */}
            <section id="general" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">1</span>
                General Information
              </h2>
            </section>

            <section id="definitions" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.1 Definitions</h3>
              <p className="mb-3">This Privacy Policy is based on the definitions set out in Article 4 of the GDPR:</p>
              <ul className="space-y-3 list-none pl-0">
                {[
                  { term: "Personal data", def: "Any information relating to an identified or identifiable natural person (&ldquo;data subject&rdquo;). A person is identifiable if they can be identified directly or indirectly — in particular by reference to an identifier such as a name, identification number, location data, or online identifier, or through information relating to their physical, physiological, genetic, mental, economic, cultural, or social characteristics (Art. 4(1) GDPR)." },
                  { term: "Processing", def: "Any operation performed on personal data, whether by automated means or not. This includes in particular: collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure by transmission, dissemination, alignment, combination, restriction, erasure, or destruction (Art. 4(2) GDPR)." },
                  { term: "Controller", def: "The natural or legal person, public authority, or other body that, alone or jointly with others, determines the purposes and means of personal data processing (Art. 4(7) GDPR)." },
                  { term: "Processor", def: "A natural or legal person, public authority, or other body that processes personal data on behalf of the controller, in particular in accordance with its instructions (Art. 4(8) GDPR)." },
                  { term: "Third party", def: "Any natural or legal person, public authority, or other body other than the data subject, controller, processor, and persons who, under the direct authority of the controller or processor, are authorized to process personal data (Art. 4(10) GDPR)." },
                  { term: "Consent", def: "Any freely given, specific, informed, and unambiguous indication of the data subject's wishes by which they signify agreement to the processing of personal data relating to them by a statement or by a clear affirmative action (Art. 4(11) GDPR)." },
                ].map(({ term, def }) => (
                  <li key={term} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-1">{term}</p>
                    <p dangerouslySetInnerHTML={{ __html: def }} />
                  </li>
                ))}
              </ul>
            </section>

            <section id="controller" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.2 Controller Identity</h3>
              <p className="mb-3">The controller responsible for the processing of your personal data (Art. 4(7) GDPR) is:</p>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="font-semibold text-slate-800">Moja Ride SARL</p>
                <p className="text-slate-500 mt-1">Abidjan, Cocody, Cité Sir — Côte d&apos;Ivoire</p>
                <a href="mailto:contact@mojaride.com" className="mt-2 inline-block text-[#ee237c] font-semibold hover:underline">contact@mojaride.com</a>
              </div>
            </section>

            <section id="dpo" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.3 Data Protection Officer</h3>
              <p>Our Data Protection Officer is available at all times to answer your questions. Contact details:</p>
              <div className="mt-3 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <a href="mailto:data.protection@mojaride.com" className="text-[#ee237c] font-semibold hover:underline">data.protection@mojaride.com</a>
                <p className="text-slate-500 mt-1 text-xs">For general Moja Ride enquiries: <a href="mailto:contact@mojaride.com" className="text-[#ee237c] hover:underline">contact@mojaride.com</a></p>
              </div>
            </section>

            <section id="legal-basis" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.4 Legal Basis for Data Processing</h3>
              <p className="mb-3">Processing of personal data is permitted where at least one of the following legal bases applies:</p>
              <ul className="space-y-2">
                {[
                  { art: "Art. 6(1)(a) GDPR", desc: "The data subject has given consent to the processing for one or more specific purposes." },
                  { art: "Art. 6(1)(b) GDPR", desc: "Processing is necessary for the performance of a contract to which the data subject is party, or in order to take steps at their request prior to entering into a contract." },
                  { art: "Art. 6(1)(c) GDPR", desc: "Processing is necessary for compliance with a legal obligation to which the controller is subject (e.g., statutory retention obligations)." },
                  { art: "Art. 6(1)(d) GDPR", desc: "Processing is necessary in order to protect the vital interests of the data subject or of another natural person." },
                  { art: "Art. 6(1)(e) GDPR", desc: "Processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller." },
                  { art: "Art. 6(1)(f) GDPR", desc: "Processing is necessary for the purposes of the legitimate interests pursued by the controller or a third party, except where such interests are overridden by the interests or rights of the data subject." },
                ].map(({ art, desc }) => (
                  <li key={art} className="flex gap-3">
                    <span className="flex-shrink-0 mt-0.5 font-semibold text-slate-700 w-36">{art}</span>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="recipients" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.5 Categories of Recipients</h3>
              <p className="mb-3">
                Under certain conditions, we transfer your personal data to our subsidiaries, or receive personal data from them, to the extent permitted by law. We also engage national and international service providers and work with partner companies. These include:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Carriers</li>
                <li>IT service providers</li>
                <li>Financial institutions and payment service providers</li>
                <li>Business partners</li>
                <li>Customer service providers (internal/external)</li>
                <li>Agency operators</li>
                <li>Security companies</li>
                <li>Travel insurers</li>
                <li>Other partners engaged for business operations (e.g., auditors, banks, insurance companies, lawyers, supervisory authorities, parties involved in company acquisitions)</li>
              </ul>
              <p className="mt-3">
                Service providers and partner companies must ensure that appropriate technical and organizational measures are in place so that processing meets legal requirements and data subject rights are protected. We transfer personal data to public bodies (e.g., police, prosecutor&apos;s office, supervisory authorities) where a corresponding legal obligation or authorization exists.
              </p>
            </section>

            <section id="third-country" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.6 International Data Transfers</h3>
              <p className="mb-3">
                In the context of our business relationships, your personal data may be shared with or disclosed to third parties located outside Côte d&apos;Ivoire (&ldquo;third countries&rdquo;). Where necessary, we will inform you of details of such transfers in Section 2.
              </p>
              <p>
                Where the level of data protection in a third country may not be adequate, we ensure that adequate protection is guaranteed — for example through binding corporate rules, standard contractual clauses issued by the European Commission, certifications, or recognized codes of conduct.
              </p>
              <p className="mt-3">
                To the extent required for your booking and the associated provision and processing of transport services, the transmission of necessary personal data to third countries is permitted pursuant to Art. 49(1)(b) GDPR. Please contact our Data Protection Officer for more detailed information.
              </p>
            </section>

            <section id="retention" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.7 Retention Period & Erasure</h3>
              <p className="mb-3">
                The retention period for collected personal data depends on the purpose for which we process the data. Data will be retained for as long as necessary to achieve the intended purpose. Where no explicit retention period is specified below, your personal data will be erased or blocked as soon as the purpose or legal basis for retention no longer applies.
              </p>
              <p>
                Retention may be extended beyond the specified period in the event of a (pending) legal dispute, if other legal proceedings are initiated, or if retention is required by statutory provisions. When the prescribed retention period expires, personal data will be blocked or erased, unless we require further retention and a legal basis exists for it.
              </p>
            </section>

            <section id="automated" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.8 Automated Decision-Making (including Profiling)</h3>
              <p>
                We do not intend to use the personal data collected from you for processes involving automated decision-making (including profiling). If we wish to implement such procedures, we will inform you separately in accordance with the applicable legal provisions.
              </p>
            </section>

            <section id="obligation" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.9 No Obligation to Provide Personal Data</h3>
              <p className="mb-3">
                Entering into a contract with us is not conditional on the prior provision of your personal data. There is also generally no legal or contractual obligation to provide us with your personal data; however, we may only be able to offer certain services to a limited extent, or not at all, if you do not provide the required data.
              </p>
              <h3 className="text-base font-bold text-slate-800 mb-3 mt-6">1.10 Statutory Obligation to Transmit Data</h3>
              <p>
                In certain cases, we may be subject to a specific regulatory or legal obligation to transmit personal data to third parties, in particular public bodies.
              </p>
            </section>

            <section id="security" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-3">1.11 Data Security</h3>
              <p>
                We use appropriate technical and organizational measures to collect your data — taking into account the state of the art, implementation costs, and the nature, scope, context, and purpose of the processing, as well as the existing risks of a data breach — in order to protect data subjects against accidental or intentional manipulation, partial or complete loss or destruction, or unauthorized third-party access. For example, we use TLS encryption for our websites. Our security measures are continuously strengthened to keep pace with technological advances.
              </p>
            </section>

            <section id="rights" className="scroll-mt-8">
              <h3 className="text-base font-bold text-slate-800 mb-4">1.12 Your Rights</h3>
              <p className="mb-4">
                You may exercise your rights as a data subject at any time regarding your personal data, in particular by contacting us using the details in Section 1.2. Under the GDPR, data subjects have the following rights:
              </p>
              <div className="space-y-3">
                {[
                  { right: "Right of access (Art. 15 GDPR)", desc: "You may request information about the personal data we process about you. Please specify your request clearly to help us compile the necessary data. On request, we will provide you with a copy of the data being processed. Note that your right to information may be limited in certain circumstances under regulatory provisions." },
                  { right: "Right to rectification (Art. 16 GDPR)", desc: "If information about you is inaccurate or incomplete, you may request that it be corrected or completed." },
                  { right: "Right to erasure (Art. 17 GDPR)", desc: "You may request the erasure of your personal data. Your right to erasure depends, among other things, on whether the data is still needed for our legal obligations." },
                  { right: "Right to restriction of processing (Art. 18 GDPR)", desc: "You have the right to request restriction of the processing of data concerning you." },
                  { right: "Right to data portability (Art. 20 GDPR)", desc: "You have the right to receive the data you have provided to us in a structured, commonly used, machine-readable format, or to request its transmission to another controller." },
                  { right: "Right to object (Art. 21 GDPR)", desc: "You have the right to object at any time to the processing of your data for reasons relating to your particular situation. You may also object to receiving advertising at any time with future effect (Art. 21(2) GDPR)." },
                  { right: "Right to lodge a complaint", desc: "If you believe we have failed to comply with data protection regulations when processing your data, you may lodge a complaint with the competent supervisory authority: ARTCI — Abidjan, Marcory Anoumabo — 18 BP 2203 Abidjan 18, Côte d'Ivoire." },
                  { right: "Right to withdraw consent", desc: "You may withdraw your consent to data processing at any time with future effect. This also applies to consent declarations issued before 25 May 2018." },
                ].map(({ right, desc }) => (
                  <div key={right} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-1">{right}</p>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2 */}
            <section id="special" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">2</span>
                Special Information
              </h2>

              <div className="space-y-8">

                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3">2.1 Visiting Our Website</h3>
                  <p>
                    Information about Moja Ride and our services is available at <strong className="text-slate-700">mojaride.com</strong> (hereinafter &ldquo;Website&rdquo;). When you visit our website, your personal data is processed.
                  </p>

                  <h4 className="font-semibold text-slate-700 mt-5 mb-2">2.1.1 Provision of the Website</h4>
                  <p className="mb-2">When using the website for information purposes, we collect and store the following categories of data in server log files:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Referral URL (the page from which the request originated)</li>
                    <li>Name and URL of the requested page</li>
                    <li>Date and time of the access request (server time zone)</li>
                    <li>Browser version used</li>
                    <li>IP address of the requesting device</li>
                    <li>Amount of data transferred</li>
                    <li>Operating system</li>
                    <li>HTTP status code (success/failure)</li>
                    <li>Time zone offset from GMT</li>
                  </ul>
                  <p className="mt-3">
                    We engage IT service providers to host our website and for statistical analysis of log data. Processing serves statistical purposes and improves website quality (in particular connection stability and security). Legal basis: Art. 6(1)(f) GDPR — our legitimate interest in making the website properly available to you.
                  </p>

                  <h4 className="font-semibold text-slate-700 mt-5 mb-2">2.1.2 Contact Forms</h4>
                  <p>
                    Data submitted via contact forms (e.g., title, name, address, company, email, time of submission, subject) is processed to respond to enquiries. The legal basis is Art. 6(1)(b) GDPR where the enquiry relates to a contract, or Art. 6(1)(f) GDPR (legitimate interest in handling contact enquiries) in other cases. We retain contact form data and the associated IP address to meet our evidential obligations, ensure legal compliance, and prevent misuse.
                  </p>

                  <h4 className="font-semibold text-slate-700 mt-5 mb-2">2.1.3 Booking, Provision, and Processing of Transport Services</h4>
                  <p className="mb-2">When booking transport tickets, we collect and process the following personal data categories:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Email address</li>
                    <li>First and last name</li>
                    <li>Login credentials</li>
                    <li>Payment data</li>
                    <li>Date of birth (for services with special child fares)</li>
                    <li>Acceptance of applicable general conditions</li>
                    <li>Advance seat reservation information</li>
                    <li>Luggage details</li>
                    <li>Booking domain language</li>
                    <li>Booking channel (Web or app)</li>
                  </ul>
                  <p className="mb-3">You may optionally provide a contact phone number in case of delays or itinerary changes.</p>
                  <p className="mb-3">These data are processed for booking, provision, and processing of transport services — including customer service — and for compliance with legal obligations. Legal basis: Art. 6(1)(b) and (c) GDPR.</p>
                  <p className="mb-3">For international transport bookings, the following additional data may be collected depending on the departure and arrival location:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Gender information</li>
                    <li>Identity card, passport, or identification number</li>
                  </ul>
                  <p className="mb-3">We transmit the above data to the relevant carrier(s), and to public bodies where a corresponding legal obligation or authorization exists. Legal basis: Art. 6(1)(b) or (c) GDPR.</p>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mt-4">
                    <p className="font-semibold text-slate-800 mb-2">Payment processors</p>
                    <p className="mb-2">Required payment data is transmitted to payment service providers for the secure processing of your payments:</p>
                    <ul className="space-y-2">
                      <li>
                        <strong className="text-slate-700">Paystack</strong><br />
                        <span className="text-slate-500 text-xs">26 Joel Ogunnaike Street, Ikeja GRA, Ikeja, Lagos, Nigeria — +234 201 631 6160</span>
                      </li>
                      <li>
                        <strong className="text-slate-700">Wave Côte d&apos;Ivoire</strong><br />
                        <span className="text-slate-500 text-xs">Cocody Riviera 4, near Mansah Bank — <a href="mailto:contact@wave.com" className="text-[#ee237c] hover:underline">contact@wave.com</a> — +225 07 48 27 77 42</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
