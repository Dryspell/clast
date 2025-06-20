export interface AstNode {
  id: string
  type: string
  data: {
    name: string
    parameters?: Array<{ name: string; type?: string }>
    members?: Array<{ name: string; type: string }>
  }
} 