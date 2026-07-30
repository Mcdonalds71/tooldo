import { XIcon } from '@phosphor-icons/react/dist/ssr';
import * as RadixToast from '@radix-ui/react-toast';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { IconButton } from './IconButton';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastInput {
  readonly title: string;
  readonly description?: string | undefined;
  readonly tone?: ToastTone | undefined;
}

interface ToastMessage extends ToastInput {
  readonly id: number;
  readonly tone: ToastTone;
}

interface ToastApi {
  readonly notify: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 0;

/**
 * Radix owns the hard parts — live-region announcements, swipe to dismiss, and the
 * hotkey back to the viewport — so this only adds the queue and our styling.
 */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [messages, setMessages] = useState<readonly ToastMessage[]>([]);

  const notify = useCallback((toast: ToastInput) => {
    nextId += 1;
    setMessages((current) => [...current, { ...toast, tone: toast.tone ?? 'info', id: nextId }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const api = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {messages.map((message) => (
          <RadixToast.Root
            key={message.id}
            className="toast"
            data-tone={message.tone}
            onOpenChange={(open) => {
              if (!open) dismiss(message.id);
            }}
          >
            <div className="toast__body">
              <RadixToast.Title className="toast__title">{message.title}</RadixToast.Title>
              {message.description ? (
                <RadixToast.Description className="toast__description">
                  {message.description}
                </RadixToast.Description>
              ) : null}
            </div>

            <RadixToast.Close asChild>
              <IconButton icon={XIcon} label="Dismiss" variant="ghost" size="sm" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport className="toast__viewport" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);

  if (api === null) {
    throw new Error('useToast needs a <ToastProvider> above it');
  }

  return api;
}
