// Chemin : frontend/src/components/common/Modal.jsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Modale générique accessible.
 *
 * Props :
 *   isOpen    — boolean
 *   onClose   — () => void
 *   title     — string
 *   size      — "sm" | "md" | "lg" | "xl"  (défaut : "md")
 *   children  — contenu
 */
export default function Modal({
  isOpen, onClose, title, size = "md", children,
}) {
  const overlayRef = useRef(null);

  // Fermeture par touche Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Bloque le scroll du body
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size] ?? "max-w-lg";

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/40 backdrop-blur-sm p-4
        animate-[fadeIn_0.15s_ease-out]
      "
    >
      <div
        className={`
          relative w-full ${sizeClass} rounded-2xl border border-slate-200
          bg-white shadow-2xl
          animate-[modalIn_0.2s_ease-out]
        `}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between
                        border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition
                       hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenu */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}