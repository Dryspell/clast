'use server'

import { CodeGenerator } from '../ast/generator'
import { AstNode } from '../ast/types'

export async function generateCode(nodes: AstNode[]): Promise<string> {
  try {
    const generator = new CodeGenerator()
    return generator.generateCode(nodes)
  } catch (error) {
    console.error('Error generating code:', error)
    return '// Error generating code. Please check the console for details.'
  }
} 