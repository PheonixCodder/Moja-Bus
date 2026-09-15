"use client";

import React from "react";
import { cn } from "@moja/ui/lib/utils";

/* -------------------------------------------------------------------------------------------------
 * Page Header Primitives (Compound Components)
 * -----------------------------------------------------------------------------------------------*/

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string | undefined;
}

export function PageHeader({ children, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PageHeaderHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string | undefined;
}

export function PageHeaderHeading({
  children,
  className,
  ...props
}: PageHeaderHeadingProps) {
  return (
    <div className={cn("space-y-1 min-w-0", className)} {...props}>
      {children}
    </div>
  );
}

export interface PageHeaderTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  icon?: React.ElementType | undefined;
  iconClassName?: string | undefined;
  className?: string | undefined;
}

export function PageHeaderTitle({
  children,
  icon: Icon,
  iconClassName,
  className,
  ...props
}: PageHeaderTitleProps) {
  return (
    <h1
      className={cn(
        "text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5",
        className,
      )}
      {...props}
    >
      {Icon && (
        <Icon className={cn("size-6 text-primary shrink-0", iconClassName)} />
      )}
      <span className="truncate">{children}</span>
    </h1>
  );
}

export interface PageHeaderDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string | undefined;
}

export function PageHeaderDescription({
  children,
  className,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export interface PageHeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string | undefined;
}

export function PageHeaderActions({
  children,
  className,
  ...props
}: PageHeaderActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 shrink-0 sm:self-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PageHeaderTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string | undefined;
}

export function PageHeaderTabs({
  children,
  className,
  ...props
}: PageHeaderTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 pt-2 border-b border-border/60",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PageHeaderControlsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string | undefined;
}

export function PageHeaderControls({
  children,
  className,
  ...props
}: PageHeaderControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 shrink-0 sm:self-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Archetype 1: PageHeaderAction (Standard Title, Subtitle, Page-Level Actions)
 * -----------------------------------------------------------------------------------------------*/

export interface PageHeaderActionProps {
  title: React.ReactNode;
  description?: React.ReactNode | undefined;
  icon?: React.ElementType | undefined;
  iconClassName?: string | undefined;
  badge?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

export function PageHeaderAction({
  title,
  description,
  icon,
  iconClassName,
  badge,
  actions,
  className,
  children,
}: PageHeaderActionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <PageHeader>
        <PageHeaderHeading>
          <div className="flex items-center gap-3">
            <PageHeaderTitle icon={icon} iconClassName={iconClassName}>
              {title}
            </PageHeaderTitle>
            {badge}
          </div>
          {description && (
            <PageHeaderDescription>{description}</PageHeaderDescription>
          )}
        </PageHeaderHeading>

        {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
      </PageHeader>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Archetype 2: PageHeaderTabbed (Title, Subtitle, Segmented View Tabs, Actions)
 * -----------------------------------------------------------------------------------------------*/

export interface PageHeaderTabbedProps {
  title: React.ReactNode;
  description?: React.ReactNode | undefined;
  icon?: React.ElementType | undefined;
  iconClassName?: string | undefined;
  tabs: React.ReactNode;
  badge?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

export function PageHeaderTabbed({
  title,
  description,
  icon,
  iconClassName,
  tabs,
  badge,
  actions,
  className,
  children,
}: PageHeaderTabbedProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <PageHeader>
        <PageHeaderHeading>
          <div className="flex items-center gap-3">
            <PageHeaderTitle icon={icon} iconClassName={iconClassName}>
              {title}
            </PageHeaderTitle>
            {badge}
          </div>
          {description && (
            <PageHeaderDescription>{description}</PageHeaderDescription>
          )}
        </PageHeaderHeading>

        {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
      </PageHeader>

      <div className="pt-1">{tabs}</div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Archetype 3: PageHeaderControl (Title, Subtitle, Contextual Filter/Period Controls, Actions)
 * -----------------------------------------------------------------------------------------------*/

export interface PageHeaderControlProps {
  title: React.ReactNode;
  description?: React.ReactNode | undefined;
  icon?: React.ElementType | undefined;
  iconClassName?: string | undefined;
  controls?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  badge?: React.ReactNode | undefined;
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

export function PageHeaderControl({
  title,
  description,
  icon,
  iconClassName,
  controls,
  actions,
  badge,
  className,
  children,
}: PageHeaderControlProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <PageHeader>
        <PageHeaderHeading>
          <div className="flex items-center gap-3">
            <PageHeaderTitle icon={icon} iconClassName={iconClassName}>
              {title}
            </PageHeaderTitle>
            {badge}
          </div>
          {description && (
            <PageHeaderDescription>{description}</PageHeaderDescription>
          )}
        </PageHeaderHeading>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {controls && <PageHeaderControls>{controls}</PageHeaderControls>}
          {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
        </div>
      </PageHeader>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Archetype 4: PageHeaderLive (Operational Status Bar, Real-Time Badges, Refresh & Controls)
 * -----------------------------------------------------------------------------------------------*/

export interface PageHeaderLiveProps {
  statusPills?: React.ReactNode | undefined;
  metadata?: React.ReactNode | undefined;
  refreshAction?: React.ReactNode | undefined;
  controls?: React.ReactNode | undefined;
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

export function PageHeaderLive({
  statusPills,
  metadata,
  refreshAction,
  controls,
  className,
  children,
}: PageHeaderLiveProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {statusPills}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          {metadata && <span>{metadata}</span>}
          {refreshAction}
        </div>
      </div>

      {controls && <div>{controls}</div>}
      {children}
    </div>
  );
}
