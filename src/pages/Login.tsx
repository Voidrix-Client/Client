import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Crown, Rocket, ShieldCheck, Sparkles, Stars, User, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

function Login({ onLoginSuccess, onGuestMode }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await window.electronAPI.login();
            if (result.success) {
                onLoginSuccess(result.profile);
            } else {
                setError(result.error || t('login.failed'));
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,hsla(var(--primary),0.2),transparent_32%),radial-gradient(circle_at_90%_100%,hsla(var(--secondary),0.14),transparent_34%)]" />
            <div className="absolute -top-32 right-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-28 left-20 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="relative w-full max-w-5xl">
                <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_35px_80px_-35px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/12 to-transparent" />
                    <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="relative border-b border-border/60 p-7 sm:p-9 lg:border-b-0 lg:border-r">
                            <div className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                <Stars className="h-3 w-3 text-primary" />
                                Premium
                            </div>

                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                                <Crown className="h-3.5 w-3.5 text-primary" />
                                VoidrixClient
                                <Sparkles className="h-3 w-3 text-primary/70" />
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                {t('login.title')}
                            </h1>
                            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                                {t('login.microsoft_sign_in')}
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
                                    <ShieldCheck className="mb-2 h-4 w-4 text-primary" />
                                    <p className="text-sm font-medium text-foreground">Secure Auth</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Microsoft OAuth with safe session handling.</p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
                                    <Sparkles className="mb-2 h-4 w-4 text-primary" />
                                    <p className="text-sm font-medium text-foreground">Fast Start</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Continue in guest mode and switch account anytime.</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-2 rounded-2xl border border-border/70 bg-background/40 p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span className="text-xs text-muted-foreground">Session Restore</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-300" />
                                    <span className="text-xs text-muted-foreground">Fast Launcher Boot</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Rocket className="h-4 w-4 text-sky-400" />
                                    <span className="text-xs text-muted-foreground">Optimized for smooth startup</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-7 sm:p-9">
                            <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                <User className="h-3.5 w-3.5 text-primary" />
                                Account Access
                            </div>

                            {error && (
                                <div className="mb-5 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                <Button
                                    onClick={handleLogin}
                                    disabled={loading}
                                    size="lg"
                                    className="group h-12 w-full justify-between rounded-xl px-4 text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95"
                                >
                                    <span>{loading ? t('login.logging_in') : t('login.sign_in_button')}</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>

                                <Button
                                    onClick={onGuestMode}
                                    variant="outline"
                                    size="lg"
                                    className="h-12 w-full rounded-xl border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                >
                                    {t('login.guest_mode', 'Guest Mode')}
                                </Button>
                            </div>

                            <p className="mt-6 text-xs text-muted-foreground">
                                By continuing you agree to the launcher setup policy and privacy settings.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Login;
