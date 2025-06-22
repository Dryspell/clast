'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow, Node, Edge } from '@xyflow/react'
import { Button } from '../../ui/button'
import { FunctionSquare, ArrowRight, ChevronDown, Code } from 'lucide-react'
import { VariableNode } from './VariableNode'
import { InterfaceNode } from './InterfaceNode'
import { ApiNode } from './ApiNode'
import { Input } from '../../ui/input'
import { Switch } from '../../ui/switch'
import { BinaryOpNode } from './BinaryOpNode'
import { LiteralNode } from './LiteralNode'

interface FunctionNodeProps extends NodeProps {
  data: FunctionNodeData;
  id: string;
  xPos?: number;
  yPos?: number;
}

// Local type for node data
interface FunctionNodeData {
  name: string
  returnType?: string
  parameters?: string | string[]
  async?: boolean
  text?: string
  type?: 'function'
  [key: string]: unknown
}

/**
 * TODO: Function Node Improvements
 * 1. Add expand/collapse functionality for function body preview
 * 2. Add visual indicators for parameter types (with proper type validation)
 * 3. Add validation indicators for connected parameters
 * 4. Implement view action to show full function code
 * 5. Add quick parameter addition UI
 * 6. Implement nested flow visualization for function body
 * 7. Add scope visualization for external references
 * 8. Add proper types for nested flow data
 * 9. Implement drag-and-drop for parameter reordering
 * 10. Add parameter type inference from connections
 */
const FunctionNode = memo(({ data, isConnectable, id, xPos, yPos }: FunctionNodeProps) => {
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showNestedFlow, setShowNestedFlow] = React.useState(false)
  const [isEditingParams, setIsEditingParams] = useState(false)
  const [paramsInput, setParamsInput] = useState(Array.isArray(data.parameters) ? data.parameters.join(', ') : (data.parameters as string || ''))
  const [editingReturnType, setEditingReturnType] = useState(false)
  const [returnTypeInput, setReturnTypeInput] = useState(data.returnType || '')
  const [name, setName] = useState(data.name || 'anonymous')

  const updateNodeData = React.useCallback((partial: Partial<FunctionNodeData>) => {
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...partial } } : n))
  }, [id, setNodes]);

  // Helper to normalise parameters into an array of strings
  const normalisedParameters = React.useMemo<string[]>(() => {
    if (!data.parameters) return []
    if (Array.isArray(data.parameters)) return data.parameters
    if (typeof data.parameters === 'string') {
      return data.parameters
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
    }
    return []
  }, [data.parameters])

  // Unique id for the body group (sub-flow)
  const bodyGroupId = React.useMemo(() => `body-${id}` as string, [id])

  // helper to build parameter and binary nodes inside a group and add to global flow
  const ensureBodyNodes = React.useCallback(() => {
    const existingNodes = getNodes();
    if (existingNodes.some(n => n.id === bodyGroupId)) {
      // If they exist but were hidden, unhide them
      setNodes(ns => ns.map(n => n.parentId === bodyGroupId || n.id === bodyGroupId ? { ...n, hidden: false } : n));
      setEdges(es => es.map(e => (e.target?.startsWith(`sum-${id}`) || e.id.startsWith(`e-${id}-`)) ? { ...e, hidden: false } : e));
      return;
    }

    const groupNode: Node = {
      id: bodyGroupId,
      type: 'group',
      position: { x: (xPos ?? 0) + 350, y: yPos ?? 0 },
      data: { label: 'Function Body' },
      style: {
        width: 600,
        height: 400,
        backgroundColor: 'rgba(130,130,255,0.06)',
        border: '1px dashed #9ca3af',
        borderRadius: 6,
      },
    };

    const paramNodes: Node[] = normalisedParameters.map((param, index) => {
      const [paramName, paramType] = param.split(':').map(s => s.trim());
      return {
        id: `param-${id}-${index}`,
        type: 'variable',
        parentId: bodyGroupId,
        extent: 'parent',
        position: { x: 30, y: 40 + index * 60 },
        data: {
          name: paramName,
          variableType: paramType || undefined,
          type: 'variable',
        },
      } as Node;
    });

    const nodesToAdd: Node[] = [groupNode, ...paramNodes];

    const edgesToAdd: Edge[] = [];

    if (normalisedParameters.length >= 2) {
      const sumNodeId = `sum-${id}`;
      const binaryNode: Node = {
        id: sumNodeId,
        type: 'binaryOp',
        parentId: bodyGroupId,
        extent: 'parent',
        position: { x: 250, y: 80 },
        data: { operator: '+', type: 'binaryOp' },
      };
      nodesToAdd.push(binaryNode);

      edgesToAdd.push(
        {
          id: `e-${id}-lhs`,
          source: `param-${id}-0`,
          sourceHandle: 'output',
          target: sumNodeId,
          targetHandle: 'lhs',
          type: 'default',
        } as Edge,
        {
          id: `e-${id}-rhs`,
          source: `param-${id}-1`,
          sourceHandle: 'output',
          target: sumNodeId,
          targetHandle: 'rhs',
          type: 'default',
        } as Edge,
      );
    }

    setNodes(ns => [...ns, ...nodesToAdd]);
    if (edgesToAdd.length) setEdges(es => [...es, ...edgesToAdd]);
  }, [bodyGroupId, getNodes, id, normalisedParameters, setEdges, setNodes, xPos, yPos]);

  const hideBodyNodes = React.useCallback(() => {
    setNodes(ns => ns.map(n => n.parentId === bodyGroupId || n.id === bodyGroupId ? { ...n, hidden: true } : n));
    setEdges(es => es.map(e => e.id.startsWith(`e-${id}-`) ? { ...e, hidden: true } : e));
  }, [bodyGroupId, id, setEdges, setNodes]);

  const toggleNestedFlow = React.useCallback(() => {
    if (showNestedFlow) {
      hideBodyNodes();
    } else {
      ensureBodyNodes();
    }
    setShowNestedFlow(prev => !prev);
  }, [showNestedFlow, ensureBodyNodes, hideBodyNodes]);

  return (
    <>
      <div className="relative min-w-[300px] rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Function Header */}
        <div className="border-b p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/10">
              <FunctionSquare className="h-4 w-4 text-purple-500" />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                updateNodeData({ name: val });
              }}
              className="h-7 text-xs"
              placeholder="Function name"
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
            />
          </div>
        </div>

        {/* Parameters Section */}
        <div className="relative border-b p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">Input Parameters</div>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setIsEditingParams(!isEditingParams)}>
              <span className="text-xs">{isEditingParams ? '✔' : '+'}</span>
            </Button>
          </div>
          {isEditingParams ? (
            <Input
              value={paramsInput}
              onChange={(e) => {
                const val = e.target.value;
                setParamsInput(val);
                // split into array
                const paramArr = val.split(',').map(p=>p.trim()).filter(Boolean);
                updateNodeData({ parameters: paramArr });
              }}
              onBlur={() => setIsEditingParams(false)}
              className="h-7 text-xs"
              placeholder="id: string, count: number"
            />
          ) : (
            <div className="flex flex-wrap gap-2" onDoubleClick={() => setIsEditingParams(true)}>
              {normalisedParameters.length ? (
                normalisedParameters.map((param: string, index: number) => (
                  <div key={index} className="relative group">
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={`param-${index}`}
                      isConnectable={isConnectable}
                      className="!left-0 !bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="rounded-md border bg-muted px-2 py-1 text-xs">
                      {param.trim()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground italic">No parameters</div>
              )}
            </div>
          )}
        </div>

        {/* Function Body Section */}
        <div className="border-b p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">Function Body</div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0"
                onClick={toggleNestedFlow}
              >
                <Code className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Collapsible Code Preview */}
          {isExpanded && (
            <div className="rounded-md bg-muted/30 p-2">
              <code className="text-xs">
                {data.text || '// Function implementation...'}
              </code>
            </div>
          )}

          {/* Nested Flow View */}
          {showNestedFlow && (
            <div className="mt-2 rounded-md border bg-background p-2">
              {/* Nested flow content will be rendered here */}
            </div>
          )}
        </div>

        {/* Return Type Section */}
        <div className="relative p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Return Type</div>
          <div className="flex items-center gap-2">
            {editingReturnType ? (
              <Input
                value={returnTypeInput}
                onChange={(e)=>{
                  const val = e.target.value;
                  setReturnTypeInput(val);
                  updateNodeData({ returnType: val || undefined });
                }}
                onBlur={()=>setEditingReturnType(false)}
                className="h-7 text-xs"
                placeholder="Return type"
              />
            ) : (
              <div
                className="rounded-md border bg-muted px-2 py-1 text-xs"
                onDoubleClick={()=>setEditingReturnType(true)}
              >
                {data.returnType || 'void'}
              </div>
            )}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Handle
              id="output"
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="!right-0 !h-3 !w-3 !rounded-full !bg-purple-500"
              title="Drag to use this function's return value"
            />
          </div>
        </div>

        {/* Async Toggle */}
        <div className="absolute right-2 top-2">
          <Switch
            id={`${id}-async`}
            checked={data.async}
            onCheckedChange={(checked)=>updateNodeData({async: checked})}
            className="h-4 w-8"
            title="Toggle async"
          />
        </div>
      </div>
    </>
  )
})

FunctionNode.displayName = 'FunctionNode'

export { FunctionNode } 