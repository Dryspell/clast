'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { AlignLeft } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select'
import { Input } from '../../ui/input'

export interface LiteralNodeData {
  value: string
  literalType?: 'string' | 'number' | 'boolean'
  type: 'literal'
  [key: string]: unknown
}

interface LiteralNodeProps extends NodeProps {
  data: LiteralNodeData
}

const literalTypes = ['string', 'number', 'boolean']

const LiteralNode = memo(({ data, id, isConnectable }: LiteralNodeProps) => {
  const { setNodes } = useReactFlow()
  const [value, setValue] = useState(data.value ?? '')
  const [literalType, setLiteralType] = useState(data.literalType ?? 'string')

  const updateNodeData = React.useCallback(
    (partial: Partial<LiteralNodeData>) => {
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
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-green-500/10">
          <AlignLeft className="h-3 w-3 text-green-600" />
        </div>
        <Select
          value={literalType}
          onValueChange={(val) => {
            setLiteralType(val as any)
            updateNodeData({ literalType: val as any })
          }}
        >
          <SelectTrigger className="h-6 w-[90px] text-xs">
            <SelectValue placeholder="type" />
          </SelectTrigger>
          <SelectContent>
            {literalTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value
            setValue(v)
            updateNodeData({ value: v })
          }}
          className="h-6 flex-1 text-xs"
          placeholder="value"
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
        />
      </div>

      {/* Output handle */}
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-green-600"
        title="Literal value"
      />
    </div>
  )
})

LiteralNode.displayName = 'LiteralNode'

export { LiteralNode } 