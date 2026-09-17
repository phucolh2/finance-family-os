import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Professional Modal component.
 *
 * Kỹ thuật được áp dụng:
 * ✅ Portal to <body> — thoát khỏi stacking context, luôn nằm trên cùng
 * ✅ Body scroll lock (iOS-safe) — khoá cuộn background khi modal mở
 * ✅ Escape to close — bấm ESC đóng modal ngay
 * ✅ Backdrop click to close — bấm vùng tối phía sau để đóng
 * ✅ overscroll-contain — nội dung trong modal không kéo sang page cha
 * ✅ touchAction: none — chặn scroll xuyên qua backdrop trên iOS
 * ✅ Mobile-first animation — slide up trên mobile, scale in trên desktop
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}) => {
  // ── Body scroll lock (iOS-safe) ───────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // ── Escape to close ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      // Backdrop — click to close, block touch scroll
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ touchAction: 'none' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Blurred dark overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Dialog panel */}
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={[
          'relative z-10 w-full flex flex-col',
          maxWidth,
          'bg-family-bg border border-family-accent/15 shadow-2xl',
          // Mobile: sheet slides up from bottom; Desktop: centred card
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[92dvh] sm:max-h-[88dvh]',
          'overflow-hidden',
          // Animations defined in index.css
          'animate-modal-in',
        ].join(' ')}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// ── Composable sub-parts ──────────────────────────────────────────────

interface ModalHeaderProps {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  accentClass?: string; // e.g. 'bg-rose-500/10'
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  icon,
  onClose,
  accentClass = 'bg-family-accent/8',
}) => (
  <div className={`flex items-center justify-between px-5 py-4 border-b border-family-accent/10 shrink-0 ${accentClass}`}>
    <div className="flex items-center gap-2.5">
      {icon && <span>{icon}</span>}
      <h2 className="text-base font-bold text-family-text leading-snug">{title}</h2>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng"
      className="p-1.5 rounded-lg text-family-textMuted hover:text-family-text hover:bg-family-accent/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-family-accent"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 ${className}`}
    // iOS smooth scroll
    style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
  >
    {children}
  </div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`flex items-center justify-end gap-3 px-5 py-4 border-t border-family-accent/10 shrink-0 ${className}`}>
    {children}
  </div>
);
