'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { TerminalSquare } from 'lucide-react'
import { Input } from '../../ui/input'

export interface ConsoleNodeData {
  type: 'console'
  label?: string
  /** Captured expression from incoming edge */
  valueExpr?: string
  [key: string]: unknown
}

interface ConsoleNodeProps extends NodeProps {
  data: ConsoleNodeData
}

const ConsoleNode = memo(({ data, id, isConnectable }: ConsoleNodeProps) => {
  const { setNodes } = useReactFlow()
  const [label, setLabel] = useState(data.label ?? 'log')

  const updateNodeData = React.useCallback((partial: Partial<ConsoleNodeData>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                ...partial,
              },
            }
          : n
      )
    )
  }, [id, setNodes])

  return (
    <div className="relative w-[180px] rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-500/10">
          <TerminalSquare className="h-3 w-3 text-orange-600" />
        </div>
        <span className="text-xs font-medium">console.log</span>
        <Input
          value={label}
          onChange={(e) => {
            const v = e.target.value
            setLabel(v)
            updateNodeData({ label: v })
          }}
          className="h-6 flex-1 text-xs"
          placeholder="label"
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
        />
      </div>

      {/* Handles */}
      <Handle
        id="value"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-orange-600"
        style={{ top: '50%' }}
        title="Value to log"
      />
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-orange-600"
        title="Pass-through value"
      />
    </div>
  )
})

ConsoleNode.displayName = 'ConsoleNode'

export { ConsoleNode } 