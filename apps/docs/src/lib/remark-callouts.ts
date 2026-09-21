interface AstNode {
	type: string;
	value?: string;
	children?: AstNode[];
	attributes?: Array<{ type: string; name: string; value: string }>;
	name?: string;
}

interface AstTree {
	type: string;
	children: AstNode[];
}

export function remarkCallouts() {
	return (tree: AstTree) => {
		if (!tree || !Array.isArray(tree.children)) return;

		const newChildren: AstNode[] = [];
		let i = 0;

		while (i < tree.children.length) {
			const node = tree.children[i];

			if (
				node.type === "paragraph" &&
				Array.isArray(node.children) &&
				node.children.length > 0
			) {
				const firstChild = node.children[0];
				if (
					firstChild.type === "text" &&
					typeof firstChild.value === "string"
				) {
					const match = firstChild.value.match(/^:::(\w+)(?:\[(.*?)\])?\s*\n?/);
					if (match) {
						const type = match[1].toLowerCase();
						const title = match[2] || type.toUpperCase();

						const remainingText = firstChild.value
							.slice(match[0].length)
							.trim();
						const calloutNodes: AstNode[] = [];

						const endMatch = remainingText.match(/\n?:::\s*$/);
						if (endMatch) {
							const innerContent = remainingText
								.slice(0, endMatch.index)
								.trim();
							if (innerContent) {
								calloutNodes.push({
									type: "paragraph",
									children: [
										{ type: "text", value: innerContent },
										...node.children.slice(1),
									],
								});
							}
							newChildren.push(createCalloutElement(type, title, calloutNodes));
							i++;
							continue;
						}

						if (remainingText || node.children.length > 1) {
							calloutNodes.push({
								type: "paragraph",
								children: [
									...(remainingText
										? [{ type: "text", value: remainingText }]
										: []),
									...node.children.slice(1),
								],
							});
						}

						let j = i + 1;
						let foundClosing = false;

						while (j < tree.children.length) {
							const sib = tree.children[j];
							if (
								sib.type === "paragraph" &&
								Array.isArray(sib.children) &&
								sib.children.length > 0
							) {
								const lastChild = sib.children[sib.children.length - 1];
								if (
									lastChild.type === "text" &&
									lastChild.value &&
									/:::\s*$/.test(lastChild.value)
								) {
									const closingText = lastChild.value
										.replace(/:::\s*$/, "")
										.trim();
									if (closingText || sib.children.length > 1) {
										calloutNodes.push({
											type: "paragraph",
											children: [
												...sib.children.slice(0, -1),
												...(closingText
													? [{ type: "text", value: closingText }]
													: []),
											],
										});
									}
									foundClosing = true;
									j++;
									break;
								}
							}
							calloutNodes.push(sib);
							j++;
						}

						if (foundClosing) {
							newChildren.push(createCalloutElement(type, title, calloutNodes));
							i = j;
							continue;
						}
					}
				}
			}

			newChildren.push(node);
			i++;
		}

		tree.children = newChildren;
	};
}

const borderStyles: Record<string, string> = {
	note: "border-violet-500/30 bg-violet-500/[0.06] text-violet-200",
	info: "border-sky-500/30 bg-sky-500/[0.06] text-sky-200",
	tip: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200",
	caution: "border-amber-500/30 bg-amber-500/[0.06] text-amber-200",
	warning: "border-amber-500/30 bg-amber-500/[0.06] text-amber-200",
	danger: "border-red-500/30 bg-red-500/[0.06] text-red-200",
};

const titleColors: Record<string, string> = {
	note: "text-violet-400",
	info: "text-sky-400",
	tip: "text-emerald-400",
	caution: "text-amber-400",
	warning: "text-amber-400",
	danger: "text-red-400",
};

function createCalloutElement(
	type: string,
	title: string,
	children: AstNode[],
): AstNode {
	const asideClass = `my-6 rounded-2xl border p-5 shadow-xl shadow-black/20 backdrop-blur-sm not-prose ${
		borderStyles[type] || borderStyles.note
	}`;
	const titleClass = `font-medium text-sm mb-2 ${
		titleColors[type] || titleColors.note
	}`;

	const titleNode: AstNode = {
		type: "mdxJsxFlowElement",
		name: "div",
		attributes: [
			{ type: "mdxJsxAttribute", name: "className", value: titleClass },
		],
		children: [{ type: "text", value: title }],
	};

	const bodyNode: AstNode = {
		type: "mdxJsxFlowElement",
		name: "div",
		attributes: [
			{
				type: "mdxJsxAttribute",
				name: "className",
				value:
					"text-sm text-zinc-300 leading-relaxed [&>p]:my-1.5 [&>pre]:my-2",
			},
		],
		children,
	};

	return {
		type: "mdxJsxFlowElement",
		name: "aside",
		attributes: [
			{ type: "mdxJsxAttribute", name: "className", value: asideClass },
		],
		children: [titleNode, bodyNode],
	};
}
