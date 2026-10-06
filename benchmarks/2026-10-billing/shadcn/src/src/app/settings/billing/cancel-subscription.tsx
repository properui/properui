"use client";

import { useState } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type CancelSubscriptionProps = {
    planName: string;
    endsOn: string;
};

// Replace the body of this function with a call to your billing backend.
async function cancelSubscription() {
    await new Promise((resolve) => setTimeout(resolve, 800));
}

export function CancelSubscription({ planName, endsOn }: CancelSubscriptionProps) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function confirm() {
        setPending(true);
        setError(null);
        try {
            await cancelSubscription();
            setCancelled(true);
            setOpen(false);
        } catch {
            setError("We couldn't cancel your subscription. Please try again.");
        } finally {
            setPending(false);
        }
    }

    if (cancelled) {
        return (
            <p role="status" className="text-muted-foreground flex items-start gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                Your {planName} plan is scheduled to end on {endsOn}. You keep full access until then.
            </p>
        );
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                // Don't let the dialog be dismissed while the request is in flight.
                if (pending) return;
                setOpen(next);
                if (!next) setError(null);
            }}
        >
            <AlertDialogTrigger render={<Button variant="destructive" />}>Cancel subscription</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                        <TriangleAlert aria-hidden />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Cancel your {planName} plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You will keep access to all {planName} features until {endsOn}. After that your workspace moves to the free plan, and anything over its
                        limits becomes read-only.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? (
                    <p role="alert" className="text-destructive text-sm">
                        {error}
                    </p>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Keep plan</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
                        {pending ? "Cancelling..." : "Yes, cancel subscription"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
