"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export function LangSetter() {
  const params = useParams();
  const locale = params["locale"] as string;

  useEffect(() => {
    if (locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
