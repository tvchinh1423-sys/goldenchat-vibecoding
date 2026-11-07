"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisualViewport } from "@/lib/chat/use-visual-viewport";
export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  const viewportRef = useVisualViewport<HTMLDivElement>();
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm" />
      <DialogPrimitive.Content
        ref={viewportRef}
        className={cn(
          "fixed left-1/2 top-[calc(var(--chat-top,0px)_+_(var(--chat-height,100dvh)_+_var(--safe-top)_-_var(--safe-bottom))*0.5)] z-50 max-h-[min(90dvh,calc(var(--chat-height,100dvh)_-_2rem_-_var(--safe-top)_-_var(--safe-bottom)))] w-[calc(100%_-_2*max(1rem,var(--safe-left),var(--safe-right)))] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border bg-white p-4 shadow-xl focus:outline-none sm:p-6",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-2 top-[calc(0.5rem+var(--dialog-top-inset,0px))] grid h-11 w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted sm:right-3">
          <X className="h-4 w-4" />
          <span className="sr-only">Đóng</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
