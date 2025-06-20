import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import remarkAdmonitions from 'remark-admonitions'
import remarkMath from 'remark-math'
import remarkToc from 'remark-toc'
import remarkCodeTitles from 'remark-code-titles'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrism from 'rehype-prism'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      remarkGfm,
      [remarkAdmonitions, {
        tag: ':::',
        icons: 'emoji',
        infima: false,
        customTypes: {
          tip: {
            keyword: 'tip',
            emoji: '💡',
            svg: ''
          },
          warning: {
            keyword: 'warning',
            emoji: '⚠️',
            svg: ''
          },
          danger: {
            keyword: 'danger',
            emoji: '🔥',
            svg: ''
          },
          info: {
            keyword: 'info',
            emoji: 'ℹ️',
            svg: ''
          },
          note: {
            keyword: 'note',
            emoji: '📝',
            svg: ''
          }
        }
      }],
      remarkMath,
      [remarkToc, {
        heading: 'Table of Contents',
        tight: true,
      }],
      remarkCodeTitles,
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [rehypeAutolinkHeadings, {
        behavior: 'append',
        content: {
          type: 'element',
          tagName: 'span',
          properties: { className: ['anchor-link'] },
          children: [{ type: 'text', value: ' #' }]
        }
      }],
      rehypePrism,
    ],
  },
})

export default withMDX(nextConfig) 