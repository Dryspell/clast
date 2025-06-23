'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { PlayCircle } from 'lucide-react'
import { Input } from '../../ui/input'

export interface CallNodeData {
  type: 'call'
  funcName?: string
  args?: string[]
  label?: string
  [key: string]: unknown
}

interface CallNodeProps extends NodeProps {
  data: CallNodeData
}

const argHandlePositions = [25, 50, 75] // percentages down the left side

const CallNode = memo(({ data, id, isConnectable }: CallNodeProps) => {
  const { setNodes } = useReactFlow()
  const [label, setLabel] = useState(data.label ?? '')

  const updateNodeData = React.useCallback((partial: Partial<CallNodeData>) => {
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
    <div className="relative w-[200px] rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/10">
          <PlayCircle className="h-3 w-3 text-cyan-600" />
        </div>
        <span className="text-xs font-medium">call</span>
        {data.funcName ? (
          <span className="text-xs font-mono">{data.funcName}()</span>
        ) : (
          <span className="text-xs text-muted-foreground">(select function)</span>
        )}
      </div>

      {/* Optional label */}
      <Input
        value={label}
        onChange={(e) => {
          const v = e.target.value
          setLabel(v)
          updateNodeData({ label: v })
        }}
        className="h-6 w-full text-xs"
        placeholder="label"
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
      />

      {/* Function target handle (top) */}
      <Handle
        id="func"
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!h-3 !w-3 !rounded-full !bg-cyan-600"
        title="Function to call"
      />

      {/* Argument handles */}
      {argHandlePositions.map((pct, idx) => (
        <Handle
          key={idx}
          id={`arg${idx}`}
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-cyan-600"
          style={{ top: `${pct}%` }}
          title={`Argument ${idx}`}
        />
      ))}

      {/* Output handle */}
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-cyan-600"
        title="Result value"
      />
    </div>
  )
})

CallNode.displayName = 'CallNode'

export { CallNode } 