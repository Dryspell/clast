import { AstNode } from './types';
import { Node } from '@xyflow/react';
import { NodeData } from '@/components/flow/node-editor';

export type FlowNodeData = NodeData;
export type FlowEdgeData = {
  label?: string;
  type?: string;
};

// Base parameter type with required name
export type BaseParameter = {
  name: string;
};

// Function parameter extends base with optional type
export type FunctionParameter = BaseParameter & {
  type?: string;
};

// Member requires both name and type
export type Member = BaseParameter & {
  type: string;
};

/**
 * Type guard to check if a value is a valid base parameter
 */
const isBaseParameter = (value: unknown): value is BaseParameter => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as BaseParameter).name === 'string'
  );
};

/**
 * Type guard to check if a value is a valid function parameter
 */
const isFunctionParameter = (value: unknown): value is FunctionParameter => {
  return (
    isBaseParameter(value) &&
    (!('type' in value) || typeof (value as FunctionParameter).type === 'string')
  );
};

/**
 * Type guard to check if a value is a valid member
 */
const isMember = (value: unknown): value is Member => {
  return (
    isBaseParameter(value) &&
    'type' in value &&
    typeof (value as Member).type === 'string'
  );
};

/**
 * Type guard to check if the node has string parameters
 */
const hasFunctionStringParameters = (node: Node<FlowNodeData>): node is Node<FlowNodeData> & { data: { parameters: string; type: 'function' } } => {
  return (
    node.data.type === 'function' &&
    'parameters' in node.data &&
    typeof node.data.parameters === 'string'
  );
};

/**
 * Type guard to check if the node has array parameters
 */
const hasFunctionArrayParameters = (node: Node<FlowNodeData>): node is Node<FlowNodeData> & { data: { parameters: unknown[] } } => {
  return (
    'parameters' in node.data &&
    Array.isArray(node.data.parameters)
  );
};

/**
 * Convert parameters from a flow node into a standardized format
 */
const convertParameters = (flowNode: Node<FlowNodeData>): FunctionParameter[] => {
  if (hasFunctionStringParameters(flowNode)) {
    // Parse function parameters from string (e.g. "id: string, name: string")
    return flowNode.data.parameters.split(',')
      .map((param, index) => {
        const parts = param.trim().split(':').map(s => s.trim());
        const parameter: FunctionParameter = {
          name: parts[0] || `param${index + 1}`
        };
        if (parts[1]) {
          parameter.type = parts[1];
        }
        return parameter;
      })
      .filter(isBaseParameter);
  }

  if (hasFunctionArrayParameters(flowNode)) {
    return flowNode.data.parameters
      .map((param, index) => {
        if (!isFunctionParameter(param)) {
          return {
            name: `param${index + 1}`
          };
        }
        return param;
      })
      .filter(isBaseParameter);
  }

  return [];
};

/**
 * Type guard to check if node data has a valid name
 */
const hasValidName = (data: FlowNodeData): data is FlowNodeData & { name: string } => {
  return 'name' in data && typeof data.name === 'string';
};

/**
 * Type guard to check if node data has valid members
 */
const hasValidMembers = (data: FlowNodeData): data is FlowNodeData & { members: unknown[] } => {
  return 'members' in data && Array.isArray(data.members);
};

/**
 * Convert a single flow node to an AST node
 */
const convertNode = (flowNode: Node<FlowNodeData>): AstNode => {
  // Use type guard to check name
  const name = hasValidName(flowNode.data) ? flowNode.data.name : 'unnamed';

  // Use type guard to check and filter members
  const members = hasValidMembers(flowNode.data)
    ? flowNode.data.members.filter((member): member is Member => isMember(member))
    : [];

  return {
    id: flowNode.id,
    type: flowNode.type || 'default',
    data: {
      name,
      parameters: convertParameters(flowNode),
      members
    }
  };
};

/**
 * Convert flow nodes to AST nodes
 */
export const convertToAst = (flowNodes: Node<FlowNodeData>[]): AstNode[] => {
  return flowNodes.map(convertNode);
}; 