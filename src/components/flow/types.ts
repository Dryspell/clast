import { Node, Edge } from '@xyflow/react';
import { NodeData } from './node-editor';

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