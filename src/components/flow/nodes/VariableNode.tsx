'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { Variable } from 'lucide-react'
import { Input } from '../../ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select'

export interface VariableNodeData {
  name: string
  variableType?: string
  initializer?: string
  text: string
  parameters?: Array<{ name: string; type?: string }>
  members?: Array<{ name: string; type: string }>
  type: 'variable'
  [key: string]: unknown
}

interface VariableNodeProps extends NodeProps {
  data: VariableNodeData;
  onNodeUpdate?: (nodeId: string, data: VariableNodeData) => void;
  xPos?: number;
  yPos?: number;
}

const VariableNode = memo(({ data, isConnectable, id }: VariableNodeProps) => {
  // Local form state for inline editing
  const [name, setName] = useState(data.name)
  const [variableType, setVariableType] = useState(data.variableType ?? '')
  const [initializer, setInitializer] = useState(data.initializer ?? '')

  const { setNodes, getNodes } = useReactFlow()

  // Compute available types: primitives + interface/type nodes currently present
  const primitiveTypes = ['string', 'number', 'boolean', 'any', 'unknown', 'void']
  const interfaceTypes = getNodes()
    .filter(n => n.type === 'interface' || n.type === 'type')
    .map(n => (n.data as any)?.name)
    .filter(Boolean)

  const availableTypes = Array.from(new Set<string>([...primitiveTypes, ...interfaceTypes]))

  // Helper to push updates to React Flow nodes
  const updateNodeData = React.useCallback(
    (partial: Partial<VariableNodeData>) => {
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

  // Sync local state when parent data updates (e.g., via connections)
  React.useEffect(() => {
    setVariableType(data.variableType ?? '')
  }, [data.variableType])

  React.useEffect(() => {
    setInitializer(data.initializer ?? '')
  }, [data.initializer])

  return (
    <div className="relative min-w-[250px] rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
            <Variable className="h-4 w-4 text-blue-500" />
          </div>
          <Input
            value={name}
            onChange={(e) => {
              const val = e.target.value
              setName(val)
              updateNodeData({ name: val })
            }}
            className="h-7 text-xs"
            placeholder="Variable name"
            onKeyDown={(e) => {
              // prevent newline in input
              if (e.key === 'Enter') e.preventDefault()
            }}
          />
        </div>

        {/* Details / Form */}
        <div className="space-y-2">
          {/* Type Dropdown */}
          <div className="relative">
            {/* Type handle */}
            <Handle
              id="type"
              type="target"
              position={Position.Left}
              isConnectable={isConnectable}
              className="absolute -left-3 top-1/2 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-purple-500"
              title="Connect an Interface/Type here to set variable type"
            />
            <Select
              value={variableType || undefined}
              onValueChange={(val) => {
                setVariableType(val)
                updateNodeData({ variableType: val || undefined })
              }}
            >
              <SelectTrigger className="h-7 w-full pl-6 text-xs">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            {/* Value handle */}
            <Handle
              id="value"
              type="target"
              position={Position.Left}
              isConnectable={isConnectable}
              className="absolute -left-3 top-1/2 -translate-y-1/2 !h-3 !w-3 !rounded-full !bg-blue-500"
              title="Connect a Variable or Function to initialise this variable"
            />
            <Input
              value={initializer}
              onChange={(e) => {
                const val = e.target.value
                setInitializer(val)
                updateNodeData({ initializer: val || undefined })
              }}
              className="h-7 pl-6 text-xs"
              placeholder="Initial value"
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
            />
          </div>
        </div>

        {/* No action buttons needed */}
      </div>
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-blue-500"
        title="Drag from here to use this variable"
      />
    </div>
  )
})

VariableNode.displayName = 'VariableNode'

export { VariableNode } 