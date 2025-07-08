'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { HelpCircle } from 'lucide-react'
import { Input } from '../../ui/input'

export interface ConditionalNodeData {
  type: 'conditional'
  testExpr?: string
  whenTrue?: string
  whenFalse?: string
  [key: string]: unknown
}

interface ConditionalNodeProps extends NodeProps {
  data: ConditionalNodeData
}

const ConditionalNode = memo(({ data, id, isConnectable }: ConditionalNodeProps) => {
  const { setNodes } = useReactFlow()
  const [testExpr, setTestExpr] = useState(data.testExpr ?? '')

  const updateNodeData = React.useCallback(
    (partial: Partial<ConditionalNodeData>) => {
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
    },
    [id, setNodes]
  )

  return (
    <div className="relative w-[180px] rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-500/10">
          <HelpCircle className="h-3 w-3 text-rose-600" />
        </div>
        <span className="text-xs font-medium">if ?</span>
        <Input
          value={testExpr}
          onChange={(e) => {
            const v = e.target.value
            setTestExpr(v)
            updateNodeData({ testExpr: v })
          }}
          className="h-6 flex-1 text-xs"
          placeholder="condition"
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
        />
      </div>

      {/* Handles */}
      <Handle
        id="test"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-rose-600"
        style={{ top: '30%' }}
        title="Condition"
      />
      <Handle
        id="whenTrue"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-rose-600"
        style={{ top: '55%' }}
        title="Value if true"
      />
      <Handle
        id="whenFalse"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-rose-600"
        style={{ top: '80%' }}
        title="Value if false"
      />
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-rose-600"
        title="Result"
      />
    </div>
  )
})

ConditionalNode.displayName = 'ConditionalNode'

export { ConditionalNode } 