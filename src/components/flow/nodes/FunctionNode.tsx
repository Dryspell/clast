'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps, ReactFlow, NodeTypes } from '@xyflow/react'
import { Button } from '../../ui/button'
import { FunctionSquare, Code, Eye, ArrowRight, ChevronDown } from 'lucide-react'
import { NodeDialog } from '../node-dialog'
import { FunctionNodeData } from '../node-editor'
import { NestedFlow, createNestedFlowData, ScopeItem } from '../NestedFlow'
import { nodeTypes } from '../node-types' // TODO: Create this file to export node types

interface FunctionNodeProps extends NodeProps {
  data: FunctionNodeData;
  id: string;
  xPos?: number;
  yPos?: number;
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
  const [isEditing, setIsEditing] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showNestedFlow, setShowNestedFlow] = React.useState(false)

  // Initialize nested flow data
  const [nestedFlowData, setNestedFlowData] = React.useState(() => {
    const flowData = createNestedFlowData()
    
    // Add function parameters to scope
    if (data.parameters) {
      data.parameters.split(',').forEach(param => {
        const [name, type] = param.trim().split(':').map(s => s.trim())
        if (name) {
          flowData.scope.push({
            id: `param-${name}`,
            name,
            type: 'variable',
            value: type
          })
        }
      })
    }
    
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

  return (
    <>
      <div className="relative min-w-[300px] rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Function Header */}
        <div className="border-b p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/10">
              <FunctionSquare className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-sm font-medium">{data.name || 'anonymous'}</span>
            {data.async && (
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-500">
                async
              </span>
            )}
          </div>
        </div>

        {/* Parameters Section */}
        <div className="relative border-b p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">Input Parameters</div>
            {/* TODO: Implement add parameter button */}
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
              <span className="text-xs">+</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.parameters ? (
              data.parameters.split(',').map((param: string, index: number) => (
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
            <div className="rounded-md border bg-muted px-2 py-1 text-xs">
              {data.returnType || 'void'}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Handle
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="!right-0 !bg-purple-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="absolute right-2 top-2 flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => {/* TODO: Implement view action */}}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <NodeDialog
        node={{ 
          id,
          type: 'function',
          data,
          position: { x: xPos ?? 0, y: yPos ?? 0 }
        }}
        open={isEditing}
        onOpenChange={setIsEditing}
        onUpdate={() => {}} // TODO: Implement update handler
      />
    </>
  )
})

FunctionNode.displayName = 'FunctionNode'

export { FunctionNode } 