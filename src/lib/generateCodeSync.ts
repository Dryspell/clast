import { CodeGenerator } from './ast/generator'
import { AstNode } from './ast/types'

export function generateCodeSync(nodes: AstNode[]): string {
  try {
    const generator = new CodeGenerator()
    return generator.generateCode(nodes)
  } catch (err) {
    console.error('Code generation failed:', err)
    return '// Error generating code'
  }
} 