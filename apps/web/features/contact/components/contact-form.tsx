"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { submitInquirySchema } from "@moja/schemas";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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

type ContactFormValues = z.input<typeof submitInquirySchema>;

export function ContactForm() {
  const t = useTranslations("contact");
  const trpc = useTRPC();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(submitInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: subjectKeys[0],
      message: "",
    },
  });

  const name = watch("name");
  const email = watch("email");
  const phone = watch("phone");
  const subject = watch("subject");
  const message = watch("message");

  // Clear the server-side error as soon as the user edits any field.
  // `error` is intentionally omitted — adding it would clear the error immediately.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (!error) return;
    setError(null);
  }, [name, email, phone, subject, message]);

  const submitMutation = useMutation(
    trpc.contact.submitInquiry.mutationOptions({
      onSuccess: () => setSubmitted(true),
      onError: (err) => setError(err.message || t("submitError")),
    }),
  );

  function onSubmit(values: z.output<typeof submitInquirySchema>) {
    submitMutation.mutate({
      name: values.name,
      email: values.email,
      phone: values.phone,
      subject: t(values.subject as (typeof subjectKeys)[number]),
      message: values.message,
    });
  }

  const inputClasses =
    "w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/30 focus:border-[#ee237c] transition-all text-sm";

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-3xl p-10 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {t("successTitle")}
        </h3>
        <p className="text-slate-500">
          {t.rich("successBody", {
            name: name ?? "",
            email: email ?? "",
            b: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            reset({
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-bold text-slate-700 mb-2"
        >
          {t("labelName")}
        </label>
        <input
          id="name"
          type="text"
          placeholder={t("placeholderName")}
          className={inputClasses}
          aria-invalid={errors.name ? "true" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            {errors.name.message}
          </p>
        )}
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
          type="email"
          placeholder={t("placeholderEmail")}
          className={inputClasses}
          aria-invalid={errors.email ? "true" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            {errors.email.message}
          </p>
        )}
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
          type="tel"
          placeholder={t("placeholderPhone")}
          className={inputClasses}
          aria-invalid={errors.phone ? "true" : undefined}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            {errors.phone.message}
          </p>
        )}
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
          className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/30 focus:border-[#ee237c] transition-all text-sm appearance-none bg-white"
          {...register("subject")}
        >
          {subjectKeys.map((key) => (
            <option key={key} value={key}>
              {t(key)}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            {errors.subject.message}
          </p>
        )}
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
          rows={5}
          placeholder={t("placeholderMessage")}
          className={`${inputClasses} resize-none`}
          aria-invalid={errors.message ? "true" : undefined}
          {...register("message")}
        />
        {errors.message && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            {errors.message.message}
          </p>
        )}
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
