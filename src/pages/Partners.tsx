import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Handshake, Heart, Users, Server, Gamepad, Globe, MessageCircle,
    Twitter, Youtube, Twitch, Github, Instagram, Mail, ExternalLink,
    Copy, Check, Star, Award, Medal, Trophy, Shield, Calendar,
    Search, Filter, ChevronRight, Maximize2, Minimize2, Sparkles,
    Crown, Diamond, Zap, Rocket, Coffee, Gift, Link, Share2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import PageContent from '../components/layout/PageContent';

interface Partner {
    id: string;
    name: string;
    description: string;
    logo?: string;
    banner?: string;
    website?: string;
    discord?: string;
    twitter?: string;
    youtube?: string;
    twitch?: string;
    github?: string;
    instagram?: string;
    email?: string;
    category: 'sponsor' | 'partner' | 'community' | 'hosting' | 'content';
    tier?: 'platinum' | 'gold' | 'silver' | 'bronze';
    featured?: boolean;
    since?: string;
    members?: number;
    serverIp?: string;
}

const PARTNERS: Partner[] = [
    {
        id: "1",
        name: "LavaSMP",
        description: "Ein einzigartiges Minecraft Survival-Multiplayer-Erlebnis mit Lava-Thematik. Tägliche Events, aktive Community und epische Bauprojekte! Trete jetzt bei und erlebe ein unvergessliches Abenteuer.",
        logo: "https://cdn.discordapp.com/attachments/1467911328990761207/1488918656653070467/icon.png",
        website: "https://voidrixclient.voidrix.de/partner.html",
        discord: "https://discord.gg/D5xzymgCH2",
        youtube: "https://youtube.com/@lavasmp",
        category: "partner",
        tier: "platinum",
        featured: true,
        since: "2026",
        members: 100,
        serverIp: "lavasmp.net"
    },
    {
        id: "2",
        name: "FabianGaming2",
        description: "Minecraft Content Creator!",
        logo: "https://cdn.discordapp.com/attachments/1488605938616242188/1491123821259002056/grafik-removebg-preview.png?ex=69d68cc6&is=69d53b46&hm=cd93c8e4b9a965cb2990bf8de39fad0035e7f6d599baefbfd298fc81271c8a2b",
        youtube: "https://www.youtube.com/@fabiq11",
        category: "content",
        tier: "silver",
        featured: true,
        since: "2026"
    },
    {
        id: "3",
        name: "Killua_HD",
        description: "Minecraft Content Creator!",
        logo: "https://cdn.discordapp.com/attachments/1488605938616242188/1491123821259002056/grafik-removebg-preview.png?ex=69d68cc6&is=69d53b46&hm=cd93c8e4b9a965cb2990bf8de39fad0035e7f6d599baefbfd298fc81271c8a2b",
        discord: "https://discord.gg/8jRA5VvC9q",
        youtube: "www.youtube.com/@pixelchrons",
        category: "content",
        tier: "gold",
        since: "2026"
    }
];

const tierConfig: Record<string, { label: string; icon: any; bg: string; color: string }> = {
    platinum: { label: 'Platinum', icon: Crown, bg: 'bg-gradient-to-r from-slate-500/20 to-gray-500/10', color: 'text-slate-400' },
    gold: { label: 'Gold', icon: Award, bg: 'bg-gradient-to-r from-violet-500/20 to-blue-600/10', color: 'text-violet-300' },
    silver: { label: 'Silver', icon: Medal, bg: 'bg-gradient-to-r from-gray-400/20 to-slate-500/10', color: 'text-gray-400' },
    bronze: { label: 'Bronze', icon: Trophy, bg: 'bg-gradient-to-r from-indigo-700/20 to-violet-800/10', color: 'text-indigo-300' }
};

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    sponsor: { label: 'Sponsor', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    partner: { label: 'Partner', icon: Handshake, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    community: { label: 'Community', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    hosting: { label: 'Hosting', icon: Server, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    content: { label: 'Content Creator', icon: Gamepad, color: 'text-violet-300', bg: 'bg-violet-500/10' }
};

type CategoryType = 'all' | 'sponsor' | 'partner' | 'community' | 'hosting' | 'content';
type TierType = 'all' | 'platinum' | 'gold' | 'silver' | 'bronze';

const PartnerCard: React.FC<{ partner: Partner; index: number; compact?: boolean }> = ({ partner, index, compact }) => {
    const [copied, setCopied] = useState(false);
    const category = categoryConfig[partner.category];
    const tier = partner.tier ? tierConfig[partner.tier] : null;
    const CategoryIcon = category.icon;
    const TierIcon = tier?.icon;

    const socialLinks = [
        { icon: Globe, url: partner.website, label: 'Website' },
        { icon: MessageCircle, url: partner.discord, label: 'Discord' },
        { icon: Twitter, url: partner.twitter, label: 'Twitter' },
        { icon: Youtube, url: partner.youtube, label: 'YouTube' },
        { icon: Twitch, url: partner.twitch, label: 'Twitch' },
        { icon: Github, url: partner.github, label: 'GitHub' },
        { icon: Instagram, url: partner.instagram, label: 'Instagram' },
        { icon: Mail, url: partner.email ? `mailto:${partner.email}` : null, label: 'Email' }
    ].filter(link => link.url);

    const copyServerIp = () => {
        if (partner.serverIp) {
            navigator.clipboard.writeText(partner.serverIp);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-500",
                "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
                "border border-border/50 hover:border-primary/30 hover:shadow-2xl",
                partner.featured && "border-primary/30 shadow-lg shadow-primary/10",
                "animate-slide-in"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Banner Bereich */}
            <div className={cn(
                "relative overflow-hidden bg-gradient-to-r",
                partner.banner ? "h-24" : "h-16",
                tier?.bg || "from-muted/50 to-muted/30"
            )}>
                {partner.banner ? (
                    <img src={partner.banner} alt={partner.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={cn("gap-1.5 border-0", category.bg, category.color)}>
                        <CategoryIcon className="w-3 h-3" />
                        {category.label}
                    </Badge>
                    {tier && (
                        <Badge className={cn("gap-1.5 border-0", tier.bg, tier.color)}>
                            <TierIcon className="w-3 h-3" />
                            {tier.label}
                        </Badge>
                    )}
                    {partner.featured && (
                        <Badge className="bg-gradient-to-r from-violet-500 to-blue-500 text-white border-0 gap-1">
                            <Star className="w-3 h-3" />
                            Featured
                        </Badge>
                    )}
                </div>
            </div>

            <CardContent className={cn("p-5", compact && "p-3")}>
                <div className="flex items-start gap-4">
                    {/* Logo */}
                    <Avatar className="w-16 h-16 rounded-xl border-2 border-border/50 shadow-lg shrink-0">
                        <AvatarImage src={partner.logo} alt={partner.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-xl">
                            {partner.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {partner.name}
                        </h3>
                        
                        {partner.serverIp && (
                            <div className="flex items-center gap-2 mt-1">
                                <code className="text-xs bg-muted/50 px-2 py-0.5 rounded font-mono text-foreground">
                                    {partner.serverIp}
                                </code>
                                <button
                                    onClick={copyServerIp}
                                    className="p-0.5 hover:bg-accent rounded transition-colors"
                                >
                                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {partner.members && (
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {partner.members.toLocaleString()} Mitglieder
                                </div>
                            )}
                            {partner.since && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Partner seit {partner.since}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className={cn(
                    "text-sm text-muted-foreground/80 mt-4 leading-relaxed",
                    compact ? "line-clamp-2" : "line-clamp-3"
                )}>
                    {partner.description}
                </p>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {socialLinks.map((link, idx) => {
                            const Icon = link.icon;
                            return (
                                <a
                                    key={idx}
                                    href={link.url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all hover:scale-110"
                                    title={link.label}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                    {partner.website && (
                        <Button size="sm" variant="outline" className="flex-1 gap-1.5" asChild>
                            <a href={partner.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                                Website
                            </a>
                        </Button>
                    )}
                    {partner.discord && (
                        <Button size="sm" className="flex-1 gap-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white" asChild>
                            <a href={partner.discord} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="w-3 h-3" />
                                Discord
                            </a>
                        </Button>
                    )}
                </div>
            </CardContent>

            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </Card>
    );
};

const Partners: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
    const [selectedTier, setSelectedTier] = useState<TierType>('all');
    const [compactView, setCompactView] = useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const filteredPartners = useMemo(() => {
        let filtered = [...PARTNERS];

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        if (selectedTier !== 'all') {
            filtered = filtered.filter(p => p.tier === selectedTier);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        // Sort: Featured first, then by tier
        const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
        filtered.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            const tierA = a.tier ? tierOrder[a.tier] : 999;
            const tierB = b.tier ? tierOrder[b.tier] : 999;
            return tierA - tierB;
        });

        return filtered;
    }, [selectedCategory, selectedTier, searchQuery]);

    const filterCounts = {
        all: PARTNERS.length,
        sponsor: PARTNERS.filter(p => p.category === 'sponsor').length,
        partner: PARTNERS.filter(p => p.category === 'partner').length,
        community: PARTNERS.filter(p => p.category === 'community').length,
        hosting: PARTNERS.filter(p => p.category === 'hosting').length,
        content: PARTNERS.filter(p => p.category === 'content').length
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="text-center mb-8">
                        <Skeleton className="w-20 h-20 rounded-2xl mx-auto mb-4" />
                        <Skeleton className="h-8 w-48 mx-auto mb-2" />
                        <Skeleton className="h-4 w-96 mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Card key={i} className="bg-card/40 border-border/50 overflow-hidden">
                                <Skeleton className="h-16 w-full" />
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="w-16 h-16 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-full mt-4" />
                                    <Skeleton className="h-4 w-2/3 mt-2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
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

            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <Handshake className="h-5 w-5 text-primary" />
                        Unsere Partner
                    </span>
                }
                description={
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Entdecke die großartigen Partner und Sponsoren, die VoidrixClient unterstützen
                    </span>
                }
            />

            <PageContent>
                <div className="max-w-7xl mx-auto">
                    {/* Filter Section */}
                    <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-5 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Partner suchen..."
                                        className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'sponsor', 'partner', 'community', 'hosting', 'content'] as CategoryType[]).map((cat) => {
                                    const config = cat === 'all' ? { icon: Filter, label: 'Alle', color: 'text-muted-foreground', bg: 'bg-muted/50' } : categoryConfig[cat];
                                    const Icon = config.icon;
                                    const isActive = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                                                isActive
                                                    ? "bg-primary/20 text-primary border border-primary/30"
                                                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50"
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {config.label}
                                            {filterCounts[cat as keyof typeof filterCounts] > 0 && (
                                                <span className="ml-1 text-[10px] opacity-70">({filterCounts[cat as keyof typeof filterCounts]})</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tier Filter */}
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'platinum', 'gold', 'silver', 'bronze'] as TierType[]).map((tier) => {
                                    const config = tier === 'all' ? { label: 'Alle', icon: Star } : tierConfig[tier];
                                    const Icon = config.icon;
                                    const isActive = selectedTier === tier;
                                    if (tier === 'all' || PARTNERS.some(p => p.tier === tier)) {
                                        return (
                                            <button
                                                key={tier}
                                                onClick={() => setSelectedTier(tier)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                                                    isActive
                                                        ? "bg-primary/20 text-primary border border-primary/30"
                                                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50"
                                                )}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {config.label}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            {/* View Toggle */}
                            <button
                                onClick={() => setCompactView(!compactView)}
                                className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                title={compactView ? "Erweiterte Ansicht" : "Kompakte Ansicht"}
                            >
                                {compactView ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Partners Grid */}
                    {filteredPartners.length === 0 ? (
                        <div className="text-center py-16">
                            <Handshake className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">Keine Partner gefunden</h3>
                            <p className="text-muted-foreground">
                                {searchQuery ? 'Versuche einen anderen Suchbegriff' : 'Es wurden noch keine Partner hinzugefügt'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredPartners.map((partner, index) => (
                                <PartnerCard key={partner.id} partner={partner} index={index} compact={compactView} />
                            ))}
                        </div>
                    )}

                    {/* Become a Partner CTA */}
                    <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/20 animate-pulse">
                                <Heart className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">
                                    Werde ein Partner
                                </h3>
                                <p className="text-muted-foreground text-sm max-w-md">
                                    Interessiert an einer Partnerschaft? Kontaktiere uns für mehr Informationen und werde Teil unserer wachsenden Community.
                                </p>
                            </div>
                            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                                <Mail className="w-4 h-4" />
                                Kontakt aufnehmen
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </PageContent>

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

export default Partners;