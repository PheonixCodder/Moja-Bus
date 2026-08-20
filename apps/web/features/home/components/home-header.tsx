"use client";

import { useState, useEffect, useRef } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown, LogOut, HelpCircle,
  LayoutDashboard, Settings, MapPin, Ticket, Users,
  Gauge, ShieldCheck
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { signOut } from "@/lib/auth-client";
import { LocaleSwitcher } from "@/components/locale-switcher";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import Image from "next/image";
import type { User as AuthUser } from "@/lib/auth-client";

const POPULAR_ROUTES = [
  { from: "Abidjan", to: "Bouaké" },
  { from: "Abidjan", to: "Yamoussoukro" },
  { from: "Abidjan", to: "San-Pédro" },
  { from: "Abidjan", to: "Korhogo" },
  { from: "Abidjan", to: "Man" },
  { from: "Abidjan", to: "Daloa" },
  { from: "Bouaké", to: "Abidjan" },
  { from: "Yamoussoukro", to: "Abidjan" },
  { from: "Korhogo", to: "Bouaké" },
  { from: "Daloa", to: "Man" },
];

interface HomeHeaderProps {
  user?: AuthUser | undefined;
}

export function HomeHeader({ user }: HomeHeaderProps) {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const pathname = usePathname();
  const destRef = useRef<HTMLDivElement>(null);
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]!);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDestOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setDestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const isHome = pathname === "/";
  const hasLightText = isHome && !scrolled && !mobileOpen;
  const hasTransparentBg = !scrolled && !mobileOpen;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          !hasTransparentBg
            ? "bg-white/95 backdrop-blur-xl shadow-sm border-slate-200/50"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left Section: Logo & Nav */}
            <div className="flex items-center gap-6 lg:gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Moja Ride"
                  width={140}
                  height={35}
                  className="object-contain transition-all duration-300"
                  priority
                />
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-2 lg:gap-4 border-l border-slate-300 pl-6 lg:pl-8">
                {/* Destinations dropdown */}
                <div ref={destRef} className="relative">
                  <button
                    onClick={() => setDestOpen(!destOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                  >
                    <MapPin className="w-4 h-4" />
                    {t("popularRoutes")}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", destOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {destOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[440px] bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden"
                      >
                        <div className="p-5">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">{t("popularRoutes")}</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            {POPULAR_ROUTES.map((r) => (
                              <Link
                                key={`${r.from}-${r.to}`}
                                href={todayStr ? `/search?from=${r.from}&to=${r.to}&date=${todayStr}` : `/search?from=${r.from}&to=${r.to}`}
                                className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200"
                              >
                                <span className="text-sm font-semibold text-slate-700 group-hover:text-[#ee237c] transition-colors duration-200">
                                  {r.from} → {r.to}
                                </span>
                                <span className="text-xs text-[#ee237c] opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 font-bold shrink-0">
                                  →
                                </span>
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-slate-100 mt-4 pt-3">
                            <Link
                              href="/search"
                              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#ee237c]/5 text-[#ee237c] transition-colors text-sm font-bold"
                            >
                              {t("viewAllRoutes")}
                              <span>→</span>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/blog"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                >
                  {t("blog")}
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                >
                  {t("contact")}
                </Link>
                <Link
                  href="/become-a-partner"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                >
                  {t("joinAsOperator")}
                </Link>
              </div>
            </div>

            {/* Right Section: Auth */}
            <div className="hidden md:flex items-center gap-3">
              <LocaleSwitcher
                className={hasLightText ? "text-white hover:bg-white/10" : ""}
              />
              {user ? (
                <Popover>
                  <PopoverTrigger className="flex items-center gap-2 outline-none cursor-pointer ml-2">
                    <Avatar className={cn("h-10 w-10 rounded-full border-2 shadow-sm transition-transform hover:scale-105", hasLightText ? "border-white/30" : "border-slate-100")}>
                      <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 rounded-2xl border-slate-100 shadow-xl p-2 bg-white"
                    align="end"
                    sideOffset={8}
                  >
                    <div className="flex items-center gap-3 px-3 py-3 text-sm border-b border-slate-50 mb-2">
                      <Avatar className="h-10 w-10 rounded-full">
                        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                        <AvatarFallback className="bg-[#ee237c]/10 text-[#ee237c] font-semibold text-sm">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-[#1e293b] truncate">
                          {user.name}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">
                        <LayoutDashboard className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-sm">{t("dashboard")}</span>
                      </Link>
                      <Link href="/dashboard/bookings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">
                        <Ticket className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-sm">{t("bookings")}</span>
                      </Link>
                      <Link href="/dashboard/passengers" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-sm">{t("passengers")}</span>
                      </Link>
                      <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">
                        <Settings className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-sm">{t("settings")}</span>
                      </Link>
                    </div>
                    {(user?.role === "OPERATOR" || user?.role === "ADMIN") && (
                      <>
                        <div className="h-px bg-slate-100 my-2" />
                        <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          {t("switchDashboard")}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Link href="/dashboard/operator" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">
                            <Gauge className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-sm">{t("operatorDashboard")}</span>
                          </Link>
                        </div>
                      </>
                    )}
                    {user?.role === "ADMIN" && (
                      <div className="flex flex-col gap-1">
                        <Link href="/dashboard/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">
                          <ShieldCheck className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-sm">{t("adminDashboard")}</span>
                        </Link>
                      </div>
                    )}
                    <div className="h-px bg-slate-100 my-2" />
                    <div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium text-sm">{t("logout")}</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-5 py-2 rounded-full text-sm font-semibold bg-[#ee237c] text-white hover:bg-[#c71d65] hover:shadow-md transition-all shadow-sm"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/login"
                    className="px-5 py-2 rounded-full text-sm font-semibold bg-[#ee237c] text-white hover:bg-[#c71d65] hover:shadow-md transition-all shadow-sm"
                  >
                    {t("signup")}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center gap-3">
              {user && (
                <Avatar className={cn("h-8 w-8 rounded-full border-2", hasLightText ? "border-white/30" : "border-slate-100")}>
                  <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  "p-2 -mr-2 rounded-lg transition-colors",
                  hasLightText ? "text-white" : "text-slate-800"
                )}
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden shadow-xl"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                <Link
                  href="/search"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                >
                  <MapPin className="w-5 h-5 text-slate-400" />
                  {t("exploreDestinations")}
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                >
                  <HelpCircle className="w-5 h-5 text-slate-400" />
                  {t("helpSupport")}
                </Link>

                <div className="h-px bg-slate-100 my-1" />

                {user ? (
                  <>
                    <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <LayoutDashboard className="w-5 h-5 text-slate-400" />
                      {t("dashboard")}
                    </Link>
                    <Link href="/dashboard/bookings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <Ticket className="w-5 h-5 text-slate-400" />
                      {t("myBookings")}
                    </Link>
                    <Link href="/dashboard/passengers" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <Users className="w-5 h-5 text-slate-400" />
                      {t("passengers")}
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <Settings className="w-5 h-5 text-slate-400" />
                      {t("settings")}
                    </Link>
                    {(user?.role === "OPERATOR" || user?.role === "ADMIN") && (
                      <>
                        <div className="h-px bg-slate-100 my-1" />
                        <Link href="/dashboard/operator" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                          <Gauge className="w-5 h-5 text-slate-400" />
                          {t("operatorDashboard")}
                        </Link>
                      </>
                    )}
                    {user?.role === "ADMIN" && (
                      <Link href="/dashboard/admin" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                        <ShieldCheck className="w-5 h-5 text-slate-400" />
                        {t("adminDashboard")}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 p-3 mt-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      {t("logout")}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex justify-center p-3 rounded-xl bg-[#ee237c] hover:bg-[#c71d65] text-white font-semibold transition-colors w-full mt-2"
                  >
                    {t("logInOrSignUp")}
                  </Link>
                )}

                <div className="h-px bg-slate-100 my-1" />
                <LocaleSwitcher className="w-full justify-start [&_span]:inline" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
