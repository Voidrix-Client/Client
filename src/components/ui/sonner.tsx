import React from 'react';
import { Toaster as Sonner } from 'sonner';

function Toaster(props: React.ComponentProps<typeof Sonner>) {
    return (
        <Sonner
            expand
            position="bottom-right"
            visibleToasts={4}
            toastOptions={{
                classNames: {
                    toast: 'voidrix-sonner-toast',
                    title: 'voidrix-sonner-title',
                    description: 'voidrix-sonner-description',
                    success: 'voidrix-sonner-success',
                    error: 'voidrix-sonner-error',
                    info: 'voidrix-sonner-info',
                    warning: 'voidrix-sonner-warning',
                    actionButton: 'voidrix-sonner-action',
                    cancelButton: 'voidrix-sonner-cancel'
                }
            }}
            {...props}
        />
    );
}

export { Toaster };
