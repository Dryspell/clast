'use client'

import { MDXProvider } from '@mdx-js/react'
import { ReactNode } from 'react'

const components = {
  h1: (props: any) => (
    <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-3xl font-semibold mt-6 mb-3" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-2xl font-semibold mt-4 mb-2" {...props} />
  ),
  p: (props: any) => (
    <p className="my-4 leading-7" {...props} />
  ),
  ul: (props: any) => (
    <ul className="list-disc list-inside my-4 space-y-2" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-inside my-4 space-y-2" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic" {...props} />
  ),
  code: (props: any) => (
    <code className="bg-gray-100 rounded px-1 py-0.5 text-sm" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-gray-100 rounded p-4 my-4 overflow-x-auto" {...props} />
  ),
  div: (props: any) => {
    if (props.className?.includes('admonition')) {
      return <div {...props} className={`${props.className} my-4`} />
    }
    return <div {...props} />
  }
}

export function MDXClientWrapper({ children }: { children: ReactNode }) {
  return (
    <MDXProvider components={components}>
      <div className="prose prose-lg max-w-none dark:prose-invert">
        {children}
      </div>
    </MDXProvider>
  )
} 