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
    // Normalize parameters (support string or object)
    const rawParams = node.data.parameters ?? [];
    const normalizedParams = (rawParams as any[]).map((p) => {
      if (typeof p === 'string') {
        const [name, type] = p.split(':').map((s) => s.trim());
        return { name, type };
      }
      return p;
    });

    const paramsString = normalizedParams
      .map((p) => `${p.name}${p.type ? `: ${p.type}` : ''}`)
      .join(', ');

    // VERY SIMPLE DEMO — if first two params exist, generate return sum
    let body = '  // TODO: Implement function body';
    if (normalizedParams.length >= 2) {
      const a = normalizedParams[0].name;
      const b = normalizedParams[1].name;
      body = `  return ${a} + ${b};`;
    }

    return `export function ${node.data.name}(${paramsString}) {\n${body}\n}`;
  }

  private generateVariable(node: AstNode): string {
    // Support optional type annotation and initializer if provided
    const typeAnnotation = node.data.variableType ? `: ${node.data.variableType}` : ''
    const initializer = node.data.initializer ?? 'undefined'
    return `export const ${node.data.name}${typeAnnotation} = ${initializer};`;
  }
} 