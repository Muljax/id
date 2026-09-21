export interface SectionConfig {
	order: number;
	label?: string;
	collapsed?: boolean;
}

/**
 * Global section weight and metadata configuration.
 *
 * Lower order numbers appear first in the sidebar navigation.
 * You can customize weights here or place a `_meta.json` / `_category.json` in any content directory.
 */
export const SECTION_CONFIG: Record<string, SectionConfig> = {
	overview: {
		order: 10,
		label: "Overview",
		collapsed: false,
	},
	"getting-started": {
		order: 20,
		label: "Getting Started",
		collapsed: false,
	},
	"user-guides": {
		order: 30,
		label: "User Guides",
		collapsed: false,
	},
	"admin-guides": {
		order: 40,
		label: "Admin Guides",
		collapsed: false,
	},
	protocols: {
		order: 50,
		label: "Protocols & Wire Specs",
		collapsed: false,
	},
	reference: {
		order: 60,
		label: "Reference",
		collapsed: false,
	},
};
