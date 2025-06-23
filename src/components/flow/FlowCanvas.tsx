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
import { useDemoFlow } from './hooks/useDemoFlow'
import { FlowContextMenu } from "./FlowContextMenu";
import { nodeTypes } from "./node-types"; // We'll need to export.

interface Props {
  flowId?: string
  initialCode?: string
  nodes: RFNode<any>[]
  setNodes: React.Dispatch<React.SetStateAction<RFNode<any>[]>>
  edges: RFEdge<any>[]
  setEdges: React.Dispatch<React.SetStateAction<RFEdge<any>[]>>
  onNodesExternalChange?: (nodes: AstNode[]) => void
}

export function FlowCanvas({
  flowId,
  initialCode,
  nodes,
  setNodes,
  edges,
  setEdges,
  onNodesExternalChange,
}: Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // attach demo flow when appropriate
  useDemoFlow({ initialCode, nodes, setNodes, setEdges })

  const createNode = useNodeFactory(flowId, setNodes)

  const onConnect = useConnectHandler({ flowId, nodes, setNodes, setEdges })

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setEdges]
  )

  // propagate nodes upward when asked
  useEffect(() => {
    onNodesExternalChange?.(nodes as any)
  }, [nodes, onNodesExternalChange])

  return (
    <FlowContextMenu onCreate={createNode} wrapperRef={reactFlowWrapper}>
      <div className="h-full w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes as any}
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