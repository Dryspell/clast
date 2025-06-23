import { NodeTypes } from '@xyflow/react';
import { FunctionNode } from './nodes/FunctionNode';
import { VariableNode } from './nodes/VariableNode';
import { InterfaceNode } from './nodes/InterfaceNode';
import { ApiNode } from './nodes/ApiNode';
import { BinaryOpNode } from './nodes/BinaryOpNode'
import { LiteralNode } from './nodes/LiteralNode'
import { ConsoleNode } from './nodes/ConsoleNode'
import { CallNode } from './nodes/CallNode'
import { PropertyAccessNode } from './nodes/PropertyAccessNode'

export const nodeTypes = {
  function: FunctionNode,
  variable: VariableNode,
  interface: InterfaceNode,
  api: ApiNode,
  binaryOp: BinaryOpNode,
  literal: LiteralNode,
  console: ConsoleNode,
  call: CallNode,
  propertyAccess: PropertyAccessNode,
} as const;

export type CustomNodeTypes = typeof nodeTypes;

// Ensure our node types satisfy the ReactFlow NodeTypes interface
export type ValidNodeTypes = NodeTypes & CustomNodeTypes; 