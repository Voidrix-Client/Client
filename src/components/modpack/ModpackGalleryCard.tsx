import React, { useState } from 'react';
import {
  Download, Star, Clock, Zap, Sparkles, TrendingUp,
  Loader2, Heart, Eye, Share2
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { formatNumber } from '../../utils/formatting';

interface ModpackGalleryCardProps {
  pack: any;
  installingPack: string | null;
  onInstall: (pack: any) => void;
  onShowDetails?: (pack: any) => void;
  t: (key: string, options?: any) => string;
}

const ModpackGalleryCard = React.memo(function ModpackGalleryCard({
  pack,
  installingPack,
  onInstall,
  onShowDetails,
  t
}: ModpackGalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const isInstalling = installingPack === pack.slug;

  const getPopularityLevel = (downloads?: number) => {
    if (!downloads) return 'Obscure';
    if (downloads > 100000) return '🔥 Trending';
    if (downloads > 50000) return '⭐ Popular';
    if (downloads > 10000) return '✨ Rising';
    return '🎮 Niche';
  };

  return (
    <div
      className="group relative bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden transition-all duration-500 hover:border-primary/60 h-full flex flex-col cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium Glow Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${
          isHovered ? 'opacity-20' : ''
        }`}
      />

      {/* Animated Border Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-lg pointer-events-none" />

      {/* Decorative Corners */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-muted/80 to-muted/30">
        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

        {pack.icon_url ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <img
              src={pack.icon_url}
              alt={pack.title}
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              } group-hover:scale-110`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="w-16 h-16 text-primary/30" />
          </div>
        )}

        {/* Premium Badges */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex justify-between items-start gap-2">
            <Badge className="bg-black/70 backdrop-blur-md border-primary/40 text-primary font-bold text-xs uppercase tracking-wider">
              <Zap className="w-3 h-3 mr-1" />
              Modpack
            </Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorited(!isFavorited);
              }}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 transition-all hover:scale-110 pointer-events-auto"
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  isFavorited ? 'fill-red-500 text-red-500' : 'text-white/60'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <Badge variant="secondary" className="bg-black/70 backdrop-blur-md border-yellow-500/40 text-yellow-300 text-xs font-bold">
              {getPopularityLevel(pack.downloads)}
            </Badge>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-white/90 text-xs">
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">{formatNumber(pack.downloads)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-semibold">{formatNumber(pack.followers)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Title */}
        <div>
          <h3 className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {pack.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            by <span className="text-primary font-semibold">{pack.author || 'Unknown'}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed flex-1">
          {pack.description || 'No description available.'}
        </p>

        {/* Categories */}
        {pack.categories && pack.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pack.categories.slice(0, 2).map((cat: string) => (
              <Badge
                key={cat}
                variant="outline"
                className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 border-primary/40 text-primary/80"
              >
                {cat}
              </Badge>
            ))}
            {pack.categories.length > 2 && (
              <Badge
                variant="outline"
                className="text-[10px] font-medium px-2 py-0.5 bg-muted/50 border-border/40"
              >
                +{pack.categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Updated Time */}
        {pack.updated && (
          <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            Updated {new Date(pack.updated).toLocaleDateString()}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onInstall(pack)}
            disabled={isInstalling}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 overflow-hidden relative group/btn ${
              isInstalling
                ? 'bg-muted/50 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            <span className="relative flex items-center justify-center gap-1.5">
              {isInstalling ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  Install
                </>
              )}
            </span>
          </button>

          <button
            onClick={() => onShowDetails?.(pack)}
            className="px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted/70 text-foreground transition-all duration-300 border border-border/40"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ModpackGalleryCard;
