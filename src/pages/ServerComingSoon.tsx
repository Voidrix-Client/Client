import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/layout/PageHeader';
import PageContent from '../components/layout/PageContent';
import { Badge } from '../components/ui/badge';
import { Server, Hammer, Terminal, Users, HardDriveDownload } from 'lucide-react';

const PREVIEW_ITEMS = [
    { icon: Terminal, key: 'console' },
    { icon: Users, key: 'players' },
    { icon: HardDriveDownload, key: 'backups' },
];

function ServerComingSoon() {
    const { t } = useTranslation();

    const previewLabels: Record<string, { title: string; description: string }> = {
        console: {
            title: t('server_soon.console_title', 'Live console'),
            description: t('server_soon.console_desc', 'Start, stop and control your server with a readable log view.'),
        },
        players: {
            title: t('server_soon.players_title', 'Player management'),
            description: t('server_soon.players_desc', 'Whitelist, ops and bans without touching a single config file.'),
        },
        backups: {
            title: t('server_soon.backups_title', 'Automatic backups'),
            description: t('server_soon.backups_desc', 'Scheduled world snapshots you can restore with one click.'),
        },
    };

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title={t('server_soon.title', 'Server')}
                description={t('server_soon.subtitle', 'Server hosting is being rebuilt from scratch.')}
                icon={<Server className="h-5 w-5 text-primary" />}
            >
                <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
                    <Hammer className="h-3 w-3" />
                    {t('server_soon.badge', 'In development')}
                </Badge>
            </PageHeader>

            <PageContent>
                <div className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" />
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card">
                            <Server className="h-9 w-9 text-primary" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        {t('server_soon.headline', 'Server features are still in the works')}
                    </h2>
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        {t(
                            'server_soon.body',
                            'The old server manager was removed to keep the launcher fast and simple. A new, cleaner version is being built and will show up right here once it is ready.'
                        )}
                    </p>

                    <div className="mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
                        {PREVIEW_ITEMS.map(({ icon: Icon, key }) => (
                            <div
                                key={key}
                                className="rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/30"
                            >
                                <Icon className="mb-3 h-5 w-5 text-primary" />
                                <p className="text-sm font-medium text-foreground">{previewLabels[key].title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {previewLabels[key].description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <p className="mt-8 text-xs text-muted-foreground">
                        {t('server_soon.footer', 'Until then everything else in the launcher works as usual.')}
                    </p>
                </div>
            </PageContent>
        </div>
    );
}

export default ServerComingSoon;
