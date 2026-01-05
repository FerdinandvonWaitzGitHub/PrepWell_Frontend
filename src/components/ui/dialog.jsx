import { useEffect } from 'react';
import { Icon } from './icon';

/**
 * Dialog/Modal component for overlays and pop-ups
 * Used for day management, forms, and confirmations
 */
export const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog Content */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

/**
 * Dialog Content wrapper with styling
 */
export const DialogContent = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-neutral-200 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Dialog Header with title and description
 */
export const DialogHeader = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Dialog Title
 */
export const DialogTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-lg font-semibold text-neutral-900 ${className}`}>
      {children}
    </h2>
  );
};

/**
 * Dialog Description
 */
export const DialogDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-neutral-500 leading-5 ${className}`}>
      {children}
    </p>
  );
};

/**
 * Dialog Body/Slot for main content
 */
export const DialogBody = ({ children, className = '' }) => {
  return (
    <div className={`px-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Dialog Footer with action buttons
 */
export const DialogFooter = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-end gap-2 p-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Dialog Close Button (X icon)
 */
export const DialogClose = ({ onClose }) => {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-1.5 rounded hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600"
      aria-label="Schließen"
    >
      <XIcon size={20} />
    </button>
  );
};

/**
 * X/Close Icon
 */
const XIcon = ({ size = 20 }) => (
  <Icon size={size}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

export default Dialog;
