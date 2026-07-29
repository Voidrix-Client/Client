import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Calendar, ExternalLink, Newspaper, ChevronRight, AlertTriangle,
    Sparkles, Download, Star, RefreshCw, Zap, Package,
    Globe, Server, Maximize2, Minimize2, Clock, Heart,
    Users, Award, Trophy, Medal, Shield, Eye, ThumbsUp,
    MessageSquare, Info, TrendingUp, Filter, X, Check
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    date: string;
    type: 'update' | 'feature' | 'announcement';
    link?: string;
    important?: boolean;
    iconType?: 'update' | 'modpack' | 'performance' | 'neoforge' | 'announcement';
    author?: string;
    views?: number;
    likes?: number;
    comments?: number;
}

const NEWS_ITEMS: NewsItem[] = [
    {
        id: "1",
        title: "VoidrixClient v3.0 Update",
        content: "Wir freuen uns, das große v3.0 Update des VoidrixClients anzukündigen! Neue Features: Verbesserte Performance, modernes UI und Unterstützung für die neuesten Minecraft-Versionen 1.20.4 und 1.21. Die Ladezeiten wurden um 40% reduziert und der Arbeitsspeicherverbrauch optimiert. Außerdem gibt es ein neues, moderneres Design mit animierten Übergängen und verbesserter Barrierefreiheit.",
        date: "2026-04-09",
        type: "update",
        link: "https://voidrixclient.voidrix.de",
        important: true,
        iconType: "update",
        author: "VoidrixTeam"
    },
    {
        id: "2",
        title: "Neue Modpack-Integration",
        content: "Ab sofort könnt ihr direkt über den Launcher Modpacks von Modrinth und CurseForge installieren und verwalten. Einfach auswählen, installieren und loslegen! Unterstützt werden tausende Modpacks mit einem Klick. Die Installation läuft im Hintergrund, während ihr weiterhin den Launcher nutzen könnt.",
        date: "2026-04-08",
        type: "feature",
        link: "https://voidrixclient.voidrix.de/docs.html",
        iconType: "modpack",
        author: "Kairo"
    },
    {
        id: "3",
        title: "Wartungsarbeiten am 19.04.2026",
        content: "Am 19. April 2026 von 02:00 bis 04:00 Uhr MEZ finden Wartungsarbeiten an unseren Servern statt. Der Launcher bleibt während dieser Zeit eingeschränkt verfügbar. Wir bitten um Verständnis. Während der Wartung können folgende Funktionen beeinträchtigt sein: Modpack-Downloads, Skin-Uploads und die Server-Status-API.",
        date: "2026-04-19",
        type: "announcement",
        important: true,
        iconType: "announcement",
        author: "Kairo"
    },
    {
        id: "4",
        title: "Performance-Optimierungen",
        content: "Mit dem neuesten Update haben wir die Ladezeiten um 40% reduziert und den Arbeitsspeicherverbrauch optimiert. Besonders auf älteren Systemen macht sich das bemerkbar. Startzeiten sind jetzt bis zu 50% schneller! Die RAM-Nutzung wurde durch intelligentes Caching um durchschnittlich 200 MB reduziert.",
        date: "2026-04-07",
        type: "update",
        iconType: "performance",
        author: "Kairo"
    },
    {
        id: "5",
        title: "Unterstützung für NeoForge",
        content: "Der VoidrixClient unterstützt jetzt offiziell NeoForge als Mod-Loader. Installiert und verwaltet NeoForge-Mods ganz einfach über unseren Launcher. NeoForge bietet bessere Performance und Kompatibilität als der klassische Forge. Unterstützt werden alle gängigen NeoForge-Versionen ab 1.20.1.",
        date: "2026-04-20",
        type: "feature",
        iconType: "neoforge",
        author: "Kairo"
    },
    {
        id: "6",
        title: "Neue Skin-Editor-Features",
        content: "Der Skin-Editor wurde komplett überarbeitet! Neue Tools, verbesserte 3D-Vorschau und Unterstützung für HD-Skins (128x128). Jetzt kannst du deine Skins noch detaillierter gestalten. Neue Funktionen: Pinsel mit verschiedenen Größen, Füllwerkzeug, Farbsampler, Undo/Redo, Spiegelmodus und eine verbesserte Farbpalette.",
        date: "2026-04-06",
        type: "feature",
        iconType: "update",
        author: "Kairo"
    },
    {
        id: "7",
        title: "Cross-Platform Support",
        content: "VoidrixClient ist jetzt auch für Linux und macOS verfügbar! Genieße die volle Funktionalität auf allen Plattformen mit dem gleichen modernen Interface. Die native Integration für jede Plattform sorgt für optimale Performance.",
        date: "2026-04-05",
        type: "announcement",
        iconType: "modpack",
        author: "Kairo"
    },
    {
        id: "8",
        title: "Server-Manager Update",
        content: "Der Server-Manager wurde mit neuen Features ausgestattet: Automatische Backups, Performance-Monitoring, und eine übersichtliche Konsole mit Farbcodierung. Jetzt könnt ihr eure Minecraft-Server noch einfacher verwalten.",
        date: "2026-04-04",
        type: "update",
        iconType: "performance",
        author: "Kairo"
    }
];

// Banner-Konfigurationen
const BANNER_CONFIG = {
    update: { icon: Download, gradient: 'from-blue-600 to-cyan-500', bg: 'bg-blue-500/10', label: 'Update' },
    feature: { icon: Sparkles, gradient: 'from-purple-600 to-pink-500', bg: 'bg-purple-500/10', label: 'New Feature' },
    announcement: { icon: AlertTriangle, gradient: 'from-violet-600 to-blue-500', bg: 'bg-violet-500/10', label: 'Announcement' },
    modpack: { icon: Package, gradient: 'from-emerald-600 to-teal-500', bg: 'bg-emerald-500/10', label: 'Modpack' },
    performance: { icon: Zap, gradient: 'from-green-600 to-emerald-500', bg: 'bg-green-500/10', label: 'Performance' },
    neoforge: { icon: Package, gradient: 'from-indigo-600 to-violet-500', bg: 'bg-indigo-500/10', label: 'NeoForge' }
};

type FilterType = 'all' | 'update' | 'feature' | 'announcement';

interface NewsProps {
    limit?: number;
    showViewAll?: boolean;
    onViewAll?: () => void;
}

const News: React.FC<NewsProps> = ({ limit = 6, showViewAll = true, onViewAll }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [compactView, setCompactView] = useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'update':
                return { icon: Download, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Update' };
            case 'feature':
                return { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'New Feature' };
            case 'announcement':
                return { icon: AlertTriangle, color: 'text-violet-300', bg: 'bg-violet-500/20', label: 'Announcement' };
            default:
                return { icon: Newspaper, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'News' };
        }
    };

    const getBannerConfig = (iconType?: string) => {
        return BANNER_CONFIG[iconType as keyof typeof BANNER_CONFIG] || BANNER_CONFIG.update;
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffDays === 0) return 'Heute';
            if (diffDays === 1) return 'Gestern';
            if (diffDays < 7) return `Vor ${diffDays} Tagen`;

            return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const formatNumber = (num?: number) => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const filteredAndSortedNews = useMemo(() => {
        let filtered = [...NEWS_ITEMS];

        if (filterType !== 'all') {
            filtered = filtered.filter(item => item.type === filterType);
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return filtered.slice(0, limit);
    }, [filterType, sortOrder, limit]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filterCounts = {
        all: NEWS_ITEMS.length,
        update: NEWS_ITEMS.filter(n => n.type === 'update').length,
        feature: NEWS_ITEMS.filter(n => n.type === 'feature').length,
        announcement: NEWS_ITEMS.filter(n => n.type === 'announcement').length
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-card/40 border-border/50 overflow-hidden">
                        <Skeleton className="h-28 w-full" />
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-background/95">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-float-delayed" />
            </div>

            <div className="relative z-10 flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/30 mb-4">
                            <Newspaper className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent mb-2">
                            Neuigkeiten
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                            Bleib auf dem Laufenden mit den neuesten Updates, Features und Ankündigungen
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex gap-2">
                            {(['all', 'update', 'feature', 'announcement'] as FilterType[]).map((filter) => {
                                const isActive = filterType === filter;
                                const labels = { all: 'Alle', update: 'Updates', feature: 'Features', announcement: 'Ankündigungen' };
                                return (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterType(filter)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                            isActive
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50"
                                        )}
                                    >
                                        {labels[filter]}
                                        <span className="ml-1 text-[10px] opacity-70">({filterCounts[filter]})</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-2">
                            {/* Sort Toggle */}
                            <button
                                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-muted/50 hover:bg-accent transition-colors"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                {sortOrder === 'newest' ? 'Neueste zuerst' : 'Älteste zuerst'}
                                <ChevronRight className={cn(
                                    "w-3 h-3 transition-transform",
                                    sortOrder === 'oldest' && "rotate-90"
                                )} />
                            </button>

                            {/* View Toggle */}
                            <button
                                onClick={() => setCompactView(!compactView)}
                                className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                title={compactView ? "Erweiterte Ansicht" : "Kompakte Ansicht"}
                            >
                                {compactView ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* News Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredAndSortedNews.map((item, index) => {
                            const typeConfig = getTypeConfig(item.type);
                            const TypeIcon = typeConfig.icon;
                            const banner = getBannerConfig(item.iconType);
                            const BannerIcon = banner.icon;
                            const isExpanded = expandedId === item.id;
                            const shouldTruncate = !compactView && item.content.length > 200 && !isExpanded;
                            const truncatedContent = shouldTruncate ? item.content.slice(0, 200) + '...' : item.content;

                            return (
                                <Card
                                    key={item.id}
                                    className={cn(
                                        "group relative overflow-hidden transition-all duration-500",
                                        "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
                                        "border border-border/50 hover:border-primary/30 hover:shadow-2xl",
                                        item.important && "border-primary/30 shadow-lg shadow-primary/10",
                                        "animate-slide-in"
                                    )}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Banner */}
                                    <div className={cn(
                                        "relative overflow-hidden bg-gradient-to-r",
                                        banner.gradient,
                                        compactView ? "h-16" : "h-20"
                                    )}>
                                        <div className="absolute inset-0 bg-black/30" />
                                        <div className="absolute inset-0 flex items-center px-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg bg-white/20 backdrop-blur-sm",
                                                    compactView && "p-1"
                                                )}>
                                                    <BannerIcon className={cn("text-white", compactView ? "w-4 h-4" : "w-5 h-5")} />
                                                </div>
                                                <div>
                                                    <h2 className={cn("text-white font-bold", compactView ? "text-xs" : "text-sm")}>
                                                        {banner.label}
                                                    </h2>
                                                    {!compactView && (
                                                        <p className="text-white/70 text-[10px]">{item.title}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {item.important && (
                                                <Badge className="ml-auto bg-violet-500/90 text-white border-0 text-[10px]">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Wichtig
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <CardContent className={cn("p-5", compactView && "p-3")}>
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <div className={cn(
                                                    "rounded-xl bg-gradient-to-br flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                                                    typeConfig.bg,
                                                    compactView ? "w-8 h-8" : "w-10 h-10",
                                                    item.important && "ring-2 ring-primary/30"
                                                )}>
                                                    <TypeIcon className={cn(typeConfig.color, compactView ? "w-4 h-4" : "w-5 h-5")} />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Header */}
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <Badge className={cn("text-[10px] gap-1", typeConfig.bg, typeConfig.color)}>
                                                        <TypeIcon className="w-2.5 h-2.5" />
                                                        {typeConfig.label}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formatDate(item.date)}</span>
                                                    </div>
                                                    {item.author && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Users className="w-3 h-3" />
                                                            <span>{item.author}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className={cn(
                                                    "font-bold text-foreground mb-2 group-hover:text-primary transition-colors",
                                                    compactView ? "text-sm" : "text-lg"
                                                )}>
                                                    {item.title}
                                                </h3>

                                                {/* Content */}
                                                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                                                    {truncatedContent}
                                                </p>

                                                {/* Read More Button */}
                                                {!compactView && item.content.length > 200 && (
                                                    <button
                                                        onClick={() => toggleExpand(item.id)}
                                                        className="text-xs text-primary hover:text-primary/80 mt-2 flex items-center gap-1 transition-colors"
                                                    >
                                                        {isExpanded ? 'Weniger anzeigen' : 'Mehr lesen'}
                                                        <ChevronRight className={cn(
                                                            "w-3 h-3 transition-transform",
                                                            isExpanded && "rotate-90"
                                                        )} />
                                                    </button>
                                                )}

                                                {/* Stats Footer */}
                                                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/30">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Eye className="w-3 h-3" />
                                                        {formatNumber(item.views)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <ThumbsUp className="w-3 h-3" />
                                                        {formatNumber(item.likes)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {formatNumber(item.comments)}
                                                    </div>
                                                    {item.link && (
                                                        <a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Mehr erfahren
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* No Results */}
                    {filteredAndSortedNews.length === 0 && (
                        <div className="text-center py-16">
                            <Newspaper className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">Keine News gefunden</h3>
                            <p className="text-muted-foreground">Versuche einen anderen Filter oder schau später wieder vorbei</p>
                        </div>
                    )}

                    {/* View All Button */}
                    {showViewAll && NEWS_ITEMS.length > limit && (
                        <div className="flex justify-center mt-8">
                            <Button
                                variant="outline"
                                onClick={onViewAll}
                                className="gap-2 hover:bg-primary/10 hover:text-primary"
                            >
                                <span>Alle {NEWS_ITEMS.length} Neuigkeiten anzeigen</span>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-20px, -20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, 20px); }
                }
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-float {
                    animation: float 20s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 22s ease-in-out infinite;
                }
                .animate-slide-in {
                    animation: slide-in 0.4s ease-out forwards;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
};

export default News;