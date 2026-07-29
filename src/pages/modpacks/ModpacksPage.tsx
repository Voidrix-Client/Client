import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import {
  Search, Package, Download, Star, Clock, ChevronDown, Loader2,
  AlertCircle, Grid, List, Filter, TrendingUp, Sparkles, Zap, Flame
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import ModpackGalleryCard from '../../components/modpack/ModpackGalleryCard';
import ModpackDetailsView from '../../components/modpack/ModpackDetailsView';
import { formatNumber } from '../../utils/formatting';

interface Modpack {
  slug: string;
  title: string;
  icon_url?: string;
  description?: string;
  author?: string;
  downloads?: number;
  followers?: number;
  updated?: string;
  categories?: string[];
  versions?: string[];
}

const ModpacksPage: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Modpack[]>([]);
  const [loading, setLoading] = useState(false);
  const [installingPack, setInstallingPack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [sortBy, setSortBy] = useState('downloads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedModpack, setSelectedModpack] = useState<Modpack | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const limit = 24;

  const sortOptions = [
    { value: 'relevance', label: '🔍 Relevance', icon: Star },
    { value: 'downloads', label: '⬇️ Most Downloaded', icon: Download },
    { value: 'newest', label: '✨ Newest', icon: Clock },
    { value: 'updated', label: '🔄 Recently Updated', icon: TrendingUp },
    { value: 'follows', label: '❤️ Most Favorited', icon: Star }
  ];

  // API Functions
  const searchModpacks = useCallback(async (query = '', pageNum = 0) => {
    setLoading(true);
    setError(null);
    try {
      const facets: string[][] = [['project_type:modpack']];

      const res = await window.electronAPI.searchModrinth(query, facets, {
        limit,
        offset: pageNum * limit,
        index: sortBy
      });

      if (res?.success && res.results) {
        setSearchResults(prev => pageNum === 0 ? res.results : [...prev, ...res.results]);
        setTotalHits(res.total_hits || 0);
      } else if (res?.hits) {
        setSearchResults(prev => pageNum === 0 ? res.hits : [...prev, ...res.hits]);
        setTotalHits(res.total_hits || res.hits.length);
      } else {
        setError('No results found');
      }
    } catch (error) {
      console.error("Failed to search modpacks:", error);
      setError('Failed to load modpacks');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  // Initialize Search
  useEffect(() => {
    searchModpacks('', 0);
  }, [searchModpacks]);

  // Event Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    searchModpacks(searchQuery, 0);
  }, [searchQuery, searchModpacks]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    searchModpacks(searchQuery, nextPage);
  }, [page, searchQuery, searchModpacks]);

  const handleInstall = useCallback(async (pack: Modpack) => {
    if (installingPack) return;

    try {
      setInstallingPack(pack.slug);

      const versions = await window.electronAPI.getModVersions(pack.slug, [], []);

      if (!versions?.success || !versions.versions || versions.versions.length === 0) {
        throw new Error("No versions found for this modpack");
      }

      const latestVersion = versions.versions[0];
      const primaryFile = latestVersion.files?.find((f: any) => f.primary) || latestVersion.files?.[0];

      if (!primaryFile) {
        throw new Error("No file found for the latest version");
      }

      const result = await window.electronAPI.installModpack(primaryFile.url, pack.title, pack.icon_url);

      if (result?.success) {
        addNotification(`🚀 ${pack.title} installation started!`, 'success');
        setShowDetails(false);
      } else {
        throw new Error(result?.error || 'Installation failed');
      }

    } catch (e: any) {
      console.error("Install failed:", e);
      addNotification(e.message || "Installation failed", 'error');
    } finally {
      setInstallingPack(null);
    }
  }, [installingPack, addNotification]);

  const hasMore = searchResults.length < totalHits;

  return (
    <div className="h-full flex flex-col text-foreground overflow-hidden bg-gradient-to-br from-background via-background to-background/80">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-primary/6 rounded-full blur-3xl"
          style={{ animation: 'float 20s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          style={{ animation: 'float-delayed 25s ease-in-out infinite' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col">
        {/* Header Section */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-xl border-b border-border/20 px-8 py-6">
          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                {t('modpacks.title', 'Modpacks')}
              </h1>
              <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                <Flame className="w-3 h-3" />
                {formatNumber(totalHits)} Available
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover and install premium modpacks for your Minecraft adventure
            </p>
          </div>

          {/* Search and Controls */}
          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modpacks by name, creator..."
                  className="pl-12 h-12 bg-muted/40 backdrop-blur-sm border-border/60 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary font-bold shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-2">Search</span>
              </Button>
            </form>

            {/* Controls Row */}
            <div className="flex items-center gap-3 justify-between">
              <div className="flex gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-muted/50 backdrop-blur-sm border border-border/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/30 text-primary shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'list'
                        ? 'bg-primary/30 text-primary shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Button */}
                <button className="px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted/70 border border-border/50 transition-all flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Filter</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(0);
                    searchModpacks(searchQuery, 0);
                  }}
                  className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/80 cursor-pointer appearance-none pr-10 font-medium"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Modpacks Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {error ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">{error}</p>
              <Button
                onClick={() => searchModpacks('', 0)}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div
                className={`grid gap-6 mb-8 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                    : 'grid-cols-1'
                }`}
              >
                {searchResults.map((pack) => (
                  <ModpackGalleryCard
                    key={pack.slug}
                    pack={pack}
                    installingPack={installingPack}
                    onInstall={handleInstall}
                    onShowDetails={(p) => {
                      setSelectedModpack(p);
                      setShowDetails(true);
                    }}
                    t={t}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                </div>
              )}

              {!loading && hasMore && searchResults.length > 0 && (
                <div className="flex justify-center py-8">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    className="px-8 py-6 group border-primary/40 hover:bg-primary/10"
                  >
                    <span className="flex items-center gap-2">
                      <span>Load More Modpacks</span>
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              )}

              {!loading && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                  <Package className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No modpacks found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modpack Details Modal */}
      <ModpackDetailsView
        pack={selectedModpack}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onInstall={handleInstall}
        installingPack={installingPack}
        t={t}
      />

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(30px) translateX(-20px); }
        }
      `}</style>
    </div>
  );
};

export default ModpacksPage;
