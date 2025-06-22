import { AstNode } from './types';

/**
 * Service for generating TypeScript code from AST nodes
 */
export class CodeGenerator {
  /**
   * Generate TypeScript code from AST nodes
   */
  generateCode(nodes: AstNode[]): string {
    return nodes.map(node => this.generateNode(node)).join('\n\n');
  }

  private generateNode(node: AstNode): string {
    switch (node.type) {
      case 'interface':
        return this.generateInterface(node);
      case 'function':
        return this.generateFunction(node);
      case 'variable':
        return this.generateVariable(node);
      default:
        return `// Unknown node type: ${node.type}`;
    }
  }

  private generateInterface(node: AstNode): string {
    const members = node.data.members?.map(
      member => `  ${member.name}: ${member.type};`
    ).join('\n') ?? '';

    return `export interface ${node.data.name} {\n${members}\n}`;
  }

  private generateFunction(node: AstNode): string {
    const params = node.data.parameters?.map(
      param => `${param.name}${param.type ? `: ${param.type}` : ''}`
    ).join(', ') ?? '';

    return `export function ${node.data.name}(${params}) {\n  // TODO: Implement function body\n}`;
  }

  private generateVariable(node: AstNode): string {
    // Support optional type annotation and initializer if provided
    const typeAnnotation = node.data.variableType ? `: ${node.data.variableType}` : ''
    const initializer = node.data.initializer ?? 'undefined'
    return `export const ${node.data.name}${typeAnnotation} = ${initializer};`;
  }
} 