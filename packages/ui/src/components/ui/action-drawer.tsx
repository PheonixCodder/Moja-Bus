"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
} from "./drawer";
import { X } from "lucide-react";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { cn } from "#lib/utils";

export interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

/**
 * ActionDrawer — responsive Base UI drawer (bottom / swipe down).
 * Close uses Base UI `render` (not Radix `asChild`).
 */
export function ActionDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  hideCloseButton = false,
}: ActionDrawerProps) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      swipeDirection="down"
    >
      <DrawerContent
        className={cn(
          "mt-0 flex h-[90vh] w-full flex-col rounded-t-2xl bg-background outline-none md:h-[85vh] data-[swipe-axis=y]:[--drawer-content-max-height:90vh] md:data-[swipe-axis=y]:[--drawer-content-max-height:85vh]",
          className,
        )}
      >
        <DrawerHeader className="border-b px-6 py-4">
          <div className="flex w-full items-start justify-between text-left">
            <div className="space-y-1">
              <DrawerTitle className="text-xl font-semibold">{title}</DrawerTitle>
              {description ? (
                <DrawerDescription>{description}</DrawerDescription>
              ) : null}
            </div>
            {!hideCloseButton ? (
              <DrawerClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-2 shrink-0"
                  />
                }
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DrawerClose>
            ) : null}
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </ScrollArea>

        {footer ? (
          <DrawerFooter className="border-t bg-muted/30 px-6 py-4">
            {footer}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
