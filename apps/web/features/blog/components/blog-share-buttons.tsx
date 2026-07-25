"use client";

import { useTranslations } from "next-intl";
import { Link2, Twitter } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { toast } from "sonner";

interface BlogShareButtonsProps {
  title: string;
}

export function BlogShareButtons({ title }: BlogShareButtonsProps) {
  const t = useTranslations("blog");
  const handleCopyLink = async () => {
    if (typeof window !== "undefined" && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t("linkCopied"));
      } catch (err) {
        toast.error(t("copyFailed"));
      }
    }
  };

  const handleTwitterShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`;
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        onClick={handleCopyLink}
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-800 border-slate-200"
      >
        <Link2 className="size-3.5" />
        <span className="sr-only">{t("copyLinkSr")}</span>
      </Button>
      <Button
        onClick={handleTwitterShare}
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 text-slate-400 hover:text-sky-500 border-slate-200"
      >
        <Twitter className="size-3.5" />
        <span className="sr-only">{t("shareTwitterSr")}</span>
      </Button>
    </div>
  );
}
