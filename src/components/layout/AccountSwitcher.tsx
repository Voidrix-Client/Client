import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PlayerHeadAvatar from '../common/PlayerHeadAvatar';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ChevronUp, LogOut, Plus, Trash2, User } from 'lucide-react';

interface Account {
    name: string;
    uuid: string;
}

function AccountSwitcher({ userProfile, onProfileUpdate, onLogout, isGuest }: any) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [busy, setBusy] = useState<string | null>(null);

    const currentUuid = userProfile?.uuid || userProfile?.id;

    const loadAccounts = useCallback(async () => {
        try {
            const list = await window.electronAPI?.getAccounts?.();
            setAccounts(Array.isArray(list) ? list : []);
        } catch {
            setAccounts([]);
        }
    }, []);

    useEffect(() => {
        if (open) loadAccounts();
    }, [open, loadAccounts]);

    const handleSwitch = useCallback(async (uuid: string) => {
        if (uuid === currentUuid) return;
        setBusy(uuid);
        try {
            const res = await window.electronAPI.switchAccount(uuid);
            if (!res?.success) return;

            if (window.electronAPI.validateSession) {
                const valid = await window.electronAPI.validateSession();
                onProfileUpdate?.(valid?.success ? await window.electronAPI.getProfile() : null);
            } else {
                onProfileUpdate?.(res.profile);
            }
            setOpen(false);
        } finally {
            setBusy(null);
        }
    }, [currentUuid, onProfileUpdate]);

    const handleRemove = useCallback(async (uuid: string) => {
        setBusy(uuid);
        try {
            const res = await window.electronAPI.removeAccount(uuid);
            if (!res?.success) return;
            if (res.loggedOut) {
                onProfileUpdate?.(null);
                setOpen(false);
            } else {
                loadAccounts();
            }
        } finally {
            setBusy(null);
        }
    }, [loadAccounts, onProfileUpdate]);

    const handleAdd = useCallback(async () => {
        setBusy('add');
        try {
            const res = await window.electronAPI.login();
            if (res?.success) {
                onProfileUpdate?.(res.profile);
                loadAccounts();
            }
        } finally {
            setBusy(null);
        }
    }, [loadAccounts, onProfileUpdate]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={t('accounts.title', 'Account')}
                    className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                        open ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                >
                    {isGuest || !userProfile ? (
                        <User className="h-[18px] w-[18px]" />
                    ) : (
                        <PlayerHeadAvatar
                            src={userProfile?.skinUrl}
                            uuid={currentUuid}
                            name={userProfile?.name}
                            size={26}
                        />
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent side="right" align="end" sideOffset={10} className="w-64 p-2">
                <p className="px-1.5 pb-2 pt-1 text-xs font-medium text-muted-foreground">
                    {t('accounts.playing_as', 'Playing as')}
                </p>

                {isGuest || !userProfile ? (
                    <div className="rounded-lg border border-border bg-muted/40 px-2.5 py-2">
                        <p className="text-sm font-medium text-foreground">{t('login.guest_mode', 'Guest mode')}</p>
                        <p className="text-xs text-muted-foreground">{t('accounts.guest_hint', 'Sign in to use skins.')}</p>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setExpanded(v => !v)}
                        className="flex w-full items-center gap-2.5 rounded-lg bg-muted/60 px-2.5 py-2 text-left transition-colors hover:bg-muted"
                    >
                        <PlayerHeadAvatar src={userProfile?.skinUrl} uuid={currentUuid} name={userProfile?.name} size={32} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{userProfile.name}</p>
                            <p className="text-xs text-muted-foreground">{t('accounts.minecraft_account', 'Minecraft account')}</p>
                        </div>
                        <ChevronUp className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !expanded && 'rotate-180')} />
                    </button>
                )}

                {expanded && accounts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                        {accounts.map(account => {
                            const active = account.uuid === currentUuid;
                            return (
                                <div
                                    key={account.uuid}
                                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSwitch(account.uuid)}
                                        disabled={Boolean(busy)}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50"
                                    >
                                        <span
                                            className={cn(
                                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                                active ? 'border-primary' : 'border-muted-foreground/50'
                                            )}
                                        >
                                            {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                                        </span>
                                        <PlayerHeadAvatar uuid={account.uuid} name={account.name} size={22} />
                                        <span className="truncate text-sm text-foreground">{account.name}</span>
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`${t('accounts.remove', 'Remove account')}: ${account.name}`}
                                        onClick={() => handleRemove(account.uuid)}
                                        disabled={Boolean(busy)}
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={busy === 'add'}
                    className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    {t('accounts.add', 'Add account')}
                </button>

                {!isGuest && userProfile && (
                    <button
                        type="button"
                        onClick={() => { setOpen(false); onLogout?.(); }}
                        className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                        {t('common.logout', 'Log out')}
                    </button>
                )}
            </PopoverContent>
        </Popover>
    );
}

export default AccountSwitcher;
