export interface AstNode {
  id: string
  type: string
  /** Parent node id when this node is scoped inside another (e.g., variable inside function) */
  parentId?: string
  data: {
    name: string
    parameters?: Array<{ name: string; type?: string }> | string[]
    members?: Array<{ name: string; type: string }>
    /** Specific to variable nodes */
    variableType?: string
    initializer?: string
    /** binary op etc */
    operator?: string
    /** Function return type */
    returnType?: string
    /** For async functions */
    async?: boolean
    /** For literal nodes */
    value?: string
    literalType?: 'string' | 'number' | 'boolean'
    /** For binary operation nodes */
    lhs?: string
    rhs?: string
    /** For console nodes */
    valueExpr?: string
    /** For call nodes */
    funcName?: string
    args?: string[]
    /** For property access */
    property?: string
    objExpr?: string
    /** Original function body (raw text) when parsed from code */
    body?: string
    /** For object literal nodes */
    properties?: Array<{ key: string; value?: string }>
  }
} 