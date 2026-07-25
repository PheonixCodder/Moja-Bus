interface TermsSection {
  id: string;
  title: string;
  number?: string;
  subsections?: Array<{
    heading: string;
    body?: string[];
    lists?: Array<{ variant: "bullet" | "circle"; items: string[] }>;
  }>;
  paragraphs?: string[];
  table?: {
    headers: [string, string];
    rows: Array<[string, string]>;
    headerBg?: string;
    rowColors?: string;
    refundColor?: string;
  };
  extras?: string[];
  contactBox?: {
    name: string;
    address: string;
    email: string;
  };
  noteBox?: {
    paragraphs: string[];
  };
  olderPolicy?: {
    label: string;
    table: {
      headers: [string, string];
      rows: Array<[string, string]>;
    };
    extras: string;
  };
}

interface TermsData {
  toc: Array<{ id: string; title: string }>;
  items: TermsSection[];
}

const en: TermsData = {
  toc: [
    { id: "scope", title: "1. Scope of Application" },
    { id: "partner", title: "2. Contractual Partner" },
    { id: "commercial-use", title: "3. Commercial Use of the Portal" },
    { id: "payment", title: "4. Payment & Vouchers" },
    { id: "cancellation-modification", title: "5. Cancellation & Modification" },
    { id: "service-fees", title: "6. Service Fees" },
    { id: "jurisdiction", title: "7. Jurisdiction" },
    { id: "severability", title: "8. Severability" },
    { id: "cancellation-policy", title: "Cancellation Policy" },
    { id: "contact", title: "Contact" },
  ],
  items: [
    {
      id: "scope",
      title: "Scope of Application",
      number: "1",
      paragraphs: [
        "1.1 The General Terms of Sale and the Special Booking Conditions apply to the use of MojaBus internet portals (including the mobile application, designed to allow customers to visit these portals) and to the booking of trips with MojaBus.",
        "MojaBus reserves the right to modify these General Booking Conditions at any time by publishing a new version on the website. The booking conditions applicable are those in force on the date the order is placed.",
        "Checking the box relating to these General Booking Conditions during the order validation process constitutes unreserved acceptance by the customer of all these General Booking Conditions.",
      ],
    },
    {
      id: "partner",
      title: "Contractual Partner",
      number: "2",
      paragraphs: [
        "The contractual partner for trip bookings (seller of transport tickets) and for the use of web portals is the company Moja Ride SARL, hereinafter referred to as \u201cMoja Ride\u201d.",
      ],
    },
    {
      id: "commercial-use",
      title: "Commercial Use of the Web Portal",
      number: "3",
      subsections: [
        {
          heading: "",
          body: [
            "3.1 Price comparison services may enter into a contract with Moja Ride authorizing the receipt, processing, and publication of Moja Ride prices and bus schedules.",
            "3.2 It is prohibited to use MojaBus web portals for non-private or commercial purposes. The use of automated data extraction systems from this site for commercial purposes (\u201cscreen scraping\u201d) is prohibited. Moja Ride reserves the right to take action in the event of a breach of these provisions.",
          ],
        },
      ],
    },
    {
      id: "payment",
      title: "Payment & Vouchers",
      number: "4",
      subsections: [
        {
          heading: "4.1 Payment methods",
          body: ["Transport tickets may be paid in different ways depending on the booking type:"],
          lists: [
            {
              variant: "bullet",
              items: [
                "Online: Mobile money and wallets (Wave, Orange Money, etc.) and bank cards (Mastercard / Visa / Amex). We reserve the right to offer specific payment methods per booking.",
                "On board: Cash only.",
                "Points of sale: Our partner agencies and stations offer various payment options; cash is always accepted.",
              ],
            },
          ],
        },
        {
          heading: "4.2 Credit card purchases",
          body: ["Customer accounts are debited once the booking is complete. In the event of a rejected card payment, customers may be temporarily or permanently prohibited from paying with that card and must use another card or an alternative payment method (see 4.1)."],
        },
        {
          heading: "4.3 Offsetting",
          body: ["Claims may only be offset where the principle of legal set-off applies, i.e., between two fungible, certain, liquid, and due obligations. Obligations involving sums of money \u2014 even in different convertible currencies \u2014 or obligations involving a quantity of goods of the same kind are fungible."],
        },
        {
          heading: "4.4 Use of vouchers",
          lists: [
            {
              variant: "bullet",
              items: [
                "A maximum of one voucher may be used per booking. Vouchers can only be used online or at our partner agencies.",
                "Monetary value vouchers may be applied to the entire cart. Discount or free-trip vouchers apply to the ticket price only \u2014 add-ons (service fees, luggage, bicycle) are excluded.",
                "During promotional campaigns, voucher use is limited to 3 vouchers per person. Moja Ride may cancel all bookings beyond the first 3 if this limit is exceeded.",
                "Vouchers issued free of charge for marketing purposes expire after the first completed booking.",
                "Commercial resale of vouchers is prohibited and will result in ticket blocking and/or claims for damages. Customers will be informed and given 15 days to submit observations.",
                "Cash refunds of vouchers are excluded.",
                "In case of fraud or illegal activity related to vouchers, Moja Ride may close accounts, require alternative payment, and/or block vouchers. No right to activation or refund of affected vouchers may be invoked.",
                "Moja Ride may cancel tickets paid for in whole or in part with fraudulently used vouchers.",
              ],
            },
          ],
        },
        {
          heading: "4.5 Use of discount codes",
          lists: [
            {
              variant: "bullet",
              items: [
                "Only one discount code may be used per booking. Codes are activated within 48 hours of the booking confirmation email and can only be used online or at partner agencies.",
                "Discount codes are valid for 3 months from date of issue.",
                "Direct connections only (no connections), except for round trips. The departure and arrival points may not be the same.",
                "Personal vouchers are non-transferable.",
                "Booking changes can only be made by customer service. Cancellation is not possible.",
                "Commercial resale of discount codes is prohibited and subject to sanctions.",
                "Cash refunds of discount codes are excluded.",
                "Each discount code must be used for a different trip.",
              ],
            },
          ],
        },
        {
          heading: "4.6 Promotional campaigns",
          lists: [
            {
              variant: "bullet",
              items: [
                "Reduced-price ticket offers are limited to 3 tickets per person per campaign. Bookings beyond 3 may be cancelled by Moja Ride.",
                "Commercial resale of tickets is prohibited and will result in ticket blocking.",
              ],
            },
          ],
        },
        {
          heading: "4.7 Order cancellation by Moja Ride",
          lists: [
            {
              variant: "bullet",
              items: [
                "Moja Ride reserves the right to refuse an order for a legitimate reason, in particular when there is an outstanding payment dispute with the customer.",
                "In the event of fraud or illegal activity, Moja Ride may cancel any ticket purchased in whole or in part by means of a refund of that ticket.",
                "If a ticket purchased during a commercial offer is modified after the offer has expired, the customer must pay the difference between the new applicable price and the price paid during the offer.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cancellation-modification",
      title: "Cancellation & Modification of Tickets",
      number: "5",
      subsections: [
        {
          heading: "",
          body: [
            "5.1 It is not possible to cancel or modify a booking with the driver. Cancellations and modifications may be made on the MojaBus website, by phone, or at one of the MojaBus partner agencies or points of sale, up to 15 minutes before the scheduled departure time. A round trip is considered a single booking. A round trip corresponds to two journeys, but a journey with connections corresponds to only one journey.",
            "5.2 In the event of a ticket modification (traveler name, date, or time), if the cost of the new journey is higher, the customer must pay the difference immediately. If the cost is lower, the customer will receive a non-refundable voucher valid for 12 months, usable for all or part of a future journey.",
            "5.3 For each ticket modification (except a phone number change, which is free), modification fees apply per cancelled journey and per passenger.",
            "5.4 If a cancellation voucher is used for a new booking, the same general cancellation conditions apply to that new journey.",
            "5.5 The customer may cancel their ticket on the website or app and will receive a cancellation voucher for the amount of the original ticket, minus the cancellation fees per passenger per journey (see 5.3). This non-refundable voucher is valid for 12 months.",
            "5.6 All cancellation or modification fees are waived when the refund is requested due to circumstances attributable to Moja Ride or its subsidiaries.",
            "5.7 If a ticket for which a MojaBus subsidiary is the carrier is not used for travel, the ticket price will be refunded upon presentation of the ticket, minus processing fees per journey per passenger (1,000 FCFA or equivalent), unless the passenger can prove lower damages. Requests must be submitted informally within 3 months to Moja Ride\u2019s registered address in Abidjan. Processing fees are reduced to 1,000 FCFA (or equivalent) per passenger per journey, plus wire transfer fees, if the carrier is Moja Ride and the request is made quickly, no later than one week after the ticket expires.",
            "5.8 Different cancellation policies in the Carrier\u2019s General Conditions do not apply.",
          ],
        },
      ],
    },
    {
      id: "service-fees",
      title: "Service Fees",
      number: "6",
      noteBox: {
        paragraphs: [
          "A service fee of 500 FCFA (or the equivalent in the relevant currency) will be charged per booking. This is a per-order fee (not per ticket) for use of the website, app, and other tools designed to optimize the customer experience \u2014 such as the \u201cManage my booking\u201d platform, where you can modify a journey or add luggage.",
        ],
      },
      paragraphs: [
        "In the event of cancellation by the customer, service fees are non-refundable.",
        "For bookings made by phone (customer service) or at one of our offline agencies or resellers, additional fees may apply.",
      ],
    },
    {
      id: "jurisdiction",
      title: "Jurisdiction",
      number: "7",
      paragraphs: [
        "The competent territorial jurisdiction is, unless otherwise provided, that of the place of residence of the defendant or the place where the damage occurred. The competent jurisdiction for merchants, legal entities, and individuals without a general jurisdiction in their country, as well as for individuals who have moved their primary domicile or habitual residence abroad following the conclusion of a transport contract \u2014 whose primary domicile or habitual place of residence is unknown at the time of the action \u2014 is Abidjan, C\u00f4te d\u2019Ivoire.",
      ],
    },
    {
      id: "severability",
      title: "Severability",
      number: "8",
      paragraphs: [
        "If any individual provision of these General Terms of Sale and Special Booking Conditions is or becomes wholly or partially unenforceable or void, this shall not in principle affect the enforceability of the contract as a whole.",
      ],
    },
    {
      id: "cancellation-policy",
      title: "Cancellation Policy",
      subsections: [
        {
          heading: "",
          body: [
            "Applicable to trips with a scheduled departure date after 12 September 2024.",
          ],
        },
      ],
      noteBox: {
        paragraphs: [
          "For bookings made before 1 August 2024 for a departure after 12 September 2024, any cancellation request after 12 September must be addressed to our customer service via the chat.",
          "Changed plans? No problem! With Moja Ride you can cancel your ticket up to 15 minutes before departure and receive a full or partial refund in the form of a voucher. The refund percentage depends on how early you cancel, calculated from the exact departure time (hour, minute, second).",
        ],
      },
      table: {
        headers: ["Time before departure", "Refund (% of ticket price)"],
        rows: [
          ["Less than 2 days", "25%"],
          ["Between 2 and 6 days", "50%"],
          ["Between 7 and 29 days", "75%"],
          ["30 days or more", "100%"],
        ],
        refundColor: "text-[#ee237c]",
      },
      extras: [
        "\u2022 Extras (seat reservations, additional luggage): refunded at 100%.",
        "\u2022 Booking and service fees are non-refundable.",
      ],
      olderPolicy: {
        label: "Previous policy \u2014 Applicable to trips with departure between 18 December 2023 and 12 September 2024",
        table: {
          headers: ["Time before departure", "Refund (% of ticket price)"],
          rows: [
            ["Less than 1 day", "25%"],
            ["Between 1 and 6 days", "50%"],
            ["Between 7 and 29 days", "75%"],
            ["30 days or more", "100%"],
          ],
        },
        extras: "Extras (seat reservations, additional luggage): 100% refund. Booking and service fees are non-refundable.",
      },
    },
    {
      id: "contact",
      title: "Contact",
      contactBox: {
        name: "Moja Ride SARL",
        address: "Abidjan, Cocody, Cit\u00e9 Sir \u2014 C\u00f4te d\u2019Ivoire",
        email: "legal@mojaride.com",
      },
    },
  ],
};

const fr: TermsData = {
  toc: [
    { id: "scope", title: "1. Champ d\u2019application" },
    { id: "partner", title: "2. Partenaire contractuel" },
    { id: "commercial-use", title: "3. Utilisation commerciale du portail" },
    { id: "payment", title: "4. Paiement et avoirs" },
    { id: "cancellation-modification", title: "5. Annulation et modification" },
    { id: "service-fees", title: "6. Frais de service" },
    { id: "jurisdiction", title: "7. Comp\u00e9tence juridictionnelle" },
    { id: "severability", title: "8. Divisibilit\u00e9" },
    { id: "cancellation-policy", title: "Politique d\u2019annulation" },
    { id: "contact", title: "Contact" },
  ],
  items: [
    {
      id: "scope",
      title: "Champ d\u2019application",
      number: "1",
      paragraphs: [
        "1.1 Les conditions g\u00e9n\u00e9rales de vente et les conditions particuli\u00e8res de r\u00e9servation s\u2019appliquent \u00e0 l\u2019utilisation des portails internet MojaBus (y compris l\u2019application mobile, con\u00e7ue pour permettre aux clients de consulter ces portails) et \u00e0 la r\u00e9servation de voyages aupr\u00e8s de MojaBus.",
        "MojaBus se r\u00e9serve le droit de modifier ces conditions g\u00e9n\u00e9rales de r\u00e9servation \u00e0 tout moment en publiant une nouvelle version sur le site web. Les conditions de r\u00e9servation applicables sont celles en vigueur \u00e0 la date de la commande.",
        "Le fait de cocher la case relative aux pr\u00e9sentes conditions g\u00e9n\u00e9rales de r\u00e9servation lors du processus de validation de la commande constitue une acceptation sans r\u00e9serve par le client de toutes les conditions g\u00e9n\u00e9rales de r\u00e9servation.",
      ],
    },
    {
      id: "partner",
      title: "Partenaire contractuel",
      number: "2",
      paragraphs: [
        "Le partenaire contractuel pour les r\u00e9servations de voyage (vendeur de billets de transport) et pour l\u2019utilisation des portails web est la soci\u00e9t\u00e9 Moja Ride SARL, ci-apr\u00e8s d\u00e9nomm\u00e9e \u00ab Moja Ride \u00bb.",
      ],
    },
    {
      id: "commercial-use",
      title: "Utilisation commerciale du portail web",
      number: "3",
      subsections: [
        {
          heading: "",
          body: [
            "3.1 Les services de comparaison de prix peuvent conclure un contrat avec Moja Ride autorisant la r\u00e9ception, le traitement et la publication des prix et des horaires de bus de Moja Ride.",
            "3.2 Il est interdit d\u2019utiliser les portails web MojaBus \u00e0 des fins non priv\u00e9es ou commerciales. L\u2019utilisation de syst\u00e8mes automatis\u00e9s d\u2019extraction de donn\u00e9es de ce site \u00e0 des fins commerciales (\u00ab screen scraping \u00bb) est interdite. Moja Ride se r\u00e9serve le droit d\u2019engager des poursuites en cas de violation de ces dispositions.",
          ],
        },
      ],
    },
    {
      id: "payment",
      title: "Paiement et avoirs",
      number: "4",
      subsections: [
        {
          heading: "4.1 M\u00e9thodes de paiement",
          body: ["Les billets de transport peuvent \u00eatre pay\u00e9s de diff\u00e9rentes mani\u00e8res selon le type de r\u00e9servation :"],
          lists: [
            {
              variant: "bullet",
              items: [
                "En ligne : Mobile money et portefeuilles \u00e9lectroniques (Wave, Orange Money, etc.) et cartes bancaires (Mastercard / Visa / Amex). Nous nous r\u00e9servons le droit de proposer des moyens de paiement sp\u00e9cifiques par r\u00e9servation.",
                "\u00c0 bord : Esp\u00e8ces uniquement.",
                "Points de vente : Nos agences partenaires et gares offrent diverses options de paiement ; les esp\u00e8ces sont toujours accept\u00e9es.",
              ],
            },
          ],
        },
        {
          heading: "4.2 Achats par carte de cr\u00e9dit",
          body: ["Les comptes clients sont d\u00e9bit\u00e9s d\u00e8s que la r\u00e9servation est termin\u00e9e. En cas de refus d\u2019un paiement par carte, les clients peuvent \u00eatre temporairement ou d\u00e9finitivement interdits de payer avec cette carte et doivent utiliser une autre carte ou un autre moyen de paiement (voir 4.1)."],
        },
        {
          heading: "4.3 Compensation",
          body: ["Les cr\u00e9ances ne peuvent \u00eatre compens\u00e9es que lorsque le principe de la compensation l\u00e9gale s\u2019applique, c\u2019est-\u00e0-dire entre deux obligations fongibles, certaines, liquides et exigibles. Les obligations portant sur des sommes d\u2019argent \u2014 m\u00eame dans des devises convertibles diff\u00e9rentes \u2014 ou les obligations portant sur une quantit\u00e9 de biens de m\u00eame nature sont fongibles."],
        },
        {
          heading: "4.4 Utilisation des avoirs",
          lists: [
            {
              variant: "bullet",
              items: [
                "Un maximum d\u2019un avoir peut \u00eatre utilis\u00e9 par r\u00e9servation. Les avoirs ne peuvent \u00eatre utilis\u00e9s qu\u2019en ligne ou dans nos agences partenaires.",
                "Les avoirs mon\u00e9taires peuvent \u00eatre appliqu\u00e9s \u00e0 l\u2019ensemble du panier. Les avoirs de r\u00e9duction ou de voyage gratuit s\u2019appliquent uniquement au prix du billet \u2014 les suppl\u00e9ments (frais de service, bagages, v\u00e9lo) sont exclus.",
                "Pendant les campagnes promotionnelles, l\u2019utilisation des avoirs est limit\u00e9e \u00e0 3 avoirs par personne. Moja Ride peut annuler toutes les r\u00e9servations au-del\u00e0 des 3 premi\u00e8res si cette limite est d\u00e9pass\u00e9e.",
                "Les avoirs \u00e9mis gratuitement \u00e0 des fins marketing expirent apr\u00e8s la premi\u00e8re r\u00e9servation effectu\u00e9e.",
                "La revente commerciale des avoirs est interdite et entra\u00eenera le blocage des billets et/ou des demandes de dommages-int\u00e9r\u00eats. Les clients seront inform\u00e9s et disposeront de 15 jours pour pr\u00e9senter leurs observations.",
                "Le remboursement en esp\u00e8ces des avoirs est exclu.",
                "En cas de fraude ou d\u2019activit\u00e9 ill\u00e9gale li\u00e9e aux avoirs, Moja Ride peut fermer des comptes, exiger un paiement alternatif et/ou bloquer les avoirs. Aucun droit \u00e0 l\u2019activation ou au remboursement des avoirs concern\u00e9s ne peut \u00eatre invoqu\u00e9.",
                "Moja Ride peut annuler les billets pay\u00e9s en totalit\u00e9 ou en partie avec des avoirs utilis\u00e9s frauduleusement.",
              ],
            },
          ],
        },
        {
          heading: "4.5 Utilisation des codes promotionnels",
          lists: [
            {
              variant: "bullet",
              items: [
                "Un seul code promotionnel peut \u00eatre utilis\u00e9 par r\u00e9servation. Les codes sont activ\u00e9s dans les 48 heures suivant l\u2019email de confirmation de r\u00e9servation et ne peuvent \u00eatre utilis\u00e9s qu\u2019en ligne ou dans les agences partenaires.",
                "Les codes promotionnels sont valables 3 mois \u00e0 compter de leur date d\u2019\u00e9mission.",
                "Connexions directes uniquement (pas de correspondances), sauf pour les allers-retours. Les points de d\u00e9part et d\u2019arriv\u00e9e ne peuvent pas \u00eatre les m\u00eames.",
                "Les avoirs personnels sont non transf\u00e9rables.",
                "Les modifications de r\u00e9servation ne peuvent \u00eatre effectu\u00e9es que par le service client. L\u2019annulation n\u2019est pas possible.",
                "La revente commerciale des codes promotionnels est interdite et passible de sanctions.",
                "Le remboursement en esp\u00e8ces des codes promotionnels est exclu.",
                "Chaque code promotionnel doit \u00eatre utilis\u00e9 pour un voyage diff\u00e9rent.",
              ],
            },
          ],
        },
        {
          heading: "4.6 Campagnes promotionnelles",
          lists: [
            {
              variant: "bullet",
              items: [
                "Les offres de billets \u00e0 prix r\u00e9duit sont limit\u00e9es \u00e0 3 billets par personne et par campagne. Les r\u00e9servations au-del\u00e0 de 3 peuvent \u00eatre annul\u00e9es par Moja Ride.",
                "La revente commerciale des billets est interdite et entra\u00eenera le blocage des billets.",
              ],
            },
          ],
        },
        {
          heading: "4.7 Annulation de commande par Moja Ride",
          lists: [
            {
              variant: "bullet",
              items: [
                "Moja Ride se r\u00e9serve le droit de refuser une commande pour un motif l\u00e9gitime, notamment en cas de litige de paiement en cours avec le client.",
                "En cas de fraude ou d\u2019activit\u00e9 ill\u00e9gale, Moja Ride peut annuler tout billet achet\u00e9 en totalit\u00e9 ou en partie au moyen d\u2019un remboursement de ce billet.",
                "Si un billet achet\u00e9 pendant une offre commerciale est modifi\u00e9 apr\u00e8s l\u2019expiration de l\u2019offre, le client doit payer la diff\u00e9rence entre le nouveau prix applicable et le prix pay\u00e9 pendant l\u2019offre.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cancellation-modification",
      title: "Annulation et modification des billets",
      number: "5",
      subsections: [
        {
          heading: "",
          body: [
            "5.1 Il n\u2019est pas possible d\u2019annuler ou de modifier une r\u00e9servation aupr\u00e8s du conducteur. Les annulations et modifications peuvent \u00eatre effectu\u00e9es sur le site web MojaBus, par t\u00e9l\u00e9phone, ou dans l\u2019une des agences partenaires ou points de vente MojaBus, jusqu\u2019\u00e0 15 minutes avant l\u2019heure de d\u00e9part pr\u00e9vue. Un aller-retour est consid\u00e9r\u00e9 comme une seule r\u00e9servation. Un aller-retour correspond \u00e0 deux trajets, mais un trajet avec correspondances correspond \u00e0 un seul trajet.",
            "5.2 En cas de modification d\u2019un billet (nom du voyageur, date ou heure), si le co\u00fbt du nouveau voyage est plus \u00e9lev\u00e9, le client doit payer la diff\u00e9rence imm\u00e9diatement. Si le co\u00fbt est inf\u00e9rieur, le client recevra un avoir non remboursable valable 12 mois, utilisable pour tout ou partie d\u2019un voyage futur.",
            "5.3 Pour chaque modification de billet (sauf un changement de num\u00e9ro de t\u00e9l\u00e9phone, qui est gratuit), des frais de modification s\u2019appliquent par trajet annul\u00e9 et par passager.",
            "5.4 Si un avoir d\u2019annulation est utilis\u00e9 pour une nouvelle r\u00e9servation, les m\u00eames conditions g\u00e9n\u00e9rales d\u2019annulation s\u2019appliquent \u00e0 ce nouveau voyage.",
            "5.5 Le client peut annuler son billet sur le site web ou l\u2019application et recevra un avoir d\u2019annulation pour le montant du billet original, moins les frais d\u2019annulation par passager et par trajet (voir 5.3). Cet avoir non remboursable est valable 12 mois.",
            "5.6 Tous les frais d\u2019annulation ou de modification sont supprim\u00e9s lorsque le remboursement est demand\u00e9 en raison de circonstances imputables \u00e0 Moja Ride ou \u00e0 ses filiales.",
            "5.7 Si un billet pour lequel une filiale MojaBus est le transporteur n\u2019est pas utilis\u00e9 pour le voyage, le prix du billet sera rembours\u00e9 sur pr\u00e9sentation du billet, moins les frais de traitement par trajet et par passager (1 000 FCFA ou \u00e9quivalent), \u00e0 moins que le passager ne prouve un pr\u00e9judice moindre. Les demandes doivent \u00eatre soumises de mani\u00e8re informelle dans un d\u00e9lai de 3 mois \u00e0 l\u2019adresse du si\u00e8ge social de Moja Ride \u00e0 Abidjan. Les frais de traitement sont r\u00e9duits \u00e0 1 000 FCFA (ou \u00e9quivalent) par passager et par trajet, plus les frais de virement, si le transporteur est Moja Ride et que la demande est faite rapidement, au plus tard une semaine apr\u00e8s l\u2019expiration du billet.",
            "5.8 Les diff\u00e9rentes politiques d\u2019annulation dans les conditions g\u00e9n\u00e9rales du transporteur ne s\u2019appliquent pas.",
          ],
        },
      ],
    },
    {
      id: "service-fees",
      title: "Frais de service",
      number: "6",
      noteBox: {
        paragraphs: [
          "Des frais de service de 500 FCFA (ou l\u2019\u00e9quivalent dans la devise concern\u00e9e) seront factur\u00e9s par r\u00e9servation. Il s\u2019agit de frais par commande (pas par billet) pour l\u2019utilisation du site web, de l\u2019application et d\u2019autres outils con\u00e7us pour optimiser l\u2019exp\u00e9rience client \u2014 tels que la plateforme \u00ab G\u00e9rer ma r\u00e9servation \u00bb, o\u00f9 vous pouvez modifier un voyage ou ajouter des bagages.",
        ],
      },
      paragraphs: [
        "En cas d\u2019annulation par le client, les frais de service sont non remboursables.",
        "Pour les r\u00e9servations effectu\u00e9es par t\u00e9l\u00e9phone (service client) ou dans l\u2019une de nos agences ou revendeurs hors ligne, des frais suppl\u00e9mentaires peuvent s\u2019appliquer.",
      ],
    },
    {
      id: "jurisdiction",
      title: "Comp\u00e9tence juridictionnelle",
      number: "7",
      paragraphs: [
        "La comp\u00e9tence territoriale est, sauf disposition contraire, celle du lieu de r\u00e9sidence du d\u00e9fendeur ou du lieu o\u00f9 le dommage s\u2019est produit. La comp\u00e9tence pour les commer\u00e7ants, les personnes morales et les personnes physiques n\u2019ayant pas de comp\u00e9tence g\u00e9n\u00e9rale dans leur pays, ainsi que pour les personnes physiques qui ont transf\u00e9r\u00e9 leur domicile principal ou leur r\u00e9sidence habituelle \u00e0 l\u2019\u00e9tranger apr\u00e8s la conclusion d\u2019un contrat de transport \u2014 dont le domicile principal ou le lieu de r\u00e9sidence habituel est inconnu au moment de l\u2019action \u2014 est Abidjan, C\u00f4te d\u2019Ivoire.",
      ],
    },
    {
      id: "severability",
      title: "Divisibilit\u00e9",
      number: "8",
      paragraphs: [
        "Si une disposition individuelle des pr\u00e9sentes conditions g\u00e9n\u00e9rales de vente et conditions particuli\u00e8res de r\u00e9servation est ou devient totalement ou partiellement inapplicable ou nulle, cela n\u2019affecte en principe pas l\u2019applicabilit\u00e9 du contrat dans son ensemble.",
      ],
    },
    {
      id: "cancellation-policy",
      title: "Politique d\u2019annulation",
      subsections: [
        {
          heading: "",
          body: [
            "Applicable aux voyages dont le d\u00e9part est pr\u00e9vu apr\u00e8s le 12 septembre 2024.",
          ],
        },
      ],
      noteBox: {
        paragraphs: [
          "Pour les r\u00e9servations effectu\u00e9es avant le 1er ao\u00fbt 2024 pour un d\u00e9part apr\u00e8s le 12 septembre 2024, toute demande d\u2019annulation apr\u00e8s le 12 septembre doit \u00eatre adress\u00e9e \u00e0 notre service client via le chat.",
          "Changement de plans ? Pas de probl\u00e8me ! Avec Moja Ride, vous pouvez annuler votre billet jusqu\u2019\u00e0 15 minutes avant le d\u00e9part et recevoir un remboursement total ou partiel sous forme d\u2019avoir. Le pourcentage de remboursement d\u00e9pend du moment de l\u2019annulation, calcul\u00e9 \u00e0 partir de l\u2019heure exacte de d\u00e9part (heure, minute, seconde).",
        ],
      },
      table: {
        headers: ["D\u00e9lai avant le d\u00e9part", "Remboursement (% du prix du billet)"],
        rows: [
          ["Moins de 2 jours", "25%"],
          ["Entre 2 et 6 jours", "50%"],
          ["Entre 7 et 29 jours", "75%"],
          ["30 jours ou plus", "100%"],
        ],
        refundColor: "text-[#ee237c]",
      },
      extras: [
        "\u2022 Suppl\u00e9ments (r\u00e9servation de si\u00e8ge, bagages suppl\u00e9mentaires) : rembours\u00e9s \u00e0 100%.",
        "\u2022 Les frais de r\u00e9servation et de service sont non remboursables.",
      ],
      olderPolicy: {
        label: "Ancienne politique \u2014 Applicable aux voyages avec d\u00e9part entre le 18 d\u00e9cembre 2023 et le 12 septembre 2024",
        table: {
          headers: ["D\u00e9lai avant le d\u00e9part", "Remboursement (% du prix du billet)"],
          rows: [
            ["Moins de 1 jour", "25%"],
            ["Entre 1 et 6 jours", "50%"],
            ["Entre 7 et 29 jours", "75%"],
            ["30 jours ou plus", "100%"],
          ],
        },
        extras: "Suppl\u00e9ments (r\u00e9servation de si\u00e8ge, bagages suppl\u00e9mentaires) : rembours\u00e9s \u00e0 100%. Les frais de r\u00e9servation et de service sont non remboursables.",
      },
    },
    {
      id: "contact",
      title: "Contact",
      contactBox: {
        name: "Moja Ride SARL",
        address: "Abidjan, Cocody, Cit\u00e9 Sir \u2014 C\u00f4te d\u2019Ivoire",
        email: "legal@mojaride.com",
      },
    },
  ],
};

export function getTermsContent(locale: string): TermsData {
  return locale.startsWith("fr") ? fr : en;
}

export function getTermsToc(locale: string): Array<{ id: string; title: string }> {
  return getTermsContent(locale).toc;
}
