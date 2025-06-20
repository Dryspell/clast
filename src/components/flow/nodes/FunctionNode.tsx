'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Button } from '../../ui/button'
import { FunctionSquare, Code, Eye } from 'lucide-react'

export interface FunctionNodeData {
  name: string
  parameters: string[]
  returnType?: string
  text: string
}

const FunctionNode = memo(({ data, isConnectable }: NodeProps<FunctionNodeData>) => {
  return (
    <div className="min-w-[250px] rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-muted-foreground"
      />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/10">
            <FunctionSquare className="h-4 w-4 text-purple-500" />
          </div>
          <span className="text-sm font-medium">{data.name || 'anonymous'}</span>
        </div>
        <div className="space-y-2 rounded-md bg-muted/30 p-2">
          <div className="text-xs text-muted-foreground">Parameters:</div>
          <div className="flex flex-wrap gap-1.5">
            {data.parameters.map((param, index) => (
              <span
                key={index}
                className="rounded-full border bg-background px-2 py-0.5 text-xs font-mono text-muted-foreground shadow-sm"
              >
                {param}
              </span>
            ))}
          </div>
          {data.returnType && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Returns: </span>
              <span className="rounded bg-background px-1.5 py-0.5 font-mono shadow-sm">{data.returnType}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            View
          </Button>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-muted-foreground"
      />
    </div>
  )
})

FunctionNode.displayName = 'FunctionNode'

export { FunctionNode } 