import { Check, Info, TriangleAlert, X } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
	id: string;
	type: ToastType;
	message: string;
	closing: boolean;
}

interface ToastContextValue {
	toast: {
		success: (message: string) => void;
		error: (message: string) => void;
		info: (message: string) => void;
		warning: (message: string) => void;
	};
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4000;
const TOAST_EXIT_DURATION = 180;

const toastIcons: Record<ToastType, ReactNode> = {
	success: <Check size={14} strokeWidth={2.5} />,
	error: <X size={14} strokeWidth={2.5} />,
	info: <Info size={14} strokeWidth={2.5} />,
	warning: <TriangleAlert size={14} strokeWidth={2.5} />,
};

const toastStyles: Record<
	ToastType,
	{ border: string; iconBg: string; iconText: string }
> = {
	success: {
		border: "border-emerald-500/20 bg-emerald-950/20",
		iconBg: "border-emerald-500/30 bg-emerald-500/10",
		iconText: "text-emerald-400",
	},
	error: {
		border: "border-red-500/20 bg-red-950/20",
		iconBg: "border-red-500/30 bg-red-500/10",
		iconText: "text-red-400",
	},
	info: {
		border: "border-zinc-700/50 bg-zinc-900/60",
		iconBg: "border-zinc-700 bg-zinc-800",
		iconText: "text-zinc-300",
	},
	warning: {
		border: "border-amber-500/20 bg-amber-950/20",
		iconBg: "border-amber-500/30 bg-amber-500/10",
		iconText: "text-amber-400",
	},
};

interface ToastItemProps {
	type: ToastType;
	message: string;
	onClose: () => void;
	closing?: boolean;
}

function ToastItem({
	type,
	message,
	onClose,
	closing = false,
}: ToastItemProps) {
	const style = toastStyles[type];

	return (
		<div
			className={`flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-white backdrop-blur-xl shadow-2xl shadow-black/60 transition-all ${
				style.border
			} ${closing ? "toast-exit" : "toast-enter"}`}
		>
			<div
				className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs ${style.iconBg} ${style.iconText}`}
			>
				{toastIcons[type]}
			</div>

			<p className="flex-1 text-sm text-zinc-200">{message}</p>

			<button
				type="button"
				onClick={onClose}
				className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
				aria-label="Close notification"
			>
				<X size={14} strokeWidth={2} />
			</button>
		</div>
	);
}

interface ToastContainerProps {
	toasts: ToastData[];
	onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
	if (typeof document === "undefined") {
		return null;
	}

	return createPortal(
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2.5 px-4"
		>
			{toasts.map((toast) => (
				<div key={toast.id} className="pointer-events-auto w-full max-w-sm">
					<ToastItem
						type={toast.type}
						message={toast.message}
						closing={toast.closing}
						onClose={() => onRemove(toast.id)}
					/>
				</div>
			))}
		</div>,
		document.body,
	);
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastData[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((current) =>
			current.map((toast) =>
				toast.id === id ? { ...toast, closing: true } : toast,
			),
		);

		setTimeout(() => {
			setToasts((current) => current.filter((toast) => toast.id !== id));
		}, TOAST_EXIT_DURATION);
	}, []);

	const addToast = useCallback(
		(type: ToastType, message: string) => {
			const id = crypto.randomUUID();

			setToasts((current) => [
				...current,
				{
					id,
					type,
					message,
					closing: false,
				},
			]);

			setTimeout(() => {
				removeToast(id);
			}, TOAST_DURATION);
		},
		[removeToast],
	);

	const toast = useMemo(
		() => ({
			success: (message: string) => addToast("success", message),
			error: (message: string) => addToast("error", message),
			info: (message: string) => addToast("info", message),
			warning: (message: string) => addToast("warning", message),
		}),
		[addToast],
	);

	const value = useMemo(
		() => ({
			toast,
		}),
		[toast],
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}

	return context.toast;
}

export default ToastProvider;
