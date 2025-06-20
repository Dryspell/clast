import { AstNode } from './types';

/**
 * Simple TypeScript parser that creates AST nodes from code
 */
export class Parser {
  /**
   * Parse TypeScript code into AST nodes
   */
  parseCode(code: string): AstNode[] {
    const nodes: AstNode[] = [];
    // For now return empty array - we'll implement proper parsing later
    // This will be replaced with a proper parser that doesn't rely on ts-morph
    return nodes;
  }
} 