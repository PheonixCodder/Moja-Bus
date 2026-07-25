"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle } from "lucide-react";

const subjectKeys = [
  "subjectGeneral",
  "subjectBooking",
  "subjectPayment",
  "subjectTicket",
  "subjectOperator",
  "subjectPartnership",
  "subjectOther",
] as const;

export function ContactForm() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: subjectKeys[0]!,
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mailto = `mailto:support@mojaride.com?subject=${encodeURIComponent(t(form.subject))}&body=${encodeURIComponent(`${t("labelName")}: ${form.name}\n${t("labelEmail")}: ${form.email}\n\n${form.message}`)}`;
    window.open(mailto, "_blank");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-3xl p-10 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">{t("successTitle")}</h3>
        <p className="text-slate-500">
          {t.rich("successBody", { email: form.email, b: (chunks) => <span className="font-semibold">{chunks}</span> })}
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm text-[#ee237c] font-bold hover:underline"
        >
          {t("successNewMessage")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
          {t("labelName")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          placeholder={t("placeholderName")}
          className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/30 focus:border-[#ee237c] transition-all text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
          {t("labelEmail")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder={t("placeholderEmail")}
          className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/30 focus:border-[#ee237c] transition-all text-sm"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-bold text-slate-700 mb-2">
          {t("labelSubject")}
        </label>
        <select
          id="subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/30 focus:border-[#ee237c] transition-all text-sm appearance-none bg-white"
        >
          {subjectKeys.map((key) => (
            <option key={key} value={key}>
              {t(key)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">
          {t("labelMessage")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={handleChange}
          placeholder={t("placeholderMessage")}
          className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/30 focus:border-[#ee237c] transition-all text-sm resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-[#ee237c] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#d01867] transition-all active:scale-95 shadow-lg shadow-pink-500/20"
      >
        <Send className="h-4 w-4" />
        {t("submitButton")}
      </button>
    </form>
  );
}
