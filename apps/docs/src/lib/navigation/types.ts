export interface NavPage {
	readonly kind: "page";
	readonly title: string;
	readonly description?: string;
	readonly path: string;
	readonly filePath: string;
	readonly order: number;
	readonly badge?: string;
}

export interface NavSection {
	readonly kind: "section";
	readonly label: string;
	readonly order: number;
	readonly collapsed: boolean;
	readonly items: readonly NavItem[];
}

export type NavItem = NavPage | NavSection;

export interface NavTree {
	readonly items: readonly NavItem[];
	/** Depth-first flat list of all pages, used for prev/next navigation. */
	readonly pages: readonly NavPage[];
}

export interface PageFrontmatter {
	readonly title?: string;
	readonly description?: string;
	readonly sidebar?: {
		readonly order?: number;
		readonly label?: string;
		readonly badge?: string;
		readonly collapsed?: boolean;
	};
}
