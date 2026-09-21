import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "docs:sidebar:open";

export interface SidebarState {
	openSections: Set<string>;
	isMobileOpen: boolean;
	toggleSection: (label: string) => void;
	openSection: (label: string) => void;
	setMobileOpen: (open: boolean) => void;
}

function readFromStorage(): Set<string> | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return new Set<string>(parsed);
	} catch {
		// ignore malformed storage value
	}
	return null;
}

function writeToStorage(sections: Set<string>): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...sections]));
	} catch {
		// ignore storage errors (e.g. private browsing quota)
	}
}

export function useSidebarState(
	initiallyOpenSections?: string[],
): SidebarState {
	const [openSections, setOpenSections] = useState<Set<string>>(() => {
		const stored = readFromStorage();
		if (stored !== null) return stored;
		return new Set<string>(initiallyOpenSections ?? []);
	});

	const [isMobileOpen, setIsMobileOpen] = useState(false);

	// Persist whenever openSections changes.
	useEffect(() => {
		writeToStorage(openSections);
	}, [openSections]);

	const toggleSection = useCallback((label: string) => {
		setOpenSections((prev) => {
			const next = new Set(prev);
			if (next.has(label)) {
				next.delete(label);
			} else {
				next.add(label);
			}
			return next;
		});
	}, []);

	const openSection = useCallback((label: string) => {
		setOpenSections((prev) => {
			if (prev.has(label)) return prev;
			const next = new Set(prev);
			next.add(label);
			return next;
		});
	}, []);

	const setMobileOpen = useCallback((open: boolean) => {
		setIsMobileOpen(open);
	}, []);

	return {
		openSections,
		isMobileOpen,
		toggleSection,
		openSection,
		setMobileOpen,
	};
}
