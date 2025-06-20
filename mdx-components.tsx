import type { MDXComponents } from 'mdx/types'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type AdmonitionType = 'note' | 'tip' | 'info' | 'warning' | 'danger'

interface AdmonitionProps {
  type?: AdmonitionType
  title?: ReactNode
  children: ReactNode
  className?: string
}

// Icons for admonitions
const icons = {
  note: (
    <svg viewBox="0 0 14 16" className="w-4 h-4">
      <path fillRule="evenodd" d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z" />
    </svg>
  ),
  tip: (
    <svg viewBox="0 0 12 16" className="w-4 h-4">
      <path fillRule="evenodd" d="M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 2.48 0 4.5 1.8 4.5 4 0 .65-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 14 16" className="w-4 h-4">
      <path fillRule="evenodd" d="M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 16 16" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"/>
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 12 16" className="w-4 h-4">
      <path fillRule="evenodd" d="M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"/>
    </svg>
  ),
} as const

// Admonition component
function Admonition({ type = 'note', title, children, className }: AdmonitionProps) {
  const Icon = icons[type]
  const classes = {
    note: 'bg-blue-50 border-blue-500 dark:bg-blue-950 dark:border-blue-400',
    tip: 'bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-400',
    info: 'bg-gray-50 border-gray-500 dark:bg-gray-900 dark:border-gray-400',
    warning: 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950 dark:border-yellow-400',
    danger: 'bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-400'
  } as const

  return (
    <div className={clsx(
      'border-l-4 p-4 my-4',
      classes[type],
      className
    )}>
      <div className="flex items-center gap-2 mb-2 font-semibold">
        <span className={clsx(
          'text-current',
          type === 'note' && 'text-blue-700 dark:text-blue-300',
          type === 'tip' && 'text-green-700 dark:text-green-300',
          type === 'info' && 'text-gray-700 dark:text-gray-300',
          type === 'warning' && 'text-yellow-700 dark:text-yellow-300',
          type === 'danger' && 'text-red-700 dark:text-red-300'
        )}>
          {Icon}
        </span>
        {title && <span className="font-medium">{title}</span>}
      </div>
      <div className="prose dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Customize the base heading styles
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold mt-4 mb-2">{children}</h3>
    ),
    // Style paragraphs and lists
    p: ({ children }) => (
      <p className="my-4 leading-7">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>
    ),
    // Style blockquotes and code elements
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic">{children}</blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-4 my-4 overflow-x-auto">{children}</pre>
    ),
    // Add support for admonitions/custom divs
    div: ({ className, children, ...props }) => {
      // Handle container directives (:::)
      if (className?.includes('contains-directive')) {
        const type = className.match(/directive-(note|tip|info|warning|danger)/)?.[1]
        if (type) {
          // Extract title from data-title if present
          const title = props['data-title'] || undefined
          return <Admonition type={type as AdmonitionType} title={title} {...props}>{children}</Admonition>
        }
      }
      return <div className={className} {...props}>{children}</div>
    },
    ...components,
  }
} 