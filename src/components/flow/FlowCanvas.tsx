"use client";

import "@xyflow/react/dist/style.css";

import React, { useRef, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
} from "@xyflow/react";
import { AstNode } from "@/lib/ast/types";
import { useFlowSync } from "./hooks/useFlowSync";
import { useNodeFactory } from "./hooks/useNodeFactory";
import { useConnectHandler } from "./hooks/useConnectHandler";
import { useDemoFlow } from "./hooks/useDemoFlow";
import { FlowContextMenu } from "./FlowContextMenu";
import { nodeTypes } from "./node-types"; // We'll need to export.
import { Parser } from "@/lib/ast/parser";

interface Props {
  flowId?: string;
  initialCode?: string;
  onNodesChange?: (nodes: AstNode[]) => void;
}

export function FlowCanvas({ flowId, initialCode, onNodesChange }: Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const {
    nodes,
    setNodes,
    onNodesChange: flowSyncOnNodesChange,
    edges,
    setEdges,
    onEdgesChange,
  } = useFlowSync(flowId);

  // attach demo flow when appropriate
  useDemoFlow({ initialCode, nodes, setNodes, setEdges });

  // Parse `initialCode` into flow nodes when provided.
  useEffect(() => {
    if (initialCode && nodes.length === 0) {
      try {
        const parser = new Parser();
        const astNodes = parser.parseCode(initialCode);
        const flowNodes = astNodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          position: { x: 0, y: 0 },
          data: node.data,
        }));
        if (flowNodes.length > 0) {
          setNodes(flowNodes as any);
        }
      } catch (err) {
        console.error("Failed to parse initial code", err);
      }
    }
  }, [initialCode]);

  const createNode = useNodeFactory(flowId, setNodes);

  const onConnect = useConnectHandler({ flowId, nodes, setNodes, setEdges });

  // Propagate node list upwards when asked
  useEffect(() => {
    onNodesChange?.(nodes as any);
  }, [nodes, onNodesChange]);

  return (
    <FlowContextMenu onCreate={createNode} wrapperRef={reactFlowWrapper}>
      <div className="h-full w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={flowSyncOnNodesChange}
          onEdgesChange={onEdgesChange}
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