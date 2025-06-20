'use client'

import React from 'react'
import { Node } from '@xyflow/react'
import { Dialog } from '../ui/dialog'

interface NodeEditorProps {
  node: Node | null
  onClose: () => void
  onUpdate: (node: Node) => void
}

export function NodeEditor({ node, onClose, onUpdate }: NodeEditorProps) {
  if (!node) return null

  return (
    <Dialog open={!!node} onOpenChange={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Edit Node</h2>
        {/* Add node editing form here */}
      </div>
    </Dialog>
  )
} 