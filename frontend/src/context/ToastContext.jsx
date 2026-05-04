// Chemin : frontend/src/context/ToastContext.jsx
import {
  createContext, useContext, useState,
  useCallback, useRef,
} from "react";
import {
  CheckCircle2, AlertTriangle,
  XCircle, Info, X,
} from "lucide-react";

const ToastContext = createContext(null);

const CFG = {
  success: {
    icon:    CheckCircle2,
    bar:     "bg-emerald-500",
    icon_cl: "text-emerald-500",
    bg:      "bg-white",
    border:  "border-emerald-100",
  },
  error: {
    icon:    XCircle,
    bar:     "bg-red-500",
    icon_cl: "text-red-500",
    bg:      "bg-white",
    border:  "border-red-100",
  },
  warning: {
    icon:    AlertTriangle,
    bar:     "bg-amber-400",
    icon_cl: "text-amber-500",
    bg:      "bg-white",
    border:  "border-amber-100",
  },
  info: {
    icon:    Info,
    bar:     "bg-sky-500",
    icon_cl: "text-sky-500",
    bg:      "bg-white",
    border:  "border-sky-100",
  },
};

function ToastItem({ toast, onClose }) {
  const cfg  = CFG[toast.type] ?? CFG.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`
        relative flex w-80 items-start gap-3 overflow-hidden
        rounded-xl border shadow-lg ${cfg.bg} ${cfg.border}
        px-4 py-3.5
        animate-[slideIn_0.22s_ease-out]
      `}
    >
      {/* Barre colorée gauche */}
      <div className={`absolute left-0 top-0 h-full w-1 ${cfg.bar}`} />

      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.icon_cl}`} />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
        )}
        <p className={`text-xs text-slate-500 ${toast.title ? "mt-0.5" : ""}`}>
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 text-slate-300 transition hover:text-slate-500"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Barre de progression */}
      <div
        className={`
          absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-30
          animate-[shrink_var(--dur)_linear_forwards]
        `}
        style={{ "--dur": `${toast.duration}ms`, width: "100%" }}
      />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timerRefs.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = "info", title, message, duration = 4000 }) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      timerRefs.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  // Raccourcis
  const success = useCallback(
    (message, title) => toast({ type: "success", title, message }),
    [toast]
  );
  const error = useCallback(
    (message, title) => toast({ type: "error", title, message }),
    [toast]
  );
  const warning = useCallback(
    (message, title) => toast({ type: "warning", title, message }),
    [toast]
  );
  const info = useCallback(
    (message, title) => toast({ type: "info", title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}

      {/* Portail des toasts — coin inférieur droit */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() doit être dans un <ToastProvider>");
  return ctx;
}
