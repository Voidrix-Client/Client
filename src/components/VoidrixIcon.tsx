import React from 'react';

// VoidrixIcon: Zeigt das App-Icon aus resources/icon.png oder icon.ico an
// Fällt zurück auf ein Platzhalter-Icon, falls das Bild nicht geladen werden kann
const VoidrixIcon: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => {
  // Versuche zuerst PNG, dann ICO
  const [src, setSrc] = React.useState('resources/icon.png');
  const handleError = () => {
    if (src === 'resources/icon.png') setSrc('resources/icon.ico');
    else setSrc(''); // Fallback: kein Icon
  };
  if (!src) {
    // Fallback: Initialen
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        ZC
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="VoidrixClient Icon"
      width={size}
      height={size}
      className={`rounded-xl shadow-lg border border-primary/20 bg-background ${className}`}
      style={{ objectFit: 'contain', width: size, height: size }}
      onError={handleError}
      draggable={false}
    />
  );
};

export default VoidrixIcon;
