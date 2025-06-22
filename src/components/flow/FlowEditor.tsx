'use client'

import React, { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node as RFNode,
  Edge as RFEdge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
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
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])
  const [code, setCode] = useState(initialCode)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const prevNodesRef = useRef<RFNode<any>[]>([])

  // Keep previous nodes reference in sync with latest nodes
  React.useEffect(() => {
    prevNodesRef.current = nodes
  }, [nodes])

  // No longer need custom change detection; CodePreview regenerates on any node change
  const hasNodeDataChanged = () => true;

  // Handle node changes and detect meaningful updates
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // After the state updates, check if we had meaningful changes
    setNodes(currentNodes => {
      const hadMeaningfulChanges = hasNodeDataChanged();
      prevNodesRef.current = currentNodes;
      return currentNodes;
    });
  }, [onNodesChange]);

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
    (params: Connection) => {
      // Add the edge visually
      setEdges((eds: RFEdge<any>[]) => addEdge(params, eds))

      // If connecting Interface -> Variable, update variableType automatically
      setNodes((nds: RFNode<any>[]) => {
        const sourceNode = nds.find(n => n.id === params.source)
        const targetNode = nds.find(n => n.id === params.target)

        if (sourceNode && targetNode && sourceNode.type === 'interface' && targetNode.type === 'variable') {
          const updated = nds.map(n =>
            n.id === targetNode.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    variableType: sourceNode.data.name,
                  },
                }
              : n
          )
          // update prev ref to prevent unnecessary regenerate loops
          prevNodesRef.current = updated
          return updated
        }
        // still sync ref
        prevNodesRef.current = nds
        return nds
      })
    },
    [setEdges, setNodes]
  )

  const createNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode: RFNode<any> = {
        id: generateId(),
        type,
        position,
        data: {
          name: `New${type.charAt(0).toUpperCase() + type.slice(1)}`,
          parameters: [],
          members: [],
        },
      }

      setNodes((nds: RFNode<any>[]) => nds.concat(newNode))
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
              nodeTypes={nodeTypes as any}
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
      />
    </div>
  )
} 