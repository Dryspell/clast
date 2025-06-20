'use client'

import React, { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '../ui/button'
import { generateId } from '@/lib/utils'
import { FunctionNode } from './nodes/FunctionNode'
import { VariableNode } from './nodes/VariableNode'
import { InterfaceNode } from './nodes/InterfaceNode'
import { ApiNode } from './nodes/ApiNode'
import { CodePreview } from './CodePreview'
import { Parser } from '@/lib/ast/parser'
import { AstNode } from '@/lib/ast/types'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { Variable, FunctionSquare, Box, Globe } from 'lucide-react'

// Custom node types
const nodeTypes = {
  function: FunctionNode,
  variable: VariableNode,
  interface: InterfaceNode,
  api: ApiNode,
}

export interface FlowEditorProps {
  onSave?: (code: string) => void
  initialCode?: string
}

export function FlowEditor({ onSave, initialCode = '' }: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [code, setCode] = useState(initialCode)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const prevNodesRef = useRef<Node[]>([])

  // Function to check if node data (not position) has changed
  const hasNodeDataChanged = useCallback((oldNodes: Node[], newNodes: Node[]) => {
    if (oldNodes.length !== newNodes.length) return true;
    
    return newNodes.some((newNode, i) => {
      const oldNode = oldNodes[i];
      // Only compare the data object, not position
      return JSON.stringify(newNode.data) !== JSON.stringify(oldNode.data);
    });
  }, []);

  // Handle node changes and detect meaningful updates
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // After the state updates, check if we had meaningful changes
    setNodes(currentNodes => {
      const hadMeaningfulChanges = hasNodeDataChanged(prevNodesRef.current, currentNodes);
      prevNodesRef.current = currentNodes;
      return currentNodes;
    });
  }, [onNodesChange, hasNodeDataChanged]);

  // Parse initial code into AST nodes
  React.useEffect(() => {
    if (initialCode) {
      const parser = new Parser()
      const astNodes = parser.parseCode(initialCode)
      const flowNodes = astNodes.map((node: AstNode) => ({
        id: node.id,
        type: node.type,
        position: { x: 0, y: 0 }, // We'll need to implement proper layout
        data: node.data,
      }))
      setNodes(flowNodes)
    }
  }, [initialCode])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  )

  const createNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: generateId(),
        type,
        position,
        data: {
          name: `New${type.charAt(0).toUpperCase() + type.slice(1)}`,
          parameters: [],
          members: [],
        },
      }

      setNodes((nds: Node[]) => nds.concat(newNode))
    },
    [setNodes]
  )

  const handleContextMenuSelect = useCallback(
    (type: string) => {
      if (!reactFlowWrapper.current) return

      // Get the center of the viewport for new node placement
      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = {
        x: bounds.width / 2,
        y: bounds.height / 2,
      }

      createNode(type, position)
    },
    [createNode]
  )

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      if (onSave) {
        onSave(newCode)
      }
    },
    [onSave]
  )

  return (
    <div className="grid h-full grid-cols-[1fr_400px]">
      <ContextMenu>
        <ContextMenuTrigger className="h-full">
          <div className="h-full w-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background />
            </ReactFlow>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onSelect={() => handleContextMenuSelect('variable')}
            className="flex items-center gap-2"
          >
            <Variable className="h-4 w-4" />
            <span>Add Variable</span>
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => handleContextMenuSelect('function')}
            className="flex items-center gap-2"
          >
            <FunctionSquare className="h-4 w-4" />
            <span>Add Function</span>
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => handleContextMenuSelect('interface')}
            className="flex items-center gap-2"
          >
            <Box className="h-4 w-4" />
            <span>Add Interface</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => handleContextMenuSelect('api')}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span>Add API Endpoint</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <CodePreview
        nodes={nodes as unknown as AstNode[]}
        onCodeChange={handleCodeChange}
        shouldRegenerate={hasNodeDataChanged(prevNodesRef.current, nodes)}
      />
    </div>
  )
} 