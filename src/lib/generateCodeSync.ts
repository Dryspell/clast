import { CodeGenerator } from './ast/generator'
import { AstNode } from './ast/types'
import prettier from 'prettier'

export async function generateCodeSync(nodes: AstNode[]): Promise<string> {
  try {
    const generator = new CodeGenerator()
    const raw = generator.generateCode(nodes)
    try {
      return await prettier.format(raw, { parser: 'typescript' })
    } catch {
      return raw
    }
  } catch (err) {
    console.error('Code generation failed:', err)
    return Promise.resolve('// Error generating code')
  }
} 