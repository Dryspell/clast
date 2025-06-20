'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Button } from '../../ui/button'
import { Variable, Code, Eye } from 'lucide-react'

export interface VariableNodeData {
  name: string
  type?: string
  initializer?: string
  text: string
}

const VariableNode = memo(({ data, isConnectable }: NodeProps<VariableNodeData>) => {
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
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
            <Variable className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-sm font-medium">{data.name}</span>
        </div>
        <div className="space-y-2 rounded-md bg-muted/30 p-2">
          {data.type && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Type: </span>
              <span className="font-mono rounded bg-muted px-1.5 py-0.5">{data.type}</span>
            </div>
          )}
          {data.initializer && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Value: </span>
              <span className="font-mono rounded bg-muted px-1.5 py-0.5">{data.initializer}</span>
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

VariableNode.displayName = 'VariableNode'

export { VariableNode } 