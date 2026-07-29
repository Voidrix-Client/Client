import React from 'react';
import { LoaderCircle } from 'lucide-react';

const LoadingOverlay = ({ message }: { message?: string }) => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background/80 px-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,hsla(var(--primary),0.24),transparent_30%),radial-gradient(circle_at_90%_100%,hsla(var(--secondary),0.14),transparent_34%)]" />
            <div className="absolute -top-20 right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 left-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
            <div className="relative flex items-center justify-center rounded-3xl border border-border/70 bg-card/70 px-10 py-8 shadow-[0_20px_55px_-25px_rgba(0,0,0,0.8)]">
                <LoaderCircle className="h-14 w-14 animate-spin text-primary" />
                <div className="absolute h-20 w-20 rounded-full border-2 border-primary/20 animate-pulse" />
            </div>
            <div className="relative mt-5 w-[min(360px,82vw)]">
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-border/60 bg-background/55">
                    <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-primary/35 via-primary to-secondary/80 animate-[overlay-indeterminate_1.35s_ease-in-out_infinite]" />
                </div>
            </div>
            {message && (
                <p className="relative mt-3 rounded-full border border-border/60 bg-background/50 px-4 py-1.5 text-sm font-medium text-foreground">
                    {message}
                </p>
            )}
            <style>{`
                @keyframes overlay-indeterminate {
                    0% { transform: translateX(-120%); }
                    60% { transform: translateX(170%); }
                    100% { transform: translateX(170%); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .animate-spin,
                    .animate-pulse,
                    .animate-\\[overlay-indeterminate_1\\.35s_ease-in-out_infinite\\] {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;
