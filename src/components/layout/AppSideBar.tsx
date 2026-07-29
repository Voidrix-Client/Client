import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ExtensionSlot from '../Extensions/ExtensionSlot';
import AccountSwitcher from './AccountSwitcher';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  Home,
  Compass,
  Shirt,
  Library,
  Server,
  Settings,
  Gem,
} from 'lucide-react';
import localLogo from '../../assets/logo.png';

const LOGO_URL = 'https://i.imgur.com/RFBSxfJ.png';

function RailButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
            active
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            disabled && 'pointer-events-none opacity-40'
          )}
        >
          <span
            className={cn(
              'absolute left-0 h-5 w-[3px] rounded-r-full bg-primary transition-opacity',
              active ? 'opacity-100' : 'opacity-0'
            )}
          />
          <Icon className="h-[18px] w-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function AppSideBar({ currentView, setView, onLogout, isGuest, userProfile, onProfileUpdate }: any) {
  const { t } = useTranslation();
  const [logoError, setLogoError] = useState(false);
  const [localLogoError, setLocalLogoError] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('common.dashboard', 'Start'), icon: Home },
    { id: 'search', label: t('common.search', 'Mods suchen'), icon: Compass },
    { id: 'skins', label: t('common.skins', 'Skins'), icon: Shirt, disabled: isGuest },
    { id: 'library', label: t('common.library', 'Bibliothek'), icon: Library },
    { id: 'server', label: t('common.server', 'Server'), icon: Server },
  ];

  const renderLogo = () => {
    if (!logoError) {
      return <img src={LOGO_URL} alt="Voidrix" className="h-full w-full object-cover" onError={() => setLogoError(true)} />;
    }
    if (!localLogoError && localLogo) {
      return <img src={localLogo} alt="Voidrix" className="h-full w-full object-cover" onError={() => setLocalLogoError(true)} />;
    }
    return <Gem className="h-4 w-4 text-primary" />;
  };

  return (
    <TooltipProvider>
      <aside className="relative z-50 flex h-full w-[68px] flex-col items-center border-r border-border bg-card/60 backdrop-blur-md">
        <div className="flex h-16 shrink-0 items-center justify-center">
          <div className="h-9 w-9 overflow-hidden rounded-xl border border-border bg-muted">
            {renderLogo()}
          </div>
        </div>

        <ExtensionSlot name="sidebar.top" className="flex w-full flex-col items-center gap-1.5 pb-1.5" />

        <nav className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto py-1">
          {navItems.map((item) => (
            <RailButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              disabled={item.disabled}
              onClick={() => setView(item.id)}
            />
          ))}
        </nav>

        <div className="flex w-full flex-col items-center gap-1.5 border-t border-border py-3">
          <ExtensionSlot name="sidebar.bottom" className="flex w-full flex-col items-center gap-1.5" />

          <RailButton
            icon={Settings}
            label={t('common.settings', 'Einstellungen')}
            active={currentView === 'settings'}
            onClick={() => setView('settings')}
          />

          <AccountSwitcher
            userProfile={userProfile}
            onProfileUpdate={onProfileUpdate}
            onLogout={onLogout}
            isGuest={isGuest}
          />
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default AppSideBar;
