declare module '*.mdx' {
  import type { ComponentProps, ComponentType } from 'react'
  
  export const frontMatter: Record<string, unknown>
  
  const MDXComponent: ComponentType<ComponentProps<'div'>>
  export default MDXComponent
} 