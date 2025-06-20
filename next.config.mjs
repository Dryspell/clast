import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkCodeTitles from 'remark-code-titles'
import remarkToc from 'remark-toc'
import remarkDirective from 'remark-directive'
import { visit } from 'unist-util-visit'

// Custom plugin to transform directives into admonitions
const remarkAdmonitions = () => {
	const ADMONITION_TYPES = ['note', 'tip', 'info', 'warning', 'danger']
	return (tree) => {
		visit(tree, 'containerDirective', (node) => {
			const type = node.name
			if (!ADMONITION_TYPES.includes(type)) return

			// Get the title from the directive label if present
			const title = node.attributes?.label || undefined

			// Add the appropriate classes
			node.data = node.data || {}
			node.data.hName = 'div'
			node.data.hProperties = {
				className: `contains-directive directive-${type}`,
				'data-title': title
			}
		})
	}
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
	experimental: {
		mdxRs: true,
	},
	turbopack: {
		rules: {
			// Configure Turbopack for MDX
			"*.mdx": {
				loaders: ["@mdx-js/loader"],
				options: {
					remarkPlugins: [
						"remark-gfm",
						"remark-code-titles",
						"remark-toc",
						"remark-directive",
						remarkAdmonitions
					],
					rehypePlugins: [
						"rehype-slug",
						"rehype-autolink-headings",
					],
				},
			},
		},
	},
};

const withMDX = createMDX({
	options: {
		remarkPlugins: [
			remarkGfm,
			remarkCodeTitles,
			remarkToc,
			remarkDirective,
			remarkAdmonitions
		],
		rehypePlugins: [
			rehypeSlug,
			rehypeAutolinkHeadings,
		],
	},
})

export default withMDX(nextConfig) 