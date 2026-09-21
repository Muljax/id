export interface SearchRecord {
	id: string;
	title: string;
	description?: string;
	url: string;
	category: "Page" | "Section" | "Database" | "API" | "Protocol";
	breadcrumbs: string[];
	keywords?: string[];
}
