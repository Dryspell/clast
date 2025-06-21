'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Button } from '../../ui/button'
import { Globe, Code, PlayCircle } from 'lucide-react'

export interface ApiNodeData {
  label: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  headers?: Record<string, string>
  body?: string
}

const methodColors = {
  GET: 'text-green-500 bg-green-500/10',
  POST: 'text-blue-500 bg-blue-500/10',
  PUT: 'text-yellow-500 bg-yellow-500/10',
  DELETE: 'text-red-500 bg-red-500/10',
} as const

const ApiNode = memo(({ data, isConnectable }: NodeProps<any>) => {
  const typedData = data as ApiNodeData;

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
          <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-500/10">
            <Globe className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${methodColors[typedData.method]}`}>
              {typedData.method}
            </span>
            <span className="text-sm font-medium">{typedData.label}</span>
          </div>
        </div>
        <div className="rounded-md bg-muted/30 p-2">
          <div className="font-mono text-xs text-muted-foreground">{typedData.endpoint}</div>
          {typedData.headers && Object.keys(typedData.headers).length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-muted-foreground">Headers:</div>
              {Object.entries(typedData.headers).map(([key, value], index) => (
                <div key={index} className="text-xs">
                  <span className="font-mono text-muted-foreground">{key}: </span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <PlayCircle className="h-3 w-3" />
            Test
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

ApiNode.displayName = 'ApiNode'

export { ApiNode } 