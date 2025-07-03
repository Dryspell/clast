import { Node, Edge } from '@xyflow/react';

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge<{
  label?: string;
  type?: string;
}>;

export interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: FlowNode | null;
}

export interface NodeFormData {
  name?: string;
  type?: string;
  parameters?: Array<{ name: string; type?: string }>;
  returnType?: string;
  members?: Array<{ name: string; type: string; isOptional?: boolean }>;
  initializer?: string;
  isAsync?: boolean;
  isExported?: boolean;
}

// Consolidated data type for all node variations used in the Flow editor.
// TODO: Replace `any` with precise union of all node data interfaces.
export type NodeData = Record<string, any>; 