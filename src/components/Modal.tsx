import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onClose: () => void;
  closeButton?: boolean;
};

export default function Modal({ children, className, labelledBy, onClose, closeButton = true }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      queueMicrotask(() => {
        if (!dialog.isConnected && trigger instanceof HTMLElement) trigger.focus({ preventScroll: true });
      });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          event.currentTarget.close();
        }
      }}
    >
      {closeButton && <button type="button" className="dialog-close" aria-label="Fechar janela" onClick={() => ref.current?.close()}><X /></button>}
      {children}
    </dialog>
  );
}
