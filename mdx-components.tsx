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
    <svg viewBox="0 0 14 16" className="w-5 h-5">
      <path fillRule="evenodd" d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z" />
    </svg>
  ),
  tip: (
    <svg viewBox="0 0 12 16" className="w-5 h-5">
      <path fillRule="evenodd" d="M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 2.48 0 4.5 1.8 4.5 4 0 .65-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 14 16" className="w-5 h-5">
      <path fillRule="evenodd" d="M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 16 16" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"/>
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 12 16" className="w-5 h-5">
      <path fillRule="evenodd" d="M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"/>
    </svg>
  ),
} as const

// Admonition component
function Admonition({ type = 'note', title, children, className }: AdmonitionProps) {
  const Icon = icons[type]
  const classes = {
    note: {
      container: 'bg-blue-50 dark:bg-blue-950/50 border-blue-500/30 dark:border-blue-500/20',
      accent: 'bg-blue-500 dark:bg-blue-400',
      icon: 'text-blue-500 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-200',
      content: 'text-blue-800 dark:text-blue-200'
    },
    tip: {
      container: 'bg-green-50 dark:bg-green-950/50 border-green-500/30 dark:border-green-500/20',
      accent: 'bg-green-500 dark:bg-green-400',
      icon: 'text-green-500 dark:text-green-400',
      title: 'text-green-900 dark:text-green-200',
      content: 'text-green-800 dark:text-green-200'
    },
    info: {
      container: 'bg-slate-50 dark:bg-slate-950/50 border-slate-500/30 dark:border-slate-500/20',
      accent: 'bg-slate-500 dark:bg-slate-400',
      icon: 'text-slate-500 dark:text-slate-400',
      title: 'text-slate-900 dark:text-slate-200',
      content: 'text-slate-800 dark:text-slate-200'
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-950/50 border-amber-500/30 dark:border-amber-500/20',
      accent: 'bg-amber-500 dark:bg-amber-400',
      icon: 'text-amber-500 dark:text-amber-400',
      title: 'text-amber-900 dark:text-amber-200',
      content: 'text-amber-800 dark:text-amber-200'
    },
    danger: {
      container: 'bg-red-50 dark:bg-red-950/50 border-red-500/30 dark:border-red-500/20',
      accent: 'bg-red-500 dark:bg-red-400',
      icon: 'text-red-500 dark:text-red-400',
      title: 'text-red-900 dark:text-red-200',
      content: 'text-red-800 dark:text-red-200'
    }
  } as const

  const typeClasses = classes[type]

  return (
    <div className={clsx(
      'relative rounded-lg border my-6',
      typeClasses.container,
      className
    )}>
      {/* Left accent border */}
      <div className={clsx(
        'absolute left-0 top-0 h-full w-1 rounded-l-lg',
        typeClasses.accent
      )} />
      
      <div className="relative px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={typeClasses.icon}>
            {Icon}
          </span>
          <span className={clsx(
            'font-semibold uppercase text-sm tracking-wide',
            typeClasses.title
          )}>
            {title || type}
          </span>
        </div>
        <div className={clsx(
          'mt-2 prose dark:prose-invert max-w-none',
          typeClasses.content
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Wrap the entire content in a prose container
    wrapper: ({ children }) => (
      <div className="prose dark:prose-invert max-w-none">
        {children}
      </div>
    ),
    // Remove custom styling from base components to let prose handle it
    h1: ({ children }) => <h1>{children}</h1>,
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    p: ({ children }) => <p>{children}</p>,
    ul: ({ children }) => <ul>{children}</ul>,
    ol: ({ children }) => <ol>{children}</ol>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    code: ({ children }) => <code>{children}</code>,
    pre: ({ children }) => (
      <pre className="bg-muted text-muted-foreground rounded-lg">
        {children}
      </pre>
    ),
    // Add support for admonitions/custom divs
    div: ({ className, children, ...props }) => {
      // Handle container directives (:::)
      if (className?.includes('contains-directive')) {
        const type = className.match(/directive-(note|tip|info|warning|danger)/)?.[1]
        if (type) {
          const title = props['data-title']
          const otherClasses = className
            .split(' ')
            .filter((cls: string) => !cls.includes('directive-') && cls !== 'contains-directive')
            .join(' ')
          return (
            <Admonition 
              type={type as AdmonitionType} 
              title={title} 
              className={otherClasses}
            >
              {children}
            </Admonition>
          )
        }
      }
      return <div className={className} {...props}>{children}</div>
    },
    ...components,
  }
} 