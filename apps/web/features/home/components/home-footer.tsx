import Link from "next/link";
import { Globe, Mail, Camera } from "lucide-react";

const services = [
  { label: "Book a Bus", href: "/search" },
  { label: "VIP Destinations", href: "/search" },
  { label: "Corporate Offers", href: "/contact" },
  { label: "Become a Partner", href: "/dashboard/operator/onboarding" },
];

const support = [
  { label: "Help Center", href: "/help" },
  { label: "Payment & Security", href: "/help#payment" },
  { label: "Cancellations", href: "/help#cancellations" },
  { label: "Contact Us", href: "/contact" },
];

const company = [
  { label: "About Moja Ride", href: "/about" },
  { label: "Our Operators", href: "/operators" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

const socials = [
  { icon: Globe, href: "#", label: "Website" },
  { icon: Mail, href: "#", label: "Email" },
  { icon: Camera, href: "#", label: "Instagram" },
];

export function HomeFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="text-2xl font-bold text-[#ee237c] block mb-5">
              Moja Ride
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              The premium platform for intercity transport in Côte d&apos;Ivoire. Ease, comfort,
              and security on every journey.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#ee237c] hover:bg-[#ee237c] hover:text-white transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Services</h4>
            <ul className="space-y-4">
              {services.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-[#ee237c] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Support</h4>
            <ul className="space-y-4">
              {support.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-[#ee237c] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4">
              {company.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-[#ee237c] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Moja Ride Inc. All rights reserved. The adventure awaits you.
          </p>
          <div className="flex gap-8">
            {[
              { label: "Terms of Use", href: "/terms" },
              { label: "Privacy", href: "/privacy" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-bold text-slate-400 hover:text-[#ee237c] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
