import { Node, Edge } from 'reactflow';
import { FlowNodeData, FlowEdgeData } from '@/lib/ast/flow-converter';

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge<FlowEdgeData>;

export interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  data?: FlowEdgeData;
}

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