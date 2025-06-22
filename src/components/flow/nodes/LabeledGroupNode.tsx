'use client'

import React, { memo } from 'react'
import { NodeProps } from '@xyflow/react'

// data comes in as unknown; we cast to any for convenience here

const LabeledGroupNode = memo(({ data, selected }: NodeProps) => {
  const label = (data as any)?.label ?? 'Group'
  // The container stretches to the node dimensions provided via the `style` option
  return (
    <div
      className={`flex h-full w-full flex-col rounded-lg border bg-card text-card-foreground shadow-sm ring-2 transition-colors ${
        selected ? 'ring-purple-500' : 'ring-transparent'
      }`}
    >
      <div className="border-b bg-muted px-2 py-1 text-xs font-medium">
        {label}
      </div>
      {/* children are rendered by React Flow, we just leave space */}
      <div className="flex-1" />
    </div>
  )
})

LabeledGroupNode.displayName = 'LabeledGroupNode'

export { LabeledGroupNode } 