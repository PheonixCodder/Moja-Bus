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
    { id: "payment", title: "4. Payment & Promotions" },
    { id: "cancellation-modification", title: "5. Cancellation & Rebooking" },
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
        "The contractual partner for trip bookings (seller of transport tickets) and for the use of web portals is the company Moja Ride SARL, hereinafter referred to as “Moja Ride”.",
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
            "3.2 It is prohibited to use MojaBus web portals for non-private or commercial purposes. The use of automated data extraction systems from this site for commercial purposes (“screen scraping”) is prohibited. Moja Ride reserves the right to take action in the event of a breach of these provisions.",
          ],
        },
      ],
    },
    {
      id: "payment",
      title: "Payment & Promotions",
      number: "4",
      subsections: [
        {
          heading: "4.1 Payment methods",
          body: ["Transport tickets may be paid in different ways depending on the booking type:"],
          lists: [
            {
              variant: "bullet",
              items: [
                "Online: Mobile money and wallets (Wave, Orange Money, MTN MoMo) and bank cards (Mastercard / Visa / Amex). We reserve the right to offer specific payment methods per booking.",
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
          body: ["Claims may only be offset where the principle of legal set-off applies, i.e., between two fungible, certain, liquid, and due obligations. Obligations involving sums of money — even in different convertible currencies — or obligations involving a quantity of goods of the same kind are fungible."],
        },
        {
          heading: "4.4 Promo credits and discount codes",
          lists: [
            {
              variant: "bullet",
              items: [
                "Only one discount code (or one auto-applied campaign benefit) may be applied per booking, combined with available promo credits when campaign stacking rules allow.",
                "Percentage discount codes reduce ticket fare only; the service and convenience fee is not discounted by percent-off codes.",
                "Discount codes and promo credits can only be used on eligible routes while the promotion is active and within any stated validity window.",
                "Promo credits and personal codes are strictly non-transferable and non-refundable in physical cash.",
                "Commercial resale of promo codes or promotional credits is prohibited and will result in booking cancellation and account suspension.",
              ],
            },
          ],
        },
        {
          heading: "4.5 Referral program",
          lists: [
            {
              variant: "bullet",
              items: [
                "Referral rewards (promo credits) are credited when a referred passenger completes their first paid, confirmed trip.",
                "Invite links use /r/CODE. A pending invite is bound upon sign-in. Sharing and applying codes require an active referral program.",
                "Promo credits from referrals are non-transferable and apply at checkout toward eligible bookings.",
                "Self-referral, device/phone manipulation, and fraudulent attribution will void rewards. Moja Ride may suspend accounts and reclaim improperly issued credits.",
              ],
            },
          ],
        },
        {
          heading: "4.6 Order cancellation by Moja Ride",
          lists: [
            {
              variant: "bullet",
              items: [
                "Moja Ride reserves the right to refuse an order for a legitimate reason, in particular when there is an outstanding payment dispute with the customer.",
                "In the event of fraud or illegal activity, Moja Ride may cancel any ticket purchased in whole or in part by means of a refund of that ticket.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cancellation-modification",
      title: "Cancellation & Rebooking of Tickets",
      number: "5",
      subsections: [
        {
          heading: "",
          body: [
            "5.1 It is not possible to cancel or modify a booking with the driver. Cancellations may be made on the MojaBus website, app, by phone, or at one of the MojaBus partner agencies, up to 15 minutes before the scheduled departure time.",
            "5.2 In the event of trip rescheduling or operator-assisted changes, the operator may directly rebook the passenger onto an upcoming departure on the same schedule with confirmed seat assignment at no penalty.",
            "5.3 When a passenger cancels their booking, eligible refunds are credited immediately to the passenger's Moja Wallet or processed to their original payment method in accordance with the cancellation policy.",
            "5.4 All cancellation fees are waived when a cancellation or reschedule is caused by circumstances attributable to Moja Ride or the transport operator.",
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
          "A service fee of 500 FCFA (or the equivalent in the relevant currency) will be charged per booking. This is a per-order fee (not per ticket) for use of the website, app, and other tools designed to optimize the customer experience.",
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
        "The competent territorial jurisdiction is, unless otherwise provided, that of the place of residence of the defendant or the place where the damage occurred. The competent jurisdiction for disputes arising from transport contracts is Abidjan, Côte d’Ivoire.",
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
          "Changed plans? No problem! With Moja Ride you can cancel your ticket up to 15 minutes before departure and receive a full or partial refund to your Moja Wallet or original payment method.",
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
        "• Extras (seat reservations, additional luggage): refunded at 100%.",
        "• Booking and service fees are non-refundable.",
      ],
      olderPolicy: {
        label: "Previous policy — Applicable to trips with departure between 18 December 2023 and 12 September 2024",
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
        address: "Abidjan, Cocody, Cité Sir — Côte d’Ivoire",
        email: "legal@mojaride.com",
      },
    },
  ],
};

const fr: TermsData = {
  toc: [
    { id: "scope", title: "1. Champ d’application" },
    { id: "partner", title: "2. Partenaire contractuel" },
    { id: "commercial-use", title: "3. Utilisation commerciale du portail" },
    { id: "payment", title: "4. Paiement et promotions" },
    { id: "cancellation-modification", title: "5. Annulation et réassignation" },
    { id: "service-fees", title: "6. Frais de service" },
    { id: "jurisdiction", title: "7. Compétence juridictionnelle" },
    { id: "severability", title: "8. Divisibilité" },
    { id: "cancellation-policy", title: "Politique d’annulation" },
    { id: "contact", title: "Contact" },
  ],
  items: [
    {
      id: "scope",
      title: "Champ d’application",
      number: "1",
      paragraphs: [
        "1.1 Les conditions générales de vente et les conditions particulières de réservation s’appliquent à l’utilisation des portails internet MojaBus (y compris l’application mobile, conçue pour permettre aux clients de consulter ces portails) et à la réservation de voyages auprès de MojaBus.",
        "MojaBus se réserve le droit de modifier ces conditions générales de réservation à tout moment en publiant une nouvelle version sur le site web. Les conditions de réservation applicables sont celles en vigueur à la date de la commande.",
        "Le fait de cocher la case relative aux présentes conditions générales de réservation lors du processus de validation de la commande constitue une acceptation sans réserve par le client de toutes les conditions générales de réservation.",
      ],
    },
    {
      id: "partner",
      title: "Partenaire contractuel",
      number: "2",
      paragraphs: [
        "Le partenaire contractuel pour les réservations de voyage (vendeur de billets de transport) et pour l’utilisation des portails web est la société Moja Ride SARL, ci-après dénommée « Moja Ride ».",
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
            "3.1 Les services de comparaison de prix peuvent conclure un contrat avec Moja Ride autorisant la réception, le traitement et la publication des prix et des horaires de bus de Moja Ride.",
            "3.2 Il est interdit d’utiliser les portails web MojaBus à des fins non privées ou commerciales. L’utilisation de systèmes automatisés d’extraction de données de ce site à des fins commerciales (« screen scraping ») est interdite. Moja Ride se réserve le droit d’engager des poursuites en cas de violation de ces dispositions.",
          ],
        },
      ],
    },
    {
      id: "payment",
      title: "Paiement et promotions",
      number: "4",
      subsections: [
        {
          heading: "4.1 Méthodes de paiement",
          body: ["Les billets de transport peuvent être payés de différentes manières selon le type de réservation :"],
          lists: [
            {
              variant: "bullet",
              items: [
                "En ligne : Mobile money et portefeuilles électroniques (Wave, Orange Money, MTN MoMo) et cartes bancaires (Mastercard / Visa / Amex). Nous nous réservons le droit de proposer des moyens de paiement spécifiques par réservation.",
                "À bord : Espèces uniquement.",
                "Points de vente : Nos agences partenaires et gares offrent diverses options de paiement ; les espèces sont toujours acceptées.",
              ],
            },
          ],
        },
        {
          heading: "4.2 Achats par carte de crédit",
          body: ["Les comptes clients sont débités dès que la réservation est terminée. En cas de refus d’un paiement par carte, les clients peuvent être temporairement ou définitivement interdits de payer avec cette carte et doivent utiliser une autre carte ou un autre moyen de paiement (voir 4.1)."],
        },
        {
          heading: "4.3 Compensation",
          body: ["Les créances ne peuvent être compensées que lorsque le principe de la compensation légale s’applique, c’est-à-dire entre deux obligations fongibles, certaines, liquides et exigibles."],
        },
        {
          heading: "4.4 Crédits promo et codes de réduction",
          lists: [
            {
              variant: "bullet",
              items: [
                "Un seul code promo (ou un avantage de campagne auto-appliqué) peut être appliqué par réservation, cumulable avec les crédits promo disponibles lorsque les règles de la campagne l'autorisent.",
                "Les codes en pourcentage réduisent uniquement le prix du billet ; les frais de service ne sont pas réduits par un pourcentage.",
                "Les codes et crédits promo ne peuvent être utilisés que pendant la validité de la campagne.",
                "Les crédits promo sont strictement personnels, non transférables et non remboursables en espèces.",
                "La revente commerciale des codes ou crédits promotionnels est interdite et passible de sanctions.",
              ],
            },
          ],
        },
        {
          heading: "4.5 Programme de parrainage",
          lists: [
            {
              variant: "bullet",
              items: [
                "Les récompenses de parrainage (crédits promo) sont versées dès qu'un filleul effectue son premier voyage payé et confirmé.",
                "Les liens d’invitation utilisent /r/CODE. Une invitation en attente est appliquée après connexion.",
                "Les crédits promo issus du parrainage sont non transférables et s’appliquent au paiement des réservations éligibles.",
                "L’auto-parrainage, l’abus d’appareil/téléphone et toute attribution frauduleuse annulent les récompenses.",
              ],
            },
          ],
        },
        {
          heading: "4.6 Annulation de commande par Moja Ride",
          lists: [
            {
              variant: "bullet",
              items: [
                "Moja Ride se réserve le droit de refuser une commande pour un motif légitime, notamment en cas de litige de paiement en cours avec le client.",
                "En cas de fraude ou d’activité illégale, Moja Ride peut annuler tout billet acheté en totalité ou en partie au moyen d’un remboursement de ce billet.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cancellation-modification",
      title: "Annulation et réassignation des billets",
      number: "5",
      subsections: [
        {
          heading: "",
          body: [
            "5.1 Il n’est pas possible d’annuler ou de modifier une réservation auprès du conducteur. Les annulations peuvent être effectuées sur le site web MojaBus, l'application, par téléphone, ou dans l’une des agences partenaires MojaBus, jusqu’à 15 minutes avant l’heure de départ prévue.",
            "5.2 En cas de reprogrammation ou de modification par l'opérateur, le passager peut être directement réassigné sur un départ ultérieur de la même ligne sans pénalité.",
            "5.3 Lors de l'annulation d'un billet par le passager, le remboursement éligible est crédité immédiatement sur le Portefeuille Moja ou remboursé selon le mode de paiement initial.",
            "5.4 Tous les frais d’annulation sont supprimés lorsque l'annulation est due à des circonstances imputables à Moja Ride ou au transporteur.",
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
          "Des frais de service de 500 FCFA (ou l’équivalent dans la devise concernée) seront facturés par réservation. Il s’agit de frais par commande (pas par billet) pour l’utilisation du site web, de l’application et d’autres outils conçus pour optimiser l’expérience client.",
        ],
      },
      paragraphs: [
        "En cas d’annulation par le client, les frais de service sont non remboursables.",
        "Pour les réservations effectuées par téléphone (service client) ou dans l’une de nos agences ou revendeurs hors ligne, des frais supplémentaires peuvent s’appliquer.",
      ],
    },
    {
      id: "jurisdiction",
      title: "Compétence juridictionnelle",
      number: "7",
      paragraphs: [
        "La compétence territoriale est, sauf disposition contraire, celle du lieu de résidence du défendeur ou du lieu où le dommage s’est produit. La juridiction compétente pour les litiges de transport est Abidjan, Côte d’Ivoire.",
      ],
    },
    {
      id: "severability",
      title: "Divisibilité",
      number: "8",
      paragraphs: [
        "Si une disposition individuelle des présentes conditions générales de vente et conditions particulières de réservation est ou devient totalement ou partiellement inapplicable ou nulle, cela n’affecte en principe pas l’applicabilité du contrat dans son ensemble.",
      ],
    },
    {
      id: "cancellation-policy",
      title: "Politique d’annulation",
      subsections: [
        {
          heading: "",
          body: [
            "Applicable aux voyages dont le départ est prévu après le 12 septembre 2024.",
          ],
        },
      ],
      noteBox: {
        paragraphs: [
          "Changement de plans ? Pas de problème ! Avec Moja Ride, vous pouvez annuler votre billet jusqu’à 15 minutes avant le départ et recevoir un remboursement vers votre Portefeuille Moja ou votre moyen de paiement initial.",
        ],
      },
      table: {
        headers: ["Délai avant le départ", "Remboursement (% du prix du billet)"],
        rows: [
          ["Moins de 2 jours", "25%"],
          ["Entre 2 et 6 jours", "50%"],
          ["Entre 7 et 29 jours", "75%"],
          ["30 jours ou plus", "100%"],
        ],
        refundColor: "text-[#ee237c]",
      },
      extras: [
        "• Suppléments (réservation de siège, bagages supplémentaires) : remboursés à 100%.",
        "• Les frais de réservation et de service sont non remboursables.",
      ],
      olderPolicy: {
        label: "Ancienne politique — Applicable aux voyages avec départ entre le 18 décembre 2023 et le 12 septembre 2024",
        table: {
          headers: ["Délai avant le départ", "Remboursement (% du prix du billet)"],
          rows: [
            ["Moins de 1 jour", "25%"],
            ["Entre 1 et 6 jours", "50%"],
            ["Entre 7 et 29 jours", "75%"],
            ["30 jours ou plus", "100%"],
          ],
        },
        extras: "Suppléments (réservation de siège, bagages supplémentaires) : remboursés à 100%. Les frais de réservation et de service sont non remboursables.",
      },
    },
    {
      id: "contact",
      title: "Contact",
      contactBox: {
        name: "Moja Ride SARL",
        address: "Abidjan, Cocody, Cité Sir — Côte d’Ivoire",
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
