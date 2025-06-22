'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { CircleDot } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select'

export interface BinaryOpNodeData {
  operator: string
  text?: string
  type: 'binaryOp'
  [key: string]: unknown
}

interface BinaryOpNodeProps extends NodeProps {
  data: BinaryOpNodeData
}

const operatorOptions = [
  '+', '-', '*', '/', '%', '===', '!==', '>', '<', '>=', '<=', '&&', '||', '??', '**'
]

const BinaryOpNode = memo(({ data, id, isConnectable }: BinaryOpNodeProps) => {
  const { setNodes } = useReactFlow()
  const [operator, setOperator] = useState(data.operator || '+')

  const updateNodeData = React.useCallback(
    (partial: Partial<BinaryOpNodeData>) => {
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
    <div className="relative w-[160px] rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/10">
          <CircleDot className="h-3 w-3 text-purple-500" />
        </div>
        <Select
          value={operator}
          onValueChange={(val) => {
            setOperator(val)
            updateNodeData({ operator: val })
          }}
        >
          <SelectTrigger className="h-6 w-full text-xs">
            <SelectValue placeholder="op" />
          </SelectTrigger>
          <SelectContent>
            {operatorOptions.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Handles */}
      <Handle
        id="lhs"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-purple-500"
        style={{ top: '35%' }}
        title="Left operand"
      />
      <Handle
        id="rhs"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-purple-500"
        style={{ top: '65%' }}
        title="Right operand"
      />
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-purple-500"
        title="Result"
      />
    </div>
  )
})

BinaryOpNode.displayName = 'BinaryOpNode'

export { BinaryOpNode } 