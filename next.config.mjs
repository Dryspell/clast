import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkCodeTitles from "remark-code-titles";
import remarkToc from "remark-toc";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";

// Custom plugin to transform directives into admonitions
function remarkAdmonitions() {
	const ADMONITION_TYPES = ["note", "tip", "info", "warning", "danger"];

	function transformer(tree, file) {
		if (!tree || typeof tree !== "object") {
			console.log("Invalid tree received:", tree);
			return tree;
		}

		visit(tree, "containerDirective", (node) => {
			if (!node || typeof node !== "object") {
				console.log("Invalid node:", node);
				return;
			}

			const type = node.name;
			if (!type || !ADMONITION_TYPES.includes(type)) {
				console.log("Invalid type:", type);
				return;
			}

			// Find the title by looking for a paragraph with directiveLabel
			let title;
			if (node.children && node.children.length > 0) {
				const firstChild = node.children[0];
				if (firstChild.type === "paragraph" && firstChild.data?.directiveLabel) {
					title = firstChild.children[0].value;
					// Remove the label paragraph from children
					node.children = node.children.slice(1);
				}
			}

			// Add the appropriate classes
			node.data = node.data || {};
			node.data.hName = "div";
			node.data.hProperties = {
				className: `contains-directive directive-${type}`,
				"data-title": title || undefined,
			};
		});

		return tree;
	}

	return transformer;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
	experimental: {
		mdxRs: false,
	},
	webpack(config) {
		// Prevent bundling of Node-specific modules required by ts-morph
		config.resolve = config.resolve || {};
		config.resolve.fallback = {
			...(config.resolve.fallback || {}),
			fs: false,
			path: false,
			os: false,
			crypto: false,
		};

		// Suppress "Critical dependency: the request of a dependency is an expression"
		// warnings that arise from ts-morph/TypeScript's dynamic `require()` calls.
		// These are safe to ignore in a browser-only bundle because our `fs/path/os` stubs
		// above ensure the modules are never actually executed client-side.
		// See https://github.com/microsoft/TypeScript/issues/39436 for details.
		config.module.exprContextCritical = false;
		config.module.unknownContextCritical = false;

		return config;
	},
};

const withMDX = createMDX({
	options: {
		remarkPlugins: [
			remarkGfm,
			remarkDirective,
			remarkCodeTitles,
			remarkToc,
			remarkAdmonitions,
		],
		rehypePlugins: [
			rehypeSlug,
			[rehypeAutolinkHeadings, { behavior: "wrap" }],
		],
	},
});

export default withMDX(nextConfig);
