"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";

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
  const trpc = useTRPC();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: subjectKeys[0],
    message: "",
  });

  const submitMutation = useMutation(
    trpc.contact.submitInquiry.mutationOptions({
      onSuccess: () => setSubmitted(true),
      onError: (err) => setError(err.message || t("submitError")),
    }),
  );

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      subject: t(form.subject),
      message: form.message,
    });
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-3xl p-10 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {t("successTitle")}
        </h3>
        <p className="text-slate-500">
          {t.rich("successBody", {
            name: form.name,
            email: form.email,
            b: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setForm({
              name: "",
              email: "",
              phone: "",
              subject: subjectKeys[0],
              message: "",
            });
          }}
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
        <label
          htmlFor="name"
          className="block text-sm font-bold text-slate-700 mb-2"
        >
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
        <label
          htmlFor="email"
          className="block text-sm font-bold text-slate-700 mb-2"
        >
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
        <label
          htmlFor="phone"
          className="block text-sm font-bold text-slate-700 mb-2"
        >
          {t("labelPhone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder={t("placeholderPhone")}
          className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/30 focus:border-[#ee237c] transition-all text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-bold text-slate-700 mb-2"
        >
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
        <label
          htmlFor="message"
          className="block text-sm font-bold text-slate-700 mb-2"
        >
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

      {error && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="w-full flex items-center justify-center gap-2 bg-[#ee237c] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#d01867] transition-all active:scale-95 shadow-lg shadow-pink-500/20 disabled:opacity-60 disabled:pointer-events-none"
      >
        <Send className="h-4 w-4" />
        {submitMutation.isPending ? t("submitting") : t("submitButton")}
      </button>
    </form>
  );
}
