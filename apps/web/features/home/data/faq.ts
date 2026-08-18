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
        a: "All prices are displayed in West African CFA Franc (FCFA / XOF), the official currency of Côte d'Ivoire.",
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
        a: "On the web app, you need an internet connection to access your ticket page. We recommend screenshotting your QR code before traveling to areas with poor connectivity. Offline access is available on our mobile app.",
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
        a: "You can cancel your ticket up to 15 minutes before departure on the website, app, by phone, or at a partner agency. Cancellations cannot be processed with the driver. Upon cancellation, eligible refunds are credited immediately to your Moja Wallet or refunded via your original payment channel, calculated as the ticket price minus the applicable cancellation fee.",
      },
      {
        q: "How much will I get back if I cancel?",
        a: "The refund percentage depends on how early you cancel: 30+ days before departure → 100%; 7–29 days → 75%; 2–6 days → 50%; less than 2 days → 25%. Extras like seat reservations and additional luggage are refunded at 100%. The 500 FCFA service fee is non-refundable.",
      },
      {
        q: "How long do refunds take?",
        a: "Moja Wallet refunds are available immediately and can be used for new bookings right away. Cash refunds through payment providers take 3–7 business days.",
      },
      {
        q: "Can I be rebooked instead of cancelling?",
        a: "Yes! If a trip is rescheduled or if you need to travel on an upcoming departure on the same route, the operator can directly rebook your seat onto an upcoming scheduled trip at no penalty.",
      },
    ],
  },
  {
    id: "promotions",
    category: "Promotions & Credits",
    color: "bg-pink-50 text-pink-700",
    items: [
      {
        q: "How do I use a promo code or coupon?",
        a: "You can apply one promo code per booking during checkout. Valid codes will automatically discount your ticket fare. Percentage coupons reduce the base ticket price — service fees are not discounted.",
      },
      {
        q: "What are promo credits and referrals?",
        a: "Promo credits are balances earned from referral rewards, marketing grants, or customer goodwill that apply automatically at checkout. Share your invite link (/r/CODE) with friends to earn credits when they complete their first trip.",
      },
      {
        q: "Do promo credits expire?",
        a: "Promo credits have individual expiration dates depending on the campaign or grant (typically 30–180 days). You can review all active lots and upcoming expiration dates in your Wallet dashboard.",
      },
      {
        q: "Can I combine promo credits with a discount code?",
        a: "Yes! When campaign terms permit stacking, you can combine one promo code with your available promo credits on the same booking.",
      },
      {
        q: "Can I transfer or cash out my promo credits?",
        a: "No. Promo credits are tied to your personal account, non-transferable, and cannot be redeemed for physical cash.",
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
        a: "Visit our operator onboarding page and complete the registration form. You'll need to provide your company details, business registration documents, and bank information. Our team reviews all applications and typically responds within 2–5 business days.",
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
        a: "Sur l'application web, vous avez besoin d'une connexion internet pour accéder à la page de votre billet. Nous vous recommandons de faire une capture d'écran de votre code QR avant de voyager dans les zones à faible connectivité. L'accès hors ligne est disponible sur notre application mobile.",
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
        a: "Vous pouvez annuler votre billet jusqu'à 15 minutes avant le départ sur le site web, l'application, par téléphone ou dans une agence partenaire. Les annulations ne peuvent pas être traitées avec le conducteur. Lors de l'annulation, les remboursements éligibles sont crédités directement sur votre Portefeuille Moja ou remboursés selon votre mode de paiement initial, déduction faite des frais d'annulation applicables.",
      },
      {
        q: "Combien vais-je récupérer si j'annule ?",
        a: "Le pourcentage de remboursement dépend du moment de l'annulation : 30+ jours avant le départ → 100 % ; 7–29 jours → 75 % ; 2–6 jours → 50 % ; moins de 2 jours → 25 %. Les extras comme les réservations de sièges et les bagages supplémentaires sont remboursés à 100 %. Les frais de service de 500 FCFA sont non remboursables.",
      },
      {
        q: "Combien de temps prend un remboursement ?",
        a: "Les remboursements sur le Portefeuille Moja sont immédiats et utilisables pour de nouvelles réservations. Les remboursements en espèces ou virement prennent 3 à 7 jours ouvrés.",
      },
      {
        q: "Puis-je être replacé sur un autre trajet plutôt qu'annuler ?",
        a: "Oui ! Si un trajet est reprogrammé ou si vous souhaitez partir sur un horaire ultérieur de la même ligne, l'opérateur peut directement vous réassigner un siège sur un prochain départ sans pénalité.",
      },
    ],
  },
  {
    id: "promotions",
    category: "Promotions & Crédits",
    color: "bg-pink-50 text-pink-700",
    items: [
      {
        q: "Comment utiliser un code promo ou coupon ?",
        a: "Vous pouvez appliquer un code promotionnel par réservation au moment du paiement. Les codes valides réduisent immédiatement le prix du billet. Les codes en pourcentage s'appliquent au tarif de base du trajet — les frais de service ne sont pas réduits.",
      },
      {
        q: "Que sont les crédits promo et le parrainage ?",
        a: "Les crédits promo sont des soldes promotionnels issus du parrainage, de gestes commerciaux ou d'offres marketing, utilisables directement au paiement. Partagez votre lien (/r/CODE) pour cumuler des crédits dès que vos amis effectuent leur premier voyage.",
      },
      {
        q: "Les crédits promo expirent-ils ?",
        a: "Les crédits promo ont une date de validité selon la campagne ou le motif d'attribution (généralement 30 à 180 jours). Vous pouvez consulter le détail de vos crédits dans votre tableau de bord Portefeuille.",
      },
      {
        q: "Puis-je combiner des crédits promo avec un code promo ?",
        a: "Oui ! Lorsque les règles de la campagne l'autorisent, vous pouvez cumuler un code promo et vos crédits promo disponibles sur la même réservation.",
      },
      {
        q: "Puis-je transférer ou retirer mes crédits promo ?",
        a: "Non. Les crédits promo sont strictement personnels, non transférables et ne peuvent faire l'objet d'un retrait en espèces.",
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
