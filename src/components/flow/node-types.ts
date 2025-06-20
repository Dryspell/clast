import { NodeTypes } from '@xyflow/react';
import { FunctionNode } from './nodes/FunctionNode';
import { VariableNode } from './nodes/VariableNode';
import { InterfaceNode } from './nodes/InterfaceNode';
import { ApiNode } from './nodes/ApiNode';

export const nodeTypes = {
  function: FunctionNode,
  variable: VariableNode,
  interface: InterfaceNode,
  api: ApiNode,
} as const;

export type CustomNodeTypes = typeof nodeTypes;

// Ensure our node types satisfy the ReactFlow NodeTypes interface
export type ValidNodeTypes = NodeTypes & CustomNodeTypes; 