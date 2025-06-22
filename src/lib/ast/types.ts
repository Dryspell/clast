export interface AstNode {
  id: string
  type: string
  data: {
    name: string
    parameters?: Array<{ name: string; type?: string }> | string[]
    members?: Array<{ name: string; type: string }>
    /** Specific to variable nodes */
    variableType?: string
    initializer?: string
  }
} 