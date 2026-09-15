import React from "react";
import {
  PageHeaderAction,
  type PageHeaderActionProps,
} from "./header/page-header";

export type OperatorPageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  icon?: React.ElementType | undefined;
  className?: string | undefined;
};

/**
 * Standard action header for operator dashboard pages.
 * Bridges to the canonical PageHeaderAction archetype.
 */
export function OperatorPageHeader({
  title,
  description,
  actions,
  icon,
  className,
}: OperatorPageHeaderProps) {
  return (
    <PageHeaderAction
      title={title}
      description={description}
      actions={actions}
      icon={icon}
      className={className}
    />
  );
}
