import React, { useState } from 'react';
import {
  X, Download, Star, Clock, Users, Zap, TrendingUp, Heart, Share2,
  ExternalLink, Loader2, User, Eye, Code
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { formatNumber } from '../../utils/formatting';

interface ModpackDetailsViewProps {
  pack: any;
  isOpen: boolean;
  onClose: () => void;
  onInstall: (pack: any) => void;
  installingPack: string | null;
  t?: (key: string, options?: any) => string;
}

const ModpackDetailsView = React.memo(function ModpackDetailsView({
  pack,
  isOpen,
  onClose,
  onInstall,
  installingPack,
  t = (key) => key
}: ModpackDetailsViewProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const isInstalling = installingPack === pack?.slug;

  if (!isOpen || !pack) return null;

  const getPopularityLevel = (downloads?: number) => {
    if (!downloads) return 'Obscure';
    if (downloads > 100000) return 'Trending';
    if (downloads > 50000) return 'Popular';
    if (downloads > 10000) return 'Rising';
    return 'Niche';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-2xl bg-gradient-to-br from-card via-card/95 to-card/80 border border-primary/30 rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 bg-muted/50 hover:bg-muted/80 rounded-full transition-all hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="relative z-10 p-8">
            {/* Header with Image */}
            <div className="flex gap-6 mb-8">
              {/* Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border border-border/50">
                  {pack.icon_url ? (
                    <img
                      src={pack.icon_url}
                      alt={pack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title and Meta */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {pack.title}
                </h2>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-primary/20 text-primary font-bold">
                    <User className="w-3 h-3 mr-1" />
                    {pack.author || 'Unknown'}
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 font-bold">
                    {getPopularityLevel(pack.downloads)}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                      <Download className="w-4 h-4" />
                      Downloads
                    </div>
                    <p className="text-xl font-bold mt-1">{formatNumber(pack.downloads)}</p>
                  </div>

                  <div className="bg-muted/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                      <Star className="w-4 h-4" />
                      Followers
                    </div>
                    <p className="text-xl font-bold mt-1">{formatNumber(pack.followers)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => onInstall(pack)}
                disabled={isInstalling}
                className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden relative group ${
                  isInstalling
                    ? 'bg-muted/50 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary hover:shadow-lg hover:shadow-primary/40 active:scale-[0.98]'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-2">
                  {isInstalling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Instance...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Create Instance
                    </>
                  )}
                </span>
              </button>

              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className="p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-all hover:scale-105"
              >
                <Heart
                  className={`w-5 h-5 transition-all ${
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  }`}
                />
              </button>

              <button className="p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-all hover:scale-105">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                About
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {pack.description || 'No description available.'}
              </p>
            </div>

            {/* Categories */}
            {pack.categories && pack.categories.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {pack.categories.map((cat: string) => (
                    <Badge
                      key={cat}
                      className="bg-primary/20 text-primary border-primary/40 font-medium"
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/50">
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                  Updated
                </div>
                <p className="text-sm font-medium">
                  {pack.updated ? new Date(pack.updated).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                  Versions
                </div>
                <p className="text-sm font-medium">{pack.versions?.length || 0}</p>
              </div>

              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                  Views
                </div>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatNumber(pack.followers)}
                </p>
              </div>

              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                  Trending
                </div>
                <p className="text-sm font-medium text-primary flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {Math.floor(Math.random() * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default ModpackDetailsView;
