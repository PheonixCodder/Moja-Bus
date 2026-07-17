import { cn } from "@moja/ui/lib/utils";

interface PageTitleHeaderProps {
  title: string;
  description: string;
  className?: string;
}

export function PageTitleHeader({ title, description, className }: PageTitleHeaderProps) {
  return (
    <div className={cn("space-y-1.5 mb-8", className)}>
      <h1 className="text-2xl font-normal text-slate-900">
        {title}
      </h1>
      <p className="text-xs text-slate-500 max-w-2xl font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
}
