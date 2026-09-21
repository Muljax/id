import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSidebarState } from "../../hooks/useSidebarState";
import type { NavItem, NavSection, NavTree } from "../../lib/navigation/types";
import { SidebarLink } from "./SidebarLink";
import { SidebarSection } from "./SidebarSection";

interface SidebarProps {
	tree: NavTree;
	className?: string;
	onLinkClick?: () => void;
}

/**
 * Returns the labels of all ancestor sections that contain a page matching
 * the given path. Used to auto-open the relevant sections on navigation.
 */
function findSectionsForPath(
	items: readonly NavItem[],
	path: string,
): string[] {
	const labels: string[] = [];

	for (const item of items) {
		if (item.kind === "page") continue;

		const section = item as NavSection;
		const childLabels = findSectionsForPath(section.items, path);

		// Does this section (or any of its descendants) contain the active page?
		const directMatch = section.items.some(
			(child) => child.kind === "page" && child.path === path,
		);

		if (directMatch || childLabels.length > 0) {
			labels.push(section.label, ...childLabels);
		}
	}

	return labels;
}

export function Sidebar({ tree, className, onLinkClick }: SidebarProps) {
	const location = useLocation();
	const { openSections, toggleSection, openSection, setMobileOpen } =
		useSidebarState();

	// Auto-open ancestor sections whenever the active path changes.
	useEffect(() => {
		const sectionsToOpen = findSectionsForPath(tree.items, location.pathname);
		for (const label of sectionsToOpen) {
			openSection(label);
		}
	}, [location.pathname, tree.items, openSection]);

	function handleLinkClick() {
		setMobileOpen(false);
		onLinkClick?.();
	}

	return (
		<nav
			className={`flex-1 space-y-1 select-none ${className || ""}`}
			aria-label="Sidebar navigation"
		>
			<ul className="space-y-1 list-none p-0 m-0">
				{tree.items.map((item) =>
					item.kind === "page" ? (
						<li key={item.path}>
							<SidebarLink page={item} depth={0} onClick={handleLinkClick} />
						</li>
					) : (
						<SidebarSection
							key={item.label}
							section={item}
							depth={0}
							isOpen={openSections.has(item.label)}
							onToggle={() => toggleSection(item.label)}
							onLinkClick={handleLinkClick}
							openSections={openSections}
							onSectionToggle={toggleSection}
						/>
					),
				)}
			</ul>
		</nav>
	);
}
