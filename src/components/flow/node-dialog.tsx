import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NodeEditor } from './node-editor';
import { FlowNode, NodeFormData } from './types';

interface NodeDialogProps {
  node: FlowNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: NodeFormData) => void;
}

export function NodeDialog({ node, open, onOpenChange, onUpdate }: NodeDialogProps) {
  if (!node) return null;

  const title = (() => {
    switch (node.type) {
      case 'functiondeclaration':
        return 'Edit Function';
      case 'variabledeclaration':
        return 'Edit Variable';
      case 'interfacedeclaration':
        return 'Edit Interface';
      case 'classdeclaration':
        return 'Edit Class';
      default:
        return 'Edit Node';
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
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