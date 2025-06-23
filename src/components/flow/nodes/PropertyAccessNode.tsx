'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { Dot } from 'lucide-react'
import { Input } from '../../ui/input'

export interface PropertyAccessNodeData {
  type: 'propertyAccess'
  property: string
  objExpr?: string
  [key: string]: unknown
}

interface PropertyAccessNodeProps extends NodeProps {
  data: PropertyAccessNodeData
}

const PropertyAccessNode = memo(({ data, id, isConnectable }: PropertyAccessNodeProps) => {
  const { setNodes } = useReactFlow()
  const [property, setProperty] = useState(data.property ?? 'prop')

  const updateNodeData = React.useCallback((partial: Partial<PropertyAccessNodeData>) => {
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
    <div className="relative w-[170px] rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10">
          <Dot className="h-3 w-3 text-amber-600" />
        </div>
        <span className="text-xs font-medium">prop</span>
        <Input
          value={property}
          onChange={(e) => {
            const v = e.target.value
            setProperty(v)
            updateNodeData({ property: v })
          }}
          className="h-6 flex-1 text-xs"
          placeholder="property"
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
        />
      </div>

      {/* Object input */}
      <Handle
        id="obj"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="absolute -left-3 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-amber-600"
        style={{ top: '50%' }}
        title="Object expression"
      />

      {/* Output */}
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-amber-600"
        title="Property value"
      />
    </div>
  )
})

PropertyAccessNode.displayName = 'PropertyAccessNode'

export { PropertyAccessNode } 