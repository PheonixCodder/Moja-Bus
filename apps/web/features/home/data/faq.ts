interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  category: string;
  color: string;
  items: FAQItem[];
}

const en: FAQCategory[] = [
  {
    id: "booking",
    category: "Booking",
    color: "bg-blue-50 text-blue-700",
    items: [
      {
        q: "How do I book a bus ticket on Moja Ride?",
        a: "Search for your route on the home page or the search page. Enter your departure city, destination, date, and number of passengers. Choose a trip from the results, select your seat(s), enter passenger details, and complete payment. Your digital ticket will be available instantly.",
      },
      {
        q: "Can I book for multiple passengers?",
        a: "Yes! You can book for up to 6 passengers in a single booking. After selecting your seats, you can enter individual passenger details for each seat — or use your saved passenger list for faster checkout.",
      },
      {
        q: "How long do I have to complete my booking?",
        a: "Seats are held for 10 minutes once you start checkout. If payment isn't completed within that window, the seats are released and you'll need to start again. We recommend having your payment method ready before selecting seats.",
      },
      {
        q: "Can I book tickets in advance?",
        a: "Yes, you can book tickets for any future date that has available trips. We recommend booking as early as possible on popular routes, especially during holidays and weekends.",
      },
    ],
  },
  {
    id: "payment",
    category: "Payment",
    color: "bg-green-50 text-green-700",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "Online: Mobile money and wallets (Wave, Orange Money, MTN MoMo) and bank cards (Mastercard / Visa / Amex) via Paystack. At points of sale: cash is always accepted, and card payments may also be available depending on location. On board: cash only.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. Moja Ride never stores your card or Mobile Money credentials. All payments are processed by Paystack, a PCI-DSS Level 1 certified payment processor, or Wave. We use HTTPS everywhere and your data is always encrypted.",
      },
      {
        q: "What currency are prices shown in?",
        a: "All prices are displayed in West African CFA Franc (FCFA / XOF), the official currency of C\u00f4te d'Ivoire.",
      },
      {
        q: "Is there a booking fee?",
        a: "A service fee of 500 FCFA is added per order (not per ticket) at checkout. This fee helps us operate the platform, the booking management tools, and provide customer support. The final price is always shown before you confirm payment. Service fees are non-refundable in the event of a cancellation.",
      },
    ],
  },
  {
    id: "tickets-travel",
    category: "Tickets & Travel",
    color: "bg-purple-50 text-purple-700",
    items: [
      {
        q: "How do I access my digital ticket?",
        a: 'After completing your booking, your digital ticket is available in your dashboard under "My Tickets". Each ticket has a QR code that operators scan at boarding. You can also access tickets directly at mojaride.com/tickets/[your-token].',
      },
      {
        q: "What happens at boarding?",
        a: "Show your QR code (on your phone or printed) to the operator at the terminal. They will scan it to check you in. Make sure to arrive at least 15 minutes before departure.",
      },
      {
        q: "Can I access my ticket offline?",
        a: "On the web app, you need an internet connection to access your ticket page. We recommend screenshotting your QR code before traveling to areas with poor connectivity. Offline access is coming to our mobile app.",
      },
    ],
  },
  {
    id: "cancellations",
    category: "Cancellations & Refunds",
    color: "bg-orange-50 text-orange-700",
    items: [
      {
        q: "What is the cancellation policy?",
        a: "You can cancel your ticket up to 15 minutes before departure on the website, app, by phone, or at a partner agency. Cancellations cannot be processed with the driver. Upon cancellation, you receive a non-refundable voucher valid for 12 months, calculated as the ticket price minus the applicable cancellation fee.",
      },
      {
        q: "How much will I get back if I cancel?",
        a: "The refund percentage depends on how early you cancel: 30+ days before departure \u2192 100%; 7\u201329 days \u2192 75%; 2\u20136 days \u2192 50%; less than 2 days \u2192 25%. Extras like seat reservations and additional luggage are refunded at 100%. The 500 FCFA service fee is non-refundable.",
      },
      {
        q: "How long do refunds take?",
        a: "Cancellation vouchers are issued immediately to your account and can be used for future bookings. If you are entitled to a monetary refund (e.g., due to a Moja Ride fault), processing takes 3\u20137 business days.",
      },
      {
        q: "Can I modify my ticket instead of cancelling?",
        a: "Yes. You can modify the traveler name, date, or time of your trip up to 15 minutes before departure via the website, app, phone, or partner agency. If the new journey costs more, you pay the difference. If it costs less, you receive a non-refundable 12-month voucher for the difference. A modification fee applies per trip per passenger (except phone number changes, which are free).",
      },
    ],
  },
  {
    id: "vouchers",
    category: "Vouchers & Promotions",
    color: "bg-pink-50 text-pink-700",
    items: [
      {
        q: "How do I use a voucher?",
        a: "You can apply a maximum of one voucher per booking, online or at a partner agency. Monetary vouchers can be applied to the entire cart. Discount or free-trip vouchers apply to the ticket price only \u2014 service fees and add-ons (luggage, bicycle) are not discounted.",
      },
      {
        q: "Do vouchers expire?",
        a: "Discount codes are valid for 3 months from issue. Cancellation vouchers are valid for 12 months. Vouchers issued free of charge for marketing purposes expire after the first completed booking.",
      },
      {
        q: "Can I use multiple vouchers on one booking?",
        a: "You can combine one promo code (or an auto-applied campaign), one monetary voucher, and available promo credits on the same booking when the campaign rules allow stacking. Percentage coupons reduce ticket fare only — the service/convenience fee is not discounted by percent-off codes. Cash refunds of vouchers are not available.",
      },
      {
        q: "What are promo credits and referrals?",
        a: "Promo credits are wallet-like balances (for example from referral rewards) that apply at checkout before you pay. Referral rewards may be delayed until a referee completes a paid trip, and recurring credits follow the active referral program rules. Credits and vouchers are non-transferable and cannot be cashed out.",
      },
      {
        q: "Can I sell or transfer my voucher?",
        a: "No. Commercial resale of vouchers is strictly prohibited and may result in ticket blocking and/or legal action. Personal vouchers are non-transferable. Cash refunds of vouchers are not possible.",
      },
    ],
  },
  {
    id: "operators",
    category: "Operators",
    color: "bg-teal-50 text-teal-700",
    items: [
      {
        q: "How do I become a bus operator on Moja Ride?",
        a: "Visit our operator onboarding page and complete the registration form. You'll need to provide your company details, business registration documents, and bank information. Our team reviews all applications and typically responds within 2\u20135 business days.",
      },
      {
        q: "How does the commission work for operators?",
        a: "Moja Ride charges a 5% platform commission on each completed booking. Operators receive 95% of the ticket price, minus any applicable payment gateway fees. Detailed earnings are available in the operator dashboard.",
      },
      {
        q: "Can price comparison platforms list Moja Ride fares?",
        a: "Yes, price comparison services may enter into a separate commercial agreement with Moja Ride authorizing them to receive, process, and publish Moja Ride prices and schedules. Please contact us at legal@mojaride.com for more information.",
      },
    ],
  },
];

const fr: FAQCategory[] = [
  {
    id: "booking",
    category: "Réservation",
    color: "bg-blue-50 text-blue-700",
    items: [
      {
        q: "Comment réserver un billet de bus sur Moja Ride ?",
        a: "Recherchez votre itinéraire sur la page d'accueil ou la page de recherche. Saisissez votre ville de départ, votre destination, la date et le nombre de passagers. Choisissez un trajet parmi les résultats, sélectionnez vos sièges, saisissez les détails des passagers et effectuez le paiement. Votre billet numérique sera disponible instantanément.",
      },
      {
        q: "Puis-je réserver pour plusieurs passagers ?",
        a: "Oui ! Vous pouvez réserver jusqu'à 6 passagers en une seule réservation. Après avoir sélectionné vos sièges, vous pouvez saisir les détails de chaque passager individuellement ou utiliser votre liste de passagers enregistrés pour un paiement plus rapide.",
      },
      {
        q: "Combien de temps ai-je pour finaliser ma réservation ?",
        a: "Les sièges sont réservés pendant 10 minutes une fois que vous commencez le paiement. Si le paiement n'est pas effectué dans ce délai, les sièges sont libérés et vous devrez recommencer. Nous vous recommandons d'avoir votre moyen de paiement prêt avant de sélectionner les sièges.",
      },
      {
        q: "Puis-je réserver des billets à l'avance ?",
        a: "Oui, vous pouvez réserver des billets pour toute date future où des trajets sont disponibles. Nous vous recommandons de réserver le plus tôt possible sur les itinéraires populaires, surtout pendant les vacances et les week-ends.",
      },
    ],
  },
  {
    id: "payment",
    category: "Paiement",
    color: "bg-green-50 text-green-700",
    items: [
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "En ligne : Mobile money et portefeuilles électroniques (Wave, Orange Money, MTN MoMo) et cartes bancaires (Mastercard / Visa / Amex) via Paystack. Aux points de vente : l'espèce est toujours acceptée, et les paiements par carte peuvent également être disponibles selon le lieu. À bord : espèces uniquement.",
      },
      {
        q: "Mes informations de paiement sont-elles sécurisées ?",
        a: "Absolument. Moja Ride ne stocke jamais vos informations de carte bancaire ou de Mobile Money. Tous les paiements sont traités par Paystack, un processeur de paiement certifié PCI-DSS Niveau 1, ou Wave. Nous utilisons HTTPS partout et vos données sont toujours cryptées.",
      },
      {
        q: "Dans quelle devise les prix sont-ils affichés ?",
        a: "Tous les prix sont affichés en Franc CFA d'Afrique de l'Ouest (FCFA / XOF), la devise officielle de la Côte d'Ivoire.",
      },
      {
        q: "Y a-t-il des frais de réservation ?",
        a: "Des frais de service de 500 FCFA sont ajoutés par commande (pas par billet) lors du paiement. Ces frais nous aident à exploiter la plateforme, les outils de gestion des réservations et à fournir un support client. Le prix final est toujours affiché avant de confirmer le paiement. Les frais de service ne sont pas remboursables en cas d'annulation.",
      },
    ],
  },
  {
    id: "tickets-travel",
    category: "Billets & Voyage",
    color: "bg-purple-50 text-purple-700",
    items: [
      {
        q: "Comment accéder à mon billet numérique ?",
        a: 'Après avoir finalisé votre réservation, votre billet numérique est disponible dans votre tableau de bord sous "Mes billets". Chaque billet possède un code QR que les opérateurs scannent à l\'embarquement. Vous pouvez également accéder aux billets directement sur mojaride.com/tickets/[votre-code].',
      },
      {
        q: "Que se passe-t-il à l'embarquement ?",
        a: "Présentez votre code QR (sur votre téléphone ou imprimé) à l'opérateur au terminal. Il le scannera pour vous enregistrer. Assurez-vous d'arriver au moins 15 minutes avant le départ.",
      },
      {
        q: "Puis-je accéder à mon billet hors ligne ?",
        a: "Sur l'application web, vous avez besoin d'une connexion internet pour accéder à la page de votre billet. Nous vous recommandons de faire une capture d'écran de votre code QR avant de voyager dans les zones à faible connectivité. L'accès hors ligne sera bientôt disponible sur notre application mobile.",
      },
    ],
  },
  {
    id: "cancellations",
    category: "Annulations & Remboursements",
    color: "bg-orange-50 text-orange-700",
    items: [
      {
        q: "Quelle est la politique d'annulation ?",
        a: "Vous pouvez annuler votre billet jusqu'à 15 minutes avant le départ sur le site web, l'application, par téléphone ou dans une agence partenaire. Les annulations ne peuvent pas être traitées avec le conducteur. Lors de l'annulation, vous recevez un avoir non remboursable valable 12 mois, calculé sur le prix du billet moins les frais d'annulation applicables.",
      },
      {
        q: "Combien vais-je récupérer si j'annule ?",
        a: "Le pourcentage de remboursement dépend du moment de l'annulation : 30+ jours avant le départ → 100 % ; 7–29 jours → 75 % ; 2–6 jours → 50 % ; moins de 2 jours → 25 %. Les extras comme les réservations de sièges et les bagages supplémentaires sont remboursés à 100 %. Les frais de service de 500 FCFA sont non remboursables.",
      },
      {
        q: "Combien de temps prend un remboursement ?",
        a: "Les avoirs d'annulation sont émis immédiatement sur votre compte et peuvent être utilisés pour de futures réservations. Si vous avez droit à un remboursement monétaire (par exemple en raison d'une erreur de Moja Ride), le traitement prend 3 à 7 jours ouvrés.",
      },
      {
        q: "Puis-je modifier mon billet au lieu d'annuler ?",
        a: "Oui. Vous pouvez modifier le nom du voyageur, la date ou l'heure de votre voyage jusqu'à 15 minutes avant le départ via le site web, l'application, par téléphone ou dans une agence partenaire. Si le nouveau trajet coûte plus cher, vous payez la différence. S'il coûte moins cher, vous recevez un avoir non remboursable de 12 mois pour la différence. Des frais de modification s'appliquent par trajet et par passager (à l'exception des changements de numéro de téléphone, qui sont gratuits).",
      },
    ],
  },
  {
    id: "vouchers",
    category: "Avoirs & Promotions",
    color: "bg-pink-50 text-pink-700",
    items: [
      {
        q: "Comment utiliser un avoir ?",
        a: "Vous pouvez appliquer un maximum d'un avoir par réservation, en ligne ou dans une agence partenaire. Les avoirs monétaires peuvent être appliqués à l'ensemble du panier. Les avoirs de réduction ou de voyage gratuit s'appliquent uniquement au prix du billet — les frais de service et les suppléments (bagages, vélo) ne sont pas réduits.",
      },
      {
        q: "Les avoirs expirent-ils ?",
        a: "Les codes de réduction sont valables 3 mois à compter de leur émission. Les avoirs d'annulation sont valables 12 mois. Les avoirs émis gratuitement à des fins marketing expirent après la première réservation effectuée.",
      },
      {
        q: "Puis-je utiliser plusieurs avoirs sur une seule réservation ?",
        a: "Vous pouvez combiner un code promo (ou une campagne auto-appliquée), un avoir monétaire et vos crédits promo disponibles sur la même réservation si les règles de la campagne le permettent. Les codes en pourcentage réduisent uniquement le prix du billet — les frais de service ne sont pas réduits par un pourcentage. Les avoirs ne sont pas remboursables en espèces.",
      },
      {
        q: "Que sont les crédits promo et le parrainage ?",
        a: "Les crédits promo sont des soldes utilisables au paiement (par exemple issus du parrainage). Les récompenses de parrainage peuvent être différées jusqu'à ce que le filleul termine un trajet payé ; les crédits récurrents suivent le programme actif. Crédits et avoirs sont non transférables et non remboursables en espèces.",
      },
      {
        q: "Puis-je vendre ou transférer mon avoir ?",
        a: "Non. La revente commerciale des avoirs est strictement interdite et peut entraîner le blocage du billet et/ou des poursuites judiciaires. Les avoirs personnels sont non transférables. Le remboursement en espèces des avoirs n'est pas possible.",
      },
    ],
  },
  {
    id: "operators",
    category: "Opérateurs",
    color: "bg-teal-50 text-teal-700",
    items: [
      {
        q: "Comment devenir opérateur de bus sur Moja Ride ?",
        a: "Visitez notre page d'inscription opérateur et remplissez le formulaire d'enregistrement. Vous devrez fournir les détails de votre entreprise, vos documents d'enregistrement commercial et vos informations bancaires. Notre équipe examine toutes les demandes et répond généralement sous 2 à 5 jours ouvrés.",
      },
      {
        q: "Comment fonctionne la commission pour les opérateurs ?",
        a: "Moja Ride prélève une commission de plateforme de 5 % sur chaque réservation effectuée. Les opérateurs reçoivent 95 % du prix du billet, moins les éventuels frais de passerelle de paiement. Les revenus détaillés sont disponibles dans le tableau de bord opérateur.",
      },
      {
        q: "Les comparateurs de prix peuvent-ils afficher les tarifs Moja Ride ?",
        a: "Oui, les services de comparaison de prix peuvent conclure un accord commercial distinct avec Moja Ride les autorisant à recevoir, traiter et publier les prix et horaires de Moja Ride. Veuillez nous contacter à legal@mojaride.com pour plus d'informations.",
      },
    ],
  },
];

export function getFaq(locale: string): FAQCategory[] {
  return locale === "fr" ? fr : en;
}
