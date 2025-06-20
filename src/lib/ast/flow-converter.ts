import { AstNode } from './types';

/**
 * Converts flow nodes to AST nodes
 */
export class FlowConverter {
  /**
   * Convert flow nodes to AST nodes
   */
  convertToAst(flowNodes: any[]): AstNode[] {
    return flowNodes.map(node => this.convertNode(node));
  }

  private convertNode(flowNode: any): AstNode {
    return {
      id: flowNode.id,
      type: flowNode.type,
      data: {
        name: flowNode.data?.name || '',
        parameters: flowNode.data?.parameters || [],
        members: flowNode.data?.members || []
      }
    };
  }
} 