interface AstNode {
	type: string;
	lang?: string;
	meta?: string;
	value?: string;
	children?: AstNode[];
	attributes?: Array<{ type: string; name: string; value: string }>;
	name?: string;
}

interface AstTree {
	type: string;
	children: AstNode[];
}

function walkAndTransform(node: AstNode) {
	if (!node || !Array.isArray(node.children)) return;

	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		if (!child) continue;

		if (child.type === "code" && child.lang === "mermaid") {
			const chartValue = child.value || "";
			const metaValue = child.meta || "";

			const attributes: Array<{ type: string; name: string; value: string }> = [
				{
					type: "mdxJsxAttribute",
					name: "chart",
					value: chartValue,
				},
			];

			if (metaValue) {
				attributes.push({
					type: "mdxJsxAttribute",
					name: "title",
					value: metaValue.replace(/^title=["']?|["']?$/g, ""),
				});
			}

			node.children[i] = {
				type: "mdxJsxFlowElement",
				name: "Mermaid",
				attributes,
				children: [],
			};
		} else {
			walkAndTransform(child);
		}
	}
}

export function remarkMermaid() {
	return (tree: AstTree) => {
		if (!tree || !Array.isArray(tree.children)) return;
		walkAndTransform(tree as unknown as AstNode);
	};
}
