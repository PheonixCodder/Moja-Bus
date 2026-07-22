"use client";

import * as React from "react";
import { useMediaQuery } from "../../hooks/use-media-query";
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
 * ActionDrawer is a responsive wrapper around Vaul.
 * On desktop (> 768px), it slides from the right as a side panel.
 * On mobile, it slides from the bottom as a standard bottom sheet.
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
      direction="bottom"
    >
      <DrawerContent className={cn(
        "flex flex-col h-[90vh] md:h-[85vh] w-full mt-0 bg-background rounded-t-2xl outline-none",
        className
      )}>
        <DrawerHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between w-full text-left">
            <div className="space-y-1">
              <DrawerTitle className="text-xl font-semibold">{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </div>
            {!hideCloseButton && (
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="shrink-0 -mr-2">
                  <X className="w-4 h-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DrawerClose>
            )}
          </div>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-6 py-6 overflow-y-auto">
          {children}
        </ScrollArea>

        {footer && (
          <DrawerFooter className="px-6 py-4 border-t bg-muted/30">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
