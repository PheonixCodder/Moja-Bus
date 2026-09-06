"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { submitInquirySchema } from "@moja/schemas";
import { Button } from "@moja/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@moja/ui/components/ui/field";
import { Input } from "@moja/ui/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@moja/ui/components/ui/native-select";
import { Textarea } from "@moja/ui/components/ui/textarea";
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
    trpc.contact.submitInquiry.mutationOptions(),
  );

  async function onSubmit(values: ContactFormValues) {
    setError(null);
    await submitMutation.mutateAsync({
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      subject: values.subject,
      message: values.message,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-3xl p-10 text-center">
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          {t("successTitle")}
        </h3>
        <p className="text-muted-foreground">
          {t.rich("successBody", {
            name: name ?? "",
            email: email ?? "",
            b: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}
        </p>
        <Button
          type="button"
          variant="ghost"
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
          className="mt-6 text-sm text-primary font-bold hover:underline hover:bg-transparent h-auto p-0"
        >
          {t("successNewMessage")}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <FieldGroup className="gap-5">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="name" className="font-bold">
            {t("labelName")}
          </FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder={t("placeholderName")}
            className="h-12 rounded-2xl border-border text-sm"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
          {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
        </Field>

        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email" className="font-bold">
            {t("labelEmail")}
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder={t("placeholderEmail")}
            className="h-12 rounded-2xl border-border text-sm"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <FieldError>{errors.email.message}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={errors.phone ? true : undefined}>
          <FieldLabel htmlFor="phone" className="font-bold">
            {t("labelPhone")}
          </FieldLabel>
          <Input
            id="phone"
            type="tel"
            placeholder={t("placeholderPhone")}
            className="h-12 rounded-2xl border-border text-sm"
            aria-invalid={errors.phone ? true : undefined}
            {...register("phone")}
          />
          {errors.phone ? (
            <FieldError>{errors.phone.message}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={errors.subject ? true : undefined}>
          <FieldLabel htmlFor="subject" className="font-bold">
            {t("labelSubject")}
          </FieldLabel>
          <NativeSelect
            id="subject"
            className="h-12 w-full min-w-full rounded-2xl text-sm [&_select]:w-full"
            aria-invalid={errors.subject ? true : undefined}
            {...register("subject")}
          >
            {subjectKeys.map((key) => (
              <NativeSelectOption key={key} value={key}>
                {t(key)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.subject ? (
            <FieldError>{errors.subject.message}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={errors.message ? true : undefined}>
          <FieldLabel htmlFor="message" className="font-bold">
            {t("labelMessage")}
          </FieldLabel>
          <Textarea
            id="message"
            rows={5}
            placeholder={t("placeholderMessage")}
            className="resize-none rounded-2xl border-border text-sm"
            aria-invalid={errors.message ? true : undefined}
            {...register("message")}
          />
          {errors.message ? (
            <FieldError>{errors.message.message}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>

      {error ? (
        <p className="text-sm font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitMutation.isPending}
        className="w-full h-12 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-60 disabled:pointer-events-none"
      >
        <Send className="h-4 w-4" />
        {submitMutation.isPending ? t("submitting") : t("submitButton")}
      </Button>
    </form>
  );
}
