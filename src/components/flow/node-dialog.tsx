import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NodeEditor } from './node-editor';
import { Node } from '@xyflow/react';
import { VariableNodeData } from './nodes/VariableNode';
import { FunctionNodeData, InterfaceNodeData, ApiNodeData } from './node-editor';

type NodeData = VariableNodeData | FunctionNodeData | InterfaceNodeData | ApiNodeData;

interface NodeDialogProps {
  node: Node<NodeData> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (node: Node<NodeData>) => void;
}

export function NodeDialog({ node, open, onOpenChange, onUpdate }: NodeDialogProps) {
  if (!node) return null;

  const title = (() => {
    switch (node.type) {
      case 'function':
        return 'Edit Function';
      case 'variable':
        return 'Edit Variable';
      case 'interface':
        return 'Edit Interface';
      case 'api':
        return 'Edit API';
      default:
        return 'Edit Node';
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-[350px] p-4 cursor-move" draggable>
        <DialogHeader className="px-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <NodeEditor
          node={node}
          onUpdate={onUpdate}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
} 