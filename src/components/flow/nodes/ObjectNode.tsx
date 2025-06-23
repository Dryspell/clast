'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { Braces } from 'lucide-react'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'

export interface ObjectNodeData {
  type: 'object'
  name?: string
  /** Array of { key, value } pairs making up the object */
  properties: Array<{ key: string; value?: string }>
  [key: string]: unknown
}

interface ObjectNodeProps extends NodeProps {
  data: ObjectNodeData
}

const ObjectNode = memo(({ id, data, isConnectable }: ObjectNodeProps) => {
  const { setNodes } = useReactFlow()

  const [name, setName] = useState(data.name ?? 'obj')
  const [properties, setProperties] = useState(data.properties || [
    { key: 'key', value: 'value' },
  ])

  const updateNodeData = React.useCallback((partial: Partial<ObjectNodeData>) => {
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

  const handlePropChange = (idx: number, field: 'key' | 'value', value: string) => {
    const newProps = [...properties]
    newProps[idx] = { ...newProps[idx], [field]: value }
    setProperties(newProps)
    updateNodeData({ properties: newProps })
  }

  // Add new property row
  const addProp = () => {
    const newProps = [...properties, { key: '', value: '' }]
    setProperties(newProps)
    updateNodeData({ properties: newProps })
  }

  return (
    <div className="relative w-[220px] rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-lime-500/10">
          <Braces className="h-3 w-3 text-lime-600" />
        </div>
        <span className="text-xs font-medium">object</span>
      </div>

      {/* Optional variable name */}
      <Input
        value={name}
        onChange={(e) => {
          const val = e.target.value
          setName(val)
          updateNodeData({ name: val })
        }}
        className="mb-2 h-6 text-xs"
        placeholder="var name (optional)"
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
      />

      {/* Properties list */}
      <div className="space-y-1">
        {properties.map((prop, idx) => (
          <div key={idx} className="relative flex items-center gap-1">
            {/* Handle for incoming value connection */}
            <Handle
              id={`prop-${idx}`}
              type="target"
              position={Position.Left}
              isConnectable={isConnectable}
              className="absolute -left-3 top-1/2 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-lime-600"
              title={`Value for ${prop.key || 'prop'}`}
            />
            <Input
              value={prop.key}
              onChange={(e) => handlePropChange(idx, 'key', e.target.value)}
              className="h-6 flex-1 text-xs"
              placeholder="key"
            />
            <Input
              value={prop.value}
              onChange={(e) => handlePropChange(idx, 'value', e.target.value)}
              className="h-6 flex-1 text-xs"
              placeholder="value"
            />
          </div>
        ))}
      </div>

      <Button variant="ghost" size="sm" className="mt-2 h-6 px-1 text-[10px]" onClick={addProp}>
        + property
      </Button>

      {/* Output handle */}
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-lime-600"
        title="Object value"
      />
    </div>
  )
})

ObjectNode.displayName = 'ObjectNode'

export { ObjectNode } 