declare module "virtual:docs-search" {
	import type { SearchRecord } from "@/lib/search/types";
	export const searchIndex: SearchRecord[];
}
