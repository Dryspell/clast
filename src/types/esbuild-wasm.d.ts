declare module 'esbuild-wasm' {
  export interface TransformOptions {
    loader?: string
    format?: string
    sourcemap?: boolean | 'inline'
    [key: string]: any
  }

  export interface TransformResult {
    code: string
    map?: string
  }

  export interface InitializeOptions {
    wasmURL: string
    worker?: boolean
  }

  export function transform(code: string, options: TransformOptions): Promise<TransformResult>
  export function initialize(options: InitializeOptions): Promise<void>
} 