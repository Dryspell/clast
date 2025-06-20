'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Button } from '../../ui/button'
import { Box, Code, Eye } from 'lucide-react'

export interface InterfaceNodeData {
  name: string
  members: string[]
  text: string
}

const InterfaceNode = memo(({ data, isConnectable }: NodeProps<InterfaceNodeData>) => {
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
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10">
            <Box className="h-4 w-4 text-green-500" />
          </div>
          <span className="text-sm font-medium">{data.name}</span>
        </div>
        <div className="space-y-2 rounded-md bg-muted/30 p-2">
          <div className="text-xs text-muted-foreground">Members:</div>
          <div className="space-y-1.5">
            {data.members.map((member, index) => (
              <div
                key={index}
                className="rounded border bg-background px-2 py-1 text-xs font-mono text-muted-foreground shadow-sm"
              >
                {member}
              </div>
            ))}
          </div>
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

InterfaceNode.displayName = 'InterfaceNode'

export { InterfaceNode } 