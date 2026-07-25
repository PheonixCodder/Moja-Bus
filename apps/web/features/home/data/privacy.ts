interface PrivacyItem {
  id: string;
  title: string;
  sections: Array<{
    heading: string;
    body: string[];
    list?: string[];
  }>;
  legalList?: Array<{ term: string; def: string }>;
  rightsList?: Array<{ right: string; desc: string }>;
  addressBox?: {
    name: string;
    address: string;
    email: string;
  };
  processorBox?: {
    title: string;
    body: string;
    processors: Array<{ name: string; address: string }>;
  };
}

interface PrivacyData {
  toc: Array<{ id: string; title: string }>;
  preamble: {
    heading: string;
    paragraphs: string[];
  };
  items: PrivacyItem[];
}

const en: PrivacyData = {
  toc: [
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
  ],
  preamble: {
    heading: "Preliminary Note",
    paragraphs: [
      "We, Moja Ride, including our subsidiaries (collectively: \u201cMojaBus\u201d, \u201cwe\u201d or \u201cus\u201d), wish to inform you about data protection at MojaBus. The applicable data protection regulations \u2014 in particular ARTCI Law 2013-450 and EU Regulation 2016/679 (the \u201cGDPR\u201d) \u2014 require us to inform you transparently about the type, scope, purpose, duration, and legal basis of our data processing (cf. Art. 13 and 14 GDPR).",
      "This Privacy Policy has a modular structure: a general part covering all personal data processing that applies whenever our website is accessed (Section 1), and a special part specific to particular processing situations (Section 2).",
    ],
  },
  items: [
    {
      id: "definitions",
      title: "1.1 Definitions",
      sections: [
        {
          heading: "1.1 Definitions",
          body: ["This Privacy Policy is based on the definitions set out in Article 4 of the GDPR:"],
        },
      ],
      legalList: [
        { term: "Personal data", def: "Any information relating to an identified or identifiable natural person (\u201cdata subject\u201d). A person is identifiable if they can be identified directly or indirectly \u2014 in particular by reference to an identifier such as a name, identification number, location data, or online identifier, or through information relating to their physical, physiological, genetic, mental, economic, cultural, or social characteristics (Art. 4(1) GDPR)." },
        { term: "Processing", def: "Any operation performed on personal data, whether by automated means or not. This includes in particular: collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure by transmission, dissemination, alignment, combination, restriction, erasure, or destruction (Art. 4(2) GDPR)." },
        { term: "Controller", def: "The natural or legal person, public authority, or other body that, alone or jointly with others, determines the purposes and means of personal data processing (Art. 4(7) GDPR)." },
        { term: "Processor", def: "A natural or legal person, public authority, or other body that processes personal data on behalf of the controller, in particular in accordance with its instructions (Art. 4(8) GDPR)." },
        { term: "Third party", def: "Any natural or legal person, public authority, or other body other than the data subject, controller, processor, and persons who, under the direct authority of the controller or processor, are authorized to process personal data (Art. 4(10) GDPR)." },
        { term: "Consent", def: "Any freely given, specific, informed, and unambiguous indication of the data subject\u2019s wishes by which they signify agreement to the processing of personal data relating to them by a statement or by a clear affirmative action (Art. 4(11) GDPR)." },
      ],
    },
    {
      id: "controller",
      title: "1.2 Controller Identity",
      sections: [
        {
          heading: "1.2 Controller Identity",
          body: ["The controller responsible for the processing of your personal data (Art. 4(7) GDPR) is:"],
        },
      ],
      addressBox: {
        name: "Moja Ride SARL",
        address: "Abidjan, Cocody, Cit\u00e9 Sir \u2014 C\u00f4te d\u2019Ivoire",
        email: "contact@mojaride.com",
      },
    },
    {
      id: "dpo",
      title: "1.3 Data Protection Officer",
      sections: [
        {
          heading: "1.3 Data Protection Officer",
          body: ["Our Data Protection Officer is available at all times to answer your questions. Contact details:"],
        },
      ],
      addressBox: {
        name: "",
        address: "",
        email: "data.protection@mojaride.com",
      },
    },
    {
      id: "legal-basis",
      title: "1.4 Legal Basis",
      sections: [
        {
          heading: "1.4 Legal Basis for Data Processing",
          body: ["Processing of personal data is permitted where at least one of the following legal bases applies:"],
        },
      ],
      legalList: [
        { term: "Art. 6(1)(a) GDPR", def: "The data subject has given consent to the processing for one or more specific purposes." },
        { term: "Art. 6(1)(b) GDPR", def: "Processing is necessary for the performance of a contract to which the data subject is party, or in order to take steps at their request prior to entering into a contract." },
        { term: "Art. 6(1)(c) GDPR", def: "Processing is necessary for compliance with a legal obligation to which the controller is subject (e.g., statutory retention obligations)." },
        { term: "Art. 6(1)(d) GDPR", def: "Processing is necessary in order to protect the vital interests of the data subject or of another natural person." },
        { term: "Art. 6(1)(e) GDPR", def: "Processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller." },
        { term: "Art. 6(1)(f) GDPR", def: "Processing is necessary for the purposes of the legitimate interests pursued by the controller or a third party, except where such interests are overridden by the interests or rights of the data subject." },
      ],
    },
    {
      id: "recipients",
      title: "1.5 Categories of Recipients",
      sections: [
        {
          heading: "1.5 Categories of Recipients",
          body: [
            "Under certain conditions, we transfer your personal data to our subsidiaries, or receive personal data from them, to the extent permitted by law. We also engage national and international service providers and work with partner companies. These include:",
          ],
          list: [
            "Carriers",
            "IT service providers",
            "Financial institutions and payment service providers",
            "Business partners",
            "Customer service providers (internal/external)",
            "Agency operators",
            "Security companies",
            "Travel insurers",
            "Other partners engaged for business operations (e.g., auditors, banks, insurance companies, lawyers, supervisory authorities, parties involved in company acquisitions)",
          ],
        },
        {
          heading: "",
          body: [
            "Service providers and partner companies must ensure that appropriate technical and organizational measures are in place so that processing meets legal requirements and data subject rights are protected. We transfer personal data to public bodies (e.g., police, prosecutor\u2019s office, supervisory authorities) where a corresponding legal obligation or authorization exists.",
          ],
        },
      ],
    },
    {
      id: "third-country",
      title: "1.6 International Data Transfers",
      sections: [
        {
          heading: "1.6 International Data Transfers",
          body: [
            "In the context of our business relationships, your personal data may be shared with or disclosed to third parties located outside C\u00f4te d\u2019Ivoire (\u201cthird countries\u201d). Where necessary, we will inform you of details of such transfers in Section 2.",
            "Where the level of data protection in a third country may not be adequate, we ensure that adequate protection is guaranteed \u2014 for example through binding corporate rules, standard contractual clauses issued by the European Commission, certifications, or recognized codes of conduct.",
            "To the extent required for your booking and the associated provision and processing of transport services, the transmission of necessary personal data to third countries is permitted pursuant to Art. 49(1)(b) GDPR. Please contact our Data Protection Officer for more detailed information.",
          ],
        },
      ],
    },
    {
      id: "retention",
      title: "1.7 Retention & Erasure",
      sections: [
        {
          heading: "1.7 Retention Period & Erasure",
          body: [
            "The retention period for collected personal data depends on the purpose for which we process the data. Data will be retained for as long as necessary to achieve the intended purpose. Where no explicit retention period is specified below, your personal data will be erased or blocked as soon as the purpose or legal basis for retention no longer applies.",
            "Retention may be extended beyond the specified period in the event of a (pending) legal dispute, if other legal proceedings are initiated, or if retention is required by statutory provisions. When the prescribed retention period expires, personal data will be blocked or erased, unless we require further retention and a legal basis exists for it.",
          ],
        },
      ],
    },
    {
      id: "automated",
      title: "1.8 Automated Decision-Making",
      sections: [
        {
          heading: "1.8 Automated Decision-Making (including Profiling)",
          body: [
            "We do not intend to use the personal data collected from you for processes involving automated decision-making (including profiling). If we wish to implement such procedures, we will inform you separately in accordance with the applicable legal provisions.",
          ],
        },
      ],
    },
    {
      id: "obligation",
      title: "1.9 & 1.10 Data Obligations",
      sections: [
        {
          heading: "1.9 No Obligation to Provide Personal Data",
          body: [
            "Entering into a contract with us is not conditional on the prior provision of your personal data. There is also generally no legal or contractual obligation to provide us with your personal data; however, we may only be able to offer certain services to a limited extent, or not at all, if you do not provide the required data.",
          ],
        },
        {
          heading: "1.10 Statutory Obligation to Transmit Data",
          body: [
            "In certain cases, we may be subject to a specific regulatory or legal obligation to transmit personal data to third parties, in particular public bodies.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "1.11 Data Security",
      sections: [
        {
          heading: "1.11 Data Security",
          body: [
            "We use appropriate technical and organizational measures to collect your data \u2014 taking into account the state of the art, implementation costs, and the nature, scope, context, and purpose of the processing, as well as the existing risks of a data breach \u2014 in order to protect data subjects against accidental or intentional manipulation, partial or complete loss or destruction, or unauthorized third-party access. For example, we use TLS encryption for our websites. Our security measures are continuously strengthened to keep pace with technological advances.",
          ],
        },
      ],
    },
    {
      id: "rights",
      title: "1.12 Your Rights",
      sections: [
        {
          heading: "1.12 Your Rights",
          body: [
            "You may exercise your rights as a data subject at any time regarding your personal data, in particular by contacting us using the details in Section 1.2. Under the GDPR, data subjects have the following rights:",
          ],
        },
      ],
      rightsList: [
        { right: "Right of access (Art. 15 GDPR)", desc: "You may request information about the personal data we process about you. Please specify your request clearly to help us compile the necessary data. On request, we will provide you with a copy of the data being processed. Note that your right to information may be limited in certain circumstances under regulatory provisions." },
        { right: "Right to rectification (Art. 16 GDPR)", desc: "If information about you is inaccurate or incomplete, you may request that it be corrected or completed." },
        { right: "Right to erasure (Art. 17 GDPR)", desc: "You may request the erasure of your personal data. Your right to erasure depends, among other things, on whether the data is still needed for our legal obligations." },
        { right: "Right to restriction of processing (Art. 18 GDPR)", desc: "You have the right to request restriction of the processing of data concerning you." },
        { right: "Right to data portability (Art. 20 GDPR)", desc: "You have the right to receive the data you have provided to us in a structured, commonly used, machine-readable format, or to request its transmission to another controller." },
        { right: "Right to object (Art. 21 GDPR)", desc: "You have the right to object at any time to the processing of your data for reasons relating to your particular situation. You may also object to receiving advertising at any time with future effect (Art. 21(2) GDPR)." },
        { right: "Right to lodge a complaint", desc: "If you believe we have failed to comply with data protection regulations when processing your data, you may lodge a complaint with the competent supervisory authority: ARTCI \u2014 Abidjan, Marcory Anoumabo \u2014 18 BP 2203 Abidjan 18, C\u00f4te d\u2019Ivoire." },
        { right: "Right to withdraw consent", desc: "You may withdraw your consent to data processing at any time with future effect. This also applies to consent declarations issued before 25 May 2018." },
      ],
    },
    {
      id: "special",
      title: "2. Special Information",
      sections: [
        {
          heading: "2.1 Visiting Our Website",
          body: [
            "Information about Moja Ride and our services is available at mojaride.com (hereinafter \u201cWebsite\u201d). When you visit our website, your personal data is processed.",
          ],
        },
        {
          heading: "2.1.1 Provision of the Website",
          body: [
            "When using the website for information purposes, we collect and store the following categories of data in server log files:",
          ],
          list: [
            "Referral URL (the page from which the request originated)",
            "Name and URL of the requested page",
            "Date and time of the access request (server time zone)",
            "Browser version used",
            "IP address of the requesting device",
            "Amount of data transferred",
            "Operating system",
            "HTTP status code (success/failure)",
            "Time zone offset from GMT",
          ],
        },
        {
          heading: "2.1.2 Contact Forms",
          body: [
            "Data submitted via contact forms (e.g., title, name, address, company, email, time of submission, subject) is processed to respond to enquiries. The legal basis is Art. 6(1)(b) GDPR where the enquiry relates to a contract, or Art. 6(1)(f) GDPR (legitimate interest in handling contact enquiries) in other cases. We retain contact form data and the associated IP address to meet our evidential obligations, ensure legal compliance, and prevent misuse.",
          ],
        },
        {
          heading: "2.1.3 Booking, Provision, and Processing of Transport Services",
          body: [
            "When booking transport tickets, we collect and process the following personal data categories:",
          ],
          list: [
            "Email address",
            "First and last name",
            "Login credentials",
            "Payment data",
            "Date of birth (for services with special child fares)",
            "Acceptance of applicable general conditions",
            "Advance seat reservation information",
            "Luggage details",
            "Booking domain language",
            "Booking channel (Web or app)",
          ],
        },
        {
          heading: "",
          body: [
            "You may optionally provide a contact phone number in case of delays or itinerary changes.",
            "These data are processed for booking, provision, and processing of transport services \u2014 including customer service \u2014 and for compliance with legal obligations. Legal basis: Art. 6(1)(b) and (c) GDPR.",
            "For international transport bookings, the following additional data may be collected depending on the departure and arrival location:",
          ],
          list: [
            "Gender information",
            "Identity card, passport, or identification number",
          ],
        },
        {
          heading: "",
          body: [
            "We transmit the above data to the relevant carrier(s), and to public bodies where a corresponding legal obligation or authorization exists. Legal basis: Art. 6(1)(b) or (c) GDPR.",
          ],
        },
      ],
      processorBox: {
        title: "Payment processors",
        body: "Required payment data is transmitted to payment service providers for the secure processing of your payments:",
        processors: [
          { name: "Paystack", address: "26 Joel Ogunnaike Street, Ikeja GRA, Ikeja, Lagos, Nigeria \u2014 +234 201 631 6160" },
          { name: "Wave C\u00f4te d\u2019Ivoire", address: "Cocody Riviera 4, near Mansah Bank \u2014 contact@wave.com \u2014 +225 07 48 27 77 42" },
        ],
      },
    },
  ],
};

const fr: PrivacyData = {
  toc: [
    { id: "general", title: "1. Informations g\u00e9n\u00e9rales" },
    { id: "definitions", title: "1.1 D\u00e9finitions" },
    { id: "controller", title: "1.2 Identit\u00e9 du responsable" },
    { id: "dpo", title: "1.3 D\u00e9l\u00e9gu\u00e9 \u00e0 la protection" },
    { id: "legal-basis", title: "1.4 Base juridique" },
    { id: "recipients", title: "1.5 Cat\u00e9gories de destinataires" },
    { id: "third-country", title: "1.6 Transferts internationaux" },
    { id: "retention", title: "1.7 Conservation et effacement" },
    { id: "automated", title: "1.8 D\u00e9cisions automatis\u00e9es" },
    { id: "obligation", title: "1.9 & 1.10 Obligations" },
    { id: "security", title: "1.11 S\u00e9curit\u00e9 des donn\u00e9es" },
    { id: "rights", title: "1.12 Vos droits" },
    { id: "special", title: "2. Informations sp\u00e9ciales" },
  ],
  preamble: {
    heading: "Note pr\u00e9liminaire",
    paragraphs: [
      "Nous, Moja Ride, y compris nos filiales (collectivement : \u00ab MojaBus \u00bb, \u00ab nous \u00bb ou \u00ab notre \u00bb), souhaitons vous informer sur la protection des donn\u00e9es chez MojaBus. Les r\u00e9glementations applicables en mati\u00e8re de protection des donn\u00e9es \u2014 notamment la loi ARTCI 2013-450 et le R\u00e8glement UE 2016/679 (le \u00ab RGPD \u00bb) \u2014 nous obligent \u00e0 vous informer de mani\u00e8re transparente sur le type, la port\u00e9e, la finalit\u00e9, la dur\u00e9e et la base juridique de notre traitement des donn\u00e9es (cf. Art. 13 et 14 RGPD).",
      "Cette politique de confidentialit\u00e9 a une structure modulaire : une partie g\u00e9n\u00e9rale couvrant tout traitement de donn\u00e9es personnelles qui s\u2019applique chaque fois que notre site web est consult\u00e9 (Section 1), et une partie sp\u00e9ciale sp\u00e9cifique \u00e0 certaines situations de traitement (Section 2).",
    ],
  },
  items: [
    {
      id: "definitions",
      title: "1.1 D\u00e9finitions",
      sections: [
        {
          heading: "1.1 D\u00e9finitions",
          body: ["La pr\u00e9sente politique de confidentialit\u00e9 est bas\u00e9e sur les d\u00e9finitions \u00e9nonc\u00e9es \u00e0 l\u2019article 4 du RGPD :"],
        },
      ],
      legalList: [
        { term: "Donn\u00e9es personnelles", def: "Toute information se rapportant \u00e0 une personne physique identifi\u00e9e ou identifiable (\u00ab personne concern\u00e9e \u00bb). Une personne est identifiable si elle peut \u00eatre identifi\u00e9e, directement ou indirectement \u2014 notamment par r\u00e9f\u00e9rence \u00e0 un identifiant tel qu\u2019un nom, un num\u00e9ro d\u2019identification, des donn\u00e9es de localisation ou un identifiant en ligne, ou par des informations relatives \u00e0 ses caract\u00e9ristiques physiques, physiologiques, g\u00e9n\u00e9tiques, psychiques, \u00e9conomiques, culturelles ou sociales (Art. 4(1) RGPD)." },
        { term: "Traitement", def: "Toute op\u00e9ration effectu\u00e9e sur des donn\u00e9es personnelles, que ce soit par des moyens automatis\u00e9s ou non. Cela inclut notamment : la collecte, l\u2019enregistrement, l\u2019organisation, la structuration, la conservation, l\u2019adaptation, la r\u00e9cup\u00e9ration, la consultation, l\u2019utilisation, la divulgation par transmission, la diffusion, le rapprochement, la combinaison, la limitation, l\u2019effacement ou la destruction (Art. 4(2) RGPD)." },
        { term: "Responsable du traitement", def: "La personne physique ou morale, l\u2019autorit\u00e9 publique ou tout autre organisme qui, seul ou conjointement avec d\u2019autres, d\u00e9termine les finalit\u00e9s et les moyens du traitement des donn\u00e9es personnelles (Art. 4(7) RGPD)." },
        { term: "Sous-traitant", def: "Une personne physique ou morale, une autorit\u00e9 publique ou tout autre organisme qui traite des donn\u00e9es personnelles pour le compte du responsable du traitement, notamment conform\u00e9ment \u00e0 ses instructions (Art. 4(8) RGPD)." },
        { term: "Tiers", def: "Toute personne physique ou morale, autorit\u00e9 publique ou tout autre organisme autre que la personne concern\u00e9e, le responsable du traitement, le sous-traitant et les personnes qui, sous l\u2019autorit\u00e9 directe du responsable du traitement ou du sous-traitant, sont autoris\u00e9es \u00e0 traiter des donn\u00e9es personnelles (Art. 4(10) RGPD)." },
        { term: "Consentement", def: "Toute manifestation de volont\u00e9 libre, sp\u00e9cifique, \u00e9clair\u00e9e et univoque par laquelle la personne concern\u00e9e accepte, par une d\u00e9claration ou par un acte positif clair, que des donn\u00e9es personnelles la concernant fassent l\u2019objet d\u2019un traitement (Art. 4(11) RGPD)." },
      ],
    },
    {
      id: "controller",
      title: "1.2 Identit\u00e9 du responsable",
      sections: [
        {
          heading: "1.2 Identit\u00e9 du responsable du traitement",
          body: ["Le responsable du traitement de vos donn\u00e9es personnelles (Art. 4(7) RGPD) est :"],
        },
      ],
      addressBox: {
        name: "Moja Ride SARL",
        address: "Abidjan, Cocody, Cit\u00e9 Sir \u2014 C\u00f4te d\u2019Ivoire",
        email: "contact@mojaride.com",
      },
    },
    {
      id: "dpo",
      title: "1.3 D\u00e9l\u00e9gu\u00e9 \u00e0 la protection",
      sections: [
        {
          heading: "1.3 D\u00e9l\u00e9gu\u00e9 \u00e0 la protection des donn\u00e9es",
          body: ["Notre d\u00e9l\u00e9gu\u00e9 \u00e0 la protection des donn\u00e9es est disponible \u00e0 tout moment pour r\u00e9pondre \u00e0 vos questions. Coordonn\u00e9es :"],
        },
      ],
      addressBox: {
        name: "",
        address: "",
        email: "data.protection@mojaride.com",
      },
    },
    {
      id: "legal-basis",
      title: "1.4 Base juridique",
      sections: [
        {
          heading: "1.4 Base juridique du traitement des donn\u00e9es",
          body: ["Le traitement des donn\u00e9es personnelles est autoris\u00e9 lorsqu\u2019au moins l\u2019une des bases juridiques suivantes s\u2019applique :"],
        },
      ],
      legalList: [
        { term: "Art. 6(1)(a) RGPD", def: "La personne concern\u00e9e a donn\u00e9 son consentement au traitement pour une ou plusieurs finalit\u00e9s sp\u00e9cifiques." },
        { term: "Art. 6(1)(b) RGPD", def: "Le traitement est n\u00e9cessaire \u00e0 l\u2019ex\u00e9cution d\u2019un contrat auquel la personne concern\u00e9e est partie, ou \u00e0 l\u2019ex\u00e9cution de mesures pr\u00e9contractuelles prises \u00e0 la demande de celle-ci." },
        { term: "Art. 6(1)(c) RGPD", def: "Le traitement est n\u00e9cessaire au respect d\u2019une obligation l\u00e9gale \u00e0 laquelle le responsable du traitement est soumis (par exemple, obligations l\u00e9gales de conservation)." },
        { term: "Art. 6(1)(d) RGPD", def: "Le traitement est n\u00e9cessaire \u00e0 la protection des int\u00e9r\u00eats vitaux de la personne concern\u00e9e ou d\u2019une autre personne physique." },
        { term: "Art. 6(1)(e) RGPD", def: "Le traitement est n\u00e9cessaire \u00e0 l\u2019ex\u00e9cution d\u2019une mission d\u2019int\u00e9r\u00eat public ou relevant de l\u2019exercice de l\u2019autorit\u00e9 publique dont est investi le responsable du traitement." },
        { term: "Art. 6(1)(f) RGPD", def: "Le traitement est n\u00e9cessaire aux fins des int\u00e9r\u00eats l\u00e9gitimes poursuivis par le responsable du traitement ou par un tiers, \u00e0 moins que ne pr\u00e9valent les int\u00e9r\u00eats ou les droits de la personne concern\u00e9e." },
      ],
    },
    {
      id: "recipients",
      title: "1.5 Cat\u00e9gories de destinataires",
      sections: [
        {
          heading: "1.5 Cat\u00e9gories de destinataires",
          body: [
            "Sous certaines conditions, nous transf\u00e9rons vos donn\u00e9es personnelles \u00e0 nos filiales, ou recevons des donn\u00e9es personnelles de leur part, dans la mesure permise par la loi. Nous faisons \u00e9galement appel \u00e0 des prestataires de services nationaux et internationaux et collaborons avec des soci\u00e9t\u00e9s partenaires. Cela inclut :",
          ],
          list: [
            "Transporteurs",
            "Prestataires de services informatiques",
            "Institutions financi\u00e8res et prestataires de services de paiement",
            "Partenaires commerciaux",
            "Prestataires de service client (internes/externes)",
            "Exploitants d\u2019agences",
            "Soci\u00e9t\u00e9s de s\u00e9curit\u00e9",
            "Assureurs voyage",
            "Autres partenaires engag\u00e9s pour les op\u00e9rations commerciales (par exemple, commissaires aux comptes, banques, compagnies d\u2019assurance, avocats, autorit\u00e9s de contr\u00f4le, parties impliqu\u00e9es dans des acquisitions d\u2019entreprises)",
          ],
        },
        {
          heading: "",
          body: [
            "Les prestataires de services et soci\u00e9t\u00e9s partenaires doivent veiller \u00e0 ce que des mesures techniques et organisationnelles appropri\u00e9es soient en place pour que le traitement r\u00e9ponde aux exigences l\u00e9gales et que les droits des personnes concern\u00e9es soient prot\u00e9g\u00e9s. Nous transf\u00e9rons des donn\u00e9es personnelles aux organismes publics (par exemple, police, parquet, autorit\u00e9s de contr\u00f4le) lorsqu\u2019une obligation l\u00e9gale ou une autorisation correspondante existe.",
          ],
        },
      ],
    },
    {
      id: "third-country",
      title: "1.6 Transferts internationaux",
      sections: [
        {
          heading: "1.6 Transferts internationaux de donn\u00e9es",
          body: [
            "Dans le cadre de nos relations commerciales, vos donn\u00e9es personnelles peuvent \u00eatre partag\u00e9es ou divulgu\u00e9es \u00e0 des tiers situ\u00e9s en dehors de la C\u00f4te d\u2019Ivoire (\u00ab pays tiers \u00bb). Si n\u00e9cessaire, nous vous informerons des d\u00e9tails de ces transferts dans la Section 2.",
            "Lorsque le niveau de protection des donn\u00e9es dans un pays tiers peut ne pas \u00eatre ad\u00e9quat, nous veillons \u00e0 ce qu\u2019une protection ad\u00e9quate soit garantie \u2014 par exemple par des r\u00e8gles d\u2019entreprise contraignantes, des clauses contractuelles types \u00e9mises par la Commission europ\u00e9enne, des certifications ou des codes de conduite reconnus.",
            "Dans la mesure n\u00e9cessaire \u00e0 votre r\u00e9servation et \u00e0 la fourniture et au traitement associ\u00e9s des services de transport, la transmission de donn\u00e9es personnelles n\u00e9cessaires \u00e0 des pays tiers est autoris\u00e9e conform\u00e9ment \u00e0 l\u2019Art. 49(1)(b) RGPD. Veuillez contacter notre d\u00e9l\u00e9gu\u00e9 \u00e0 la protection des donn\u00e9es pour des informations plus d\u00e9taill\u00e9es.",
          ],
        },
      ],
    },
    {
      id: "retention",
      title: "1.7 Conservation et effacement",
      sections: [
        {
          heading: "1.7 Dur\u00e9e de conservation et effacement",
          body: [
            "La dur\u00e9e de conservation des donn\u00e9es personnelles collect\u00e9es d\u00e9pend de la finalit\u00e9 pour laquelle nous traitons les donn\u00e9es. Les donn\u00e9es sont conserv\u00e9es aussi longtemps que n\u00e9cessaire pour atteindre la finalit\u00e9 pr\u00e9vue. Lorsqu\u2019aucune dur\u00e9e de conservation explicite n\u2019est sp\u00e9cifi\u00e9e ci-dessous, vos donn\u00e9es personnelles sont effac\u00e9es ou bloqu\u00e9es d\u00e8s que la finalit\u00e9 ou la base juridique de la conservation ne s\u2019applique plus.",
            "La conservation peut \u00eatre prolong\u00e9e au-del\u00e0 de la p\u00e9riode sp\u00e9cifi\u00e9e en cas de litige (en cours) ou de proc\u00e9dure judiciaire, ou si la conservation est requise par des dispositions l\u00e9gales. Lorsque la p\u00e9riode de conservation prescrite expire, les donn\u00e9es personnelles sont bloqu\u00e9es ou effac\u00e9es, sauf si nous avons besoin d\u2019une conservation suppl\u00e9mentaire et qu\u2019une base juridique existe.",
          ],
        },
      ],
    },
    {
      id: "automated",
      title: "1.8 D\u00e9cisions automatis\u00e9es",
      sections: [
        {
          heading: "1.8 D\u00e9cisions automatis\u00e9es (y compris le profilage)",
          body: [
            "Nous n\u2019avons pas l\u2019intention d\u2019utiliser les donn\u00e9es personnelles collect\u00e9es pour des processus impliquant une prise de d\u00e9cision automatis\u00e9e (y compris le profilage). Si nous souhaitons mettre en \u0153uvre de telles proc\u00e9dures, nous vous en informerons s\u00e9par\u00e9ment conform\u00e9ment aux dispositions l\u00e9gales applicables.",
          ],
        },
      ],
    },
    {
      id: "obligation",
      title: "1.9 & 1.10 Obligations",
      sections: [
        {
          heading: "1.9 Absence d\u2019obligation de fournir des donn\u00e9es personnelles",
          body: [
            "La conclusion d\u2019un contrat avec nous n\u2019est pas conditionn\u00e9e \u00e0 la fourniture pr\u00e9alable de vos donn\u00e9es personnelles. Il n\u2019existe g\u00e9n\u00e9ralement pas non plus d\u2019obligation l\u00e9gale ou contractuelle de nous fournir vos donn\u00e9es personnelles ; cependant, nous pouvons n\u2019\u00eatre en mesure d\u2019offrir certains services que dans une mesure limit\u00e9e, ou pas du tout, si vous ne fournissez pas les donn\u00e9es requises.",
          ],
        },
        {
          heading: "1.10 Obligation l\u00e9gale de transmettre des donn\u00e9es",
          body: [
            "Dans certains cas, nous pouvons \u00eatre soumis \u00e0 une obligation r\u00e9glementaire ou l\u00e9gale sp\u00e9cifique de transmettre des donn\u00e9es personnelles \u00e0 des tiers, notamment \u00e0 des organismes publics.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "1.11 S\u00e9curit\u00e9 des donn\u00e9es",
      sections: [
        {
          heading: "1.11 S\u00e9curit\u00e9 des donn\u00e9es",
          body: [
            "Nous utilisons des mesures techniques et organisationnelles appropri\u00e9es pour collecter vos donn\u00e9es \u2014 en tenant compte de l\u2019\u00e9tat de l\u2019art, des co\u00fbts de mise en \u0153uvre et de la nature, de la port\u00e9e, du contexte et des finalit\u00e9s du traitement, ainsi que des risques existants de violation de donn\u00e9es \u2014 afin de prot\u00e9ger les personnes concern\u00e9es contre la manipulation accidentelle ou intentionnelle, la perte ou destruction partielle ou totale, ou l\u2019acc\u00e8s non autoris\u00e9 par des tiers. Par exemple, nous utilisons le chiffrement TLS pour nos sites web. Nos mesures de s\u00e9curit\u00e9 sont continuellement renforc\u00e9es pour suivre le rythme des avanc\u00e9es technologiques.",
          ],
        },
      ],
    },
    {
      id: "rights",
      title: "1.12 Vos droits",
      sections: [
        {
          heading: "1.12 Vos droits",
          body: [
            "Vous pouvez exercer vos droits en tant que personne concern\u00e9e \u00e0 tout moment concernant vos donn\u00e9es personnelles, notamment en nous contactant en utilisant les coordonn\u00e9es de la Section 1.2. En vertu du RGPD, les personnes concern\u00e9es disposent des droits suivants :",
          ],
        },
      ],
      rightsList: [
        { right: "Droit d\u2019acc\u00e8s (Art. 15 RGPD)", desc: "Vous pouvez demander des informations sur les donn\u00e9es personnelles que nous traitons vous concernant. Veuillez pr\u00e9ciser clairement votre demande pour nous aider \u00e0 compiler les donn\u00e9es n\u00e9cessaires. Sur demande, nous vous fournirons une copie des donn\u00e9es trait\u00e9es. Notez que votre droit d\u2019information peut \u00eatre limit\u00e9 dans certaines circonstances en vertu des dispositions r\u00e9glementaires." },
        { right: "Droit de rectification (Art. 16 RGPD)", desc: "Si les informations vous concernant sont inexactes ou incompl\u00e8tes, vous pouvez demander qu\u2019elles soient corrig\u00e9es ou compl\u00e9t\u00e9es." },
        { right: "Droit \u00e0 l\u2019effacement (Art. 17 RGPD)", desc: "Vous pouvez demander l\u2019effacement de vos donn\u00e9es personnelles. Votre droit \u00e0 l\u2019effacement d\u00e9pend, entre autres, de la question de savoir si les donn\u00e9es sont encore n\u00e9cessaires \u00e0 nos obligations l\u00e9gales." },
        { right: "Droit \u00e0 la limitation du traitement (Art. 18 RGPD)", desc: "Vous avez le droit de demander la limitation du traitement des donn\u00e9es vous concernant." },
        { right: "Droit \u00e0 la portabilit\u00e9 des donn\u00e9es (Art. 20 RGPD)", desc: "Vous avez le droit de recevoir les donn\u00e9es que vous nous avez fournies dans un format structur\u00e9, couramment utilis\u00e9 et lisible par machine, ou de demander leur transmission \u00e0 un autre responsable du traitement." },
        { right: "Droit d\u2019opposition (Art. 21 RGPD)", desc: "Vous avez le droit de vous opposer \u00e0 tout moment au traitement de vos donn\u00e9es pour des raisons li\u00e9es \u00e0 votre situation particuli\u00e8re. Vous pouvez \u00e9galement vous opposer \u00e0 la r\u00e9ception de publicit\u00e9s \u00e0 tout moment avec effet futur (Art. 21(2) RGPD)." },
        { right: "Droit d\u2019introduire une r\u00e9clamation", desc: "Si vous estimez que nous n\u2019avons pas respect\u00e9 la r\u00e9glementation sur la protection des donn\u00e9es lors du traitement de vos donn\u00e9es, vous pouvez introduire une r\u00e9clamation aupr\u00e8s de l\u2019autorit\u00e9 de contr\u00f4le comp\u00e9tente : ARTCI \u2014 Abidjan, Marcory Anoumabo \u2014 18 BP 2203 Abidjan 18, C\u00f4te d\u2019Ivoire." },
        { right: "Droit de retirer le consentement", desc: "Vous pouvez retirer \u00e0 tout moment votre consentement au traitement des donn\u00e9es avec effet futur. Cela s\u2019applique \u00e9galement aux d\u00e9clarations de consentement \u00e9mises avant le 25 mai 2018." },
      ],
    },
    {
      id: "special",
      title: "2. Informations sp\u00e9ciales",
      sections: [
        {
          heading: "2.1 Visite de notre site web",
          body: [
            "Les informations sur Moja Ride et nos services sont disponibles sur mojaride.com (ci-apr\u00e8s le \u00ab Site web \u00bb). Lorsque vous visitez notre site web, vos donn\u00e9es personnelles sont trait\u00e9es.",
          ],
        },
        {
          heading: "2.1.1 Mise \u00e0 disposition du site web",
          body: [
            "Lors de l\u2019utilisation du site web \u00e0 des fins d\u2019information, nous collectons et stockons les cat\u00e9gories de donn\u00e9es suivantes dans les fichiers journaux du serveur :",
          ],
          list: [
            "URL de r\u00e9f\u00e9rence (la page d\u2019o\u00f9 provient la demande)",
            "Nom et URL de la page demand\u00e9e",
            "Date et heure de la demande d\u2019acc\u00e8s (fuseau horaire du serveur)",
            "Version du navigateur utilis\u00e9e",
            "Adresse IP de l\u2019appareil demandeur",
            "Quantit\u00e9 de donn\u00e9es transf\u00e9r\u00e9es",
            "Syst\u00e8me d\u2019exploitation",
            "Code d\u2019\u00e9tat HTTP (succ\u00e8s/\u00e9chec)",
            "D\u00e9calage horaire par rapport \u00e0 GMT",
          ],
        },
        {
          heading: "2.1.2 Formulaires de contact",
          body: [
            "Les donn\u00e9es soumises via les formulaires de contact (par exemple, titre, nom, adresse, entreprise, email, heure de soumission, sujet) sont trait\u00e9es pour r\u00e9pondre aux demandes. La base juridique est l\u2019Art. 6(1)(b) RGPD lorsque la demande concerne un contrat, ou l\u2019Art. 6(1)(f) RGPD (int\u00e9r\u00eat l\u00e9gitime \u00e0 traiter les demandes de contact) dans les autres cas. Nous conservons les donn\u00e9es du formulaire de contact et l\u2019adresse IP associ\u00e9e pour satisfaire \u00e0 nos obligations probatoires, assurer la conformit\u00e9 l\u00e9gale et pr\u00e9venir les abus.",
          ],
        },
        {
          heading: "2.1.3 R\u00e9servation, fourniture et traitement des services de transport",
          body: [
            "Lors de la r\u00e9servation de billets de transport, nous collectons et traitons les cat\u00e9gories de donn\u00e9es personnelles suivantes :",
          ],
          list: [
            "Adresse email",
            "Pr\u00e9nom et nom",
            "Identifiants de connexion",
            "Donn\u00e9es de paiement",
            "Date de naissance (pour les services avec tarifs enfants sp\u00e9ciaux)",
            "Acceptation des conditions g\u00e9n\u00e9rales applicables",
            "Informations sur la r\u00e9servation avanc\u00e9e de si\u00e8ge",
            "D\u00e9tails des bagages",
            "Langue du domaine de r\u00e9servation",
            "Canal de r\u00e9servation (Web ou application)",
          ],
        },
        {
          heading: "",
          body: [
            "Vous pouvez \u00e9ventuellement fournir un num\u00e9ro de t\u00e9l\u00e9phone de contact en cas de retard ou de changement d\u2019itin\u00e9raire.",
            "Ces donn\u00e9es sont trait\u00e9es pour la r\u00e9servation, la fourniture et le traitement des services de transport \u2014 y compris le service client \u2014 et pour le respect des obligations l\u00e9gales. Base juridique : Art. 6(1)(b) et (c) RGPD.",
            "Pour les r\u00e9servations de transport international, les donn\u00e9es suppl\u00e9mentaires suivantes peuvent \u00eatre collect\u00e9es en fonction du lieu de d\u00e9part et d\u2019arriv\u00e9e :",
          ],
          list: [
            "Informations sur le genre",
            "Carte d\u2019identit\u00e9, passeport ou num\u00e9ro d\u2019identification",
          ],
        },
        {
          heading: "",
          body: [
            "Nous transmettons les donn\u00e9es ci-dessus au(x) transporteur(s) concern\u00e9(s), ainsi qu\u2019aux organismes publics lorsqu\u2019une obligation l\u00e9gale ou une autorisation correspondante existe. Base juridique : Art. 6(1)(b) ou (c) RGPD.",
          ],
        },
      ],
      processorBox: {
        title: "Processeurs de paiement",
        body: "Les donn\u00e9es de paiement requises sont transmises aux prestataires de services de paiement pour le traitement s\u00e9curis\u00e9 de vos paiements :",
        processors: [
          { name: "Paystack", address: "26 Joel Ogunnaike Street, Ikeja GRA, Ikeja, Lagos, Nigeria \u2014 +234 201 631 6160" },
          { name: "Wave C\u00f4te d\u2019Ivoire", address: "Cocody Riviera 4, pr\u00e8s de la Banque Mansah \u2014 contact@wave.com \u2014 +225 07 48 27 77 42" },
        ],
      },
    },
  ],
};

export function getPrivacyContent(locale: string): PrivacyData {
  return locale.startsWith("fr") ? fr : en;
}

export function getPrivacyToc(locale: string): Array<{ id: string; title: string }> {
  return getPrivacyContent(locale).toc;
}
