export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message?: string;
	duration?: number;
	action?: {
		label: string;
		handler: () => void;
	};
}

class ToastStore {
	toasts = $state<Toast[]>([]);
	private toastId = 0;

	show(toast: Omit<Toast, 'id'>) {
		const id = (++this.toastId).toString();
		const newToast: Toast = {
			id,
			duration: 5000,
			...toast
		};

		this.toasts = [...this.toasts, newToast];

		// Auto-remove toast after duration
		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, newToast.duration);
		}

		return id;
	}

	remove(id: string) {
		this.toasts = this.toasts.filter(toast => toast.id !== id);
	}

	clear() {
		this.toasts = [];
	}

	// Convenience methods
	success(title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) {
		return this.show({ type: 'success', title, message, ...options });
	}

	error(title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) {
		return this.show({ type: 'error', title, message, ...options });
	}

	warning(title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) {
		return this.show({ type: 'warning', title, message, ...options });
	}

	info(title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) {
		return this.show({ type: 'info', title, message, ...options });
	}
}

export const toastStore = new ToastStore();