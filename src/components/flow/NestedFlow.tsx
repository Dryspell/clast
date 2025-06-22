import React from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Background,
  Controls,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';

export interface ScopeItem {
  id: string;
  name: string;
  type: 'variable' | 'function' | 'import';
  value?: string;
}

export interface NestedFlowData {
  nodes: Node[];
  edges: Edge[];
  scope: ScopeItem[];
}

interface NestedFlowProps {
  data: NestedFlowData;
  nodeTypes: NodeTypes;
  edgeTypes?: EdgeTypes;
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onScopeItemClick?: (item: ScopeItem) => void;
}

export function NestedFlow({
  data,
  nodeTypes,
  edgeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onScopeItemClick,
}: NestedFlowProps) {
  return (
    <div className="relative h-full w-full min-h-[300px]">
      {/* Scope Panel */}
      <div className="absolute left-2 top-2 z-10 w-40 rounded-lg border bg-card p-2 shadow-sm">
        <div className="text-xs font-medium text-muted-foreground mb-2">Available Scope</div>
        <div className="space-y-1">
          {data.scope.map((item) => (
            <button
              key={item.id}
              className="w-full rounded-md px-2 py-1 text-left text-xs hover:bg-accent transition-colors"
              onClick={() => onScopeItemClick?.(item)}
            >
              <span className="inline-block w-16 truncate">{item.name}</span>
              <span className="float-right text-muted-foreground">{item.type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flow Canvas – isolated provider to avoid clobbering parent flow */}
      <ReactFlowProvider>
        <ReactFlow
          nodes={data.nodes}
          edges={data.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-background"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

// Helper function to create a new nested flow data structure
export function createNestedFlowData(): NestedFlowData {
  return {
    nodes: [],
    edges: [],
    scope: []
  };
}

// Helper function to add a scope item
export function addScopeItem(
  data: NestedFlowData,
  name: string,
  type: ScopeItem['type'],
  value?: string
): NestedFlowData {
  return {
    ...data,
    scope: [
      ...data.scope,
      {
        id: `scope-${Date.now()}`,
        name,
        type,
        value
      }
    ]
  };
}

// Helper function to add a node to the nested flow
export function addNode(
  data: NestedFlowData,
  node: Node
): NestedFlowData {
  return {
    ...data,
    nodes: [...data.nodes, node]
  };
}

// Helper function to add an edge to the nested flow
export function addEdge(
  data: NestedFlowData,
  edge: Edge
): NestedFlowData {
  return {
    ...data,
    edges: [...data.edges, edge]
  };
} 