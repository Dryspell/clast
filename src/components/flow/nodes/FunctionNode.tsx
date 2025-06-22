'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, ReactFlow, NodeTypes, useReactFlow } from '@xyflow/react'
import { Button } from '../../ui/button'
import { FunctionSquare, ArrowRight, ChevronDown, Code } from 'lucide-react'
import { NestedFlow, createNestedFlowData, ScopeItem } from '../NestedFlow'
// NOTE: We intentionally avoid importing "../node-types" here to break a circular dependency
// FunctionNode -> node-types -> FunctionNode. Instead we construct the required nodeTypes
// object locally for the NestedFlow viewer.
import { VariableNode } from './VariableNode'
import { InterfaceNode } from './InterfaceNode'
import { ApiNode } from './ApiNode'
import { Input } from '../../ui/input'
import { Switch } from '../../ui/switch'

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
  const { setNodes } = useReactFlow()
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

  // Initialize nested flow data (only once)
  const [nestedFlowData, setNestedFlowData] = React.useState(() => {
    const flowData = createNestedFlowData()

    // Add function parameters to scope
    normalisedParameters.forEach((param: string) => {
      const [name, type] = param.split(':').map(s => s.trim())
      if (name) {
        flowData.scope.push({
          id: `param-${name}`,
          name,
          type: 'variable',
          value: type
        })
      }
    })

    return flowData
  })

  const handleScopeItemClick = React.useCallback((item: ScopeItem) => {
    // TODO: Implement scope item click handler
    // This could create a new node in the nested flow representing the scope item
    console.log('Scope item clicked:', item)
  }, [])

  const handleNestedNodesChange = React.useCallback((changes: any) => {
    // TODO: Implement node changes in nested flow
    console.log('Nodes changed:', changes)
  }, [])

  const handleNestedEdgesChange = React.useCallback((changes: any) => {
    // TODO: Implement edge changes in nested flow
    console.log('Edges changed:', changes)
  }, [])

  const handleNestedConnect = React.useCallback((connection: any) => {
    // TODO: Implement connection in nested flow
    console.log('Connection made:', connection)
  }, [])

  const nodeTypes = React.useMemo(
		() =>
			({
				function: FunctionNode,
				variable: VariableNode,
				interface: InterfaceNode,
				api: ApiNode,
			} as unknown as NodeTypes),
		[]
  );

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
                onClick={() => setShowNestedFlow(!showNestedFlow)}
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
              <NestedFlow
                data={nestedFlowData}
                nodeTypes={nodeTypes}
                onNodesChange={handleNestedNodesChange}
                onEdgesChange={handleNestedEdgesChange}
                onConnect={handleNestedConnect}
                onScopeItemClick={handleScopeItemClick}
              />
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
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="!right-0 !bg-purple-500"
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