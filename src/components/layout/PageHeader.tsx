import React from 'react';
import { cn } from '../../lib/utils';

// Optional: icon als Prop für links oben
function PageHeader({ title, description, children, className, icon }: { title: any; description?: any; children?: any; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b border-border shrink-0', className)}>
      {/* Icon ganz links */}
      {icon && (
        <div className="mr-4 flex items-center shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

export default PageHeader;
