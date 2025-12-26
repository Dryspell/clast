"use client";

import "@xyflow/react/dist/style.css";

import React, { useRef, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node as RFNode,
  Edge as RFEdge,
} from '@xyflow/react'
import { AstNode } from '@/lib/ast/types'
import { useNodeFactory } from './hooks/useNodeFactory'
import { useConnectHandler } from './hooks/useConnectHandler'
import { FlowContextMenu } from "./FlowContextMenu";

// Inline node component map to avoid indirection barrel file
import { FunctionNode } from "./nodes/FunctionNode";
import { VariableNode } from "./nodes/VariableNode";
import { InterfaceNode } from "./nodes/InterfaceNode";
import { ApiNode } from "./nodes/ApiNode";
import { BinaryOpNode } from "./nodes/BinaryOpNode";
import { LiteralNode } from "./nodes/LiteralNode";
import { ConsoleNode } from "./nodes/ConsoleNode";
import { CallNode } from "./nodes/CallNode";
import { PropertyAccessNode } from "./nodes/PropertyAccessNode";
import { ObjectNode } from "./nodes/ObjectNode";
import { LabeledGroupNode } from "./nodes/LabeledGroupNode";
import { ConditionalNode } from "./nodes/ConditionalNode";

// Consolidated React Flow nodeTypes map
const nodeTypes = {
  function: FunctionNode,
  variable: VariableNode,
  interface: InterfaceNode,
  api: ApiNode,
  binaryOp: BinaryOpNode,
  literal: LiteralNode,
  console: ConsoleNode,
  call: CallNode,
  propertyAccess: PropertyAccessNode,
  object: ObjectNode,
  group: LabeledGroupNode,
  conditional: ConditionalNode,
} as const;

interface Props {
  flowId?: string
  nodes: RFNode<any>[]
  setNodes: React.Dispatch<React.SetStateAction<RFNode<any>[]>>
  edges: RFEdge<any>[]
  setEdges: React.Dispatch<React.SetStateAction<RFEdge<any>[]>>
  onNodesExternalChange?: (nodes: AstNode[]) => void
  /** Optional callbacks from useFlowSync that also persist to Convex */
  onNodesChange?: (changes: NodeChange[]) => void
  onEdgesChange?: (changes: EdgeChange[]) => void
  errorIds?: Set<string>
}

export function FlowCanvas({
  flowId,
  nodes,
  setNodes,
  edges,
  setEdges,
  onNodesExternalChange,
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  errorIds,
}: Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const createNode = useNodeFactory(flowId, setNodes)

  const onConnect = useConnectHandler({ flowId, nodes, setNodes, setEdges })

  // Fallback local-only handlers when persistence-aware callbacks are not supplied
  const defaultOnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes]
  )

  const defaultOnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setEdges]
  )

  const handleNodesChange = onNodesChangeProp ?? defaultOnNodesChange
  const handleEdgesChange = onEdgesChangeProp ?? defaultOnEdgesChange

  // propagate nodes upward when asked
  useEffect(() => {
    onNodesExternalChange?.(nodes as any)
  }, [nodes, onNodesExternalChange])

  const displayedNodes = React.useMemo(() => {
    if (!errorIds || errorIds.size === 0) return nodes;
    return nodes.map(n => errorIds.has(n.id) ? { ...n, style: { ...n.style, border: '2px solid #dc2626' } } : n);
  }, [nodes, errorIds]);

  return (
    <FlowContextMenu onCreate={createNode} wrapperRef={reactFlowWrapper}>
      <div className="w-full h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={displayedNodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes as any}
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>
      </div>
    </FlowContextMenu>
  );
} 