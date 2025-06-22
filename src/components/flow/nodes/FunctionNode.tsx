'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow, Node, Edge } from '@xyflow/react'
import { Button } from '../../ui/button'
import { FunctionSquare } from 'lucide-react'
import { VariableNode } from './VariableNode'
import { InterfaceNode } from './InterfaceNode'
import { Input } from '../../ui/input'
import { Switch } from '../../ui/switch'
import { BinaryOpNode } from './BinaryOpNode'
import { LiteralNode } from './LiteralNode'
import { generateId } from '@/lib/utils'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { Variable, Divide, Quote } from 'lucide-react'

interface FunctionNodeProps extends NodeProps {
  data: FunctionNodeData;
  id: string;
  xPos?: number;
  yPos?: number;
}

// Local type for node data
interface FunctionNodeData {
  name: string
  returnType?: string
  parameters?: string | string[]
  async?: boolean
  text?: string
  type?: 'function'
  [key: string]: unknown
}

/**
 * TODO: Function Node Improvements
 * 1. Add expand/collapse functionality for function body preview
 * 2. Add visual indicators for parameter types (with proper type validation)
 * 3. Add validation indicators for connected parameters
 * 4. Implement view action to show full function code
 * 5. Add quick parameter addition UI
 * 6. Implement nested flow visualization for function body
 * 7. Add scope visualization for external references
 * 8. Add proper types for nested flow data
 * 9. Implement drag-and-drop for parameter reordering
 * 10. Add parameter type inference from connections
 */
const FunctionNode = memo(({ data, isConnectable, id, xPos, yPos }: FunctionNodeProps) => {
  const { setNodes, setEdges, getNodes, getEdges, fitView } = useReactFlow()
  const [isEditingParams, setIsEditingParams] = useState(false)
  const [paramsInput, setParamsInput] = useState(Array.isArray(data.parameters) ? data.parameters.join(', ') : (data.parameters as string || ''))

  const updateNodeData = React.useCallback((partial: Partial<FunctionNodeData>) => {
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...partial } } : n))
  }, [id, setNodes]);

  // Helper to normalise parameters into an array of strings
  const normalisedParameters = React.useMemo<string[]>(() => {
    if (!data.parameters) return []
    if (Array.isArray(data.parameters)) return data.parameters
    if (typeof data.parameters === 'string') {
      return data.parameters
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
    }
    return []
  }, [data.parameters])

  // We now embed the sub-flow directly inside the function node itself. All
  // child nodes use the function node id as their `parentId` so that React
  // Flow keeps them together.

  // helper to build parameter and binary nodes inside a group and add to global flow
  const ensureBodyNodes = React.useCallback(() => {
    const existingNodes = getNodes();
    // if we already created the parameter nodes for this function, simply unhide them
    if (existingNodes.some(n => n.parentId === id)) {
      // If they exist but were hidden, unhide them
      setNodes(ns => ns.map(n => n.parentId === id ? { ...n, hidden: false } : n));
      setEdges(es => es.map(e => (e.target?.startsWith(`sum-${id}`) || e.id.startsWith(`e-${id}-`)) ? { ...e, hidden: false } : e));
      return;
    }

    const paramNodes: Node[] = normalisedParameters.map((param, index) => {
      const [paramName, paramType] = param.split(':').map(s => s.trim());
      return {
        id: `param-${id}-${index}`,
        type: 'variable',
        parentId: id,
        extent: 'parent',
        position: { x: 30, y: 160 + index * 70 },
        data: {
          name: paramName,
          variableType: paramType || undefined,
          type: 'variable',
        },
      } as Node;
    });

    const nodesToAdd: Node[] = [...paramNodes];

    const edgesToAdd: Edge[] = [];

    if (normalisedParameters.length >= 2) {
      const sumNodeId = `sum-${id}`;
      const binaryNode: Node = {
        id: sumNodeId,
        type: 'binaryOp',
        parentId: id,
        extent: 'parent',
        position: { x: 320, y: 220 },
        data: { operator: '+', type: 'binaryOp' },
      };
      nodesToAdd.push(binaryNode);

      edgesToAdd.push(
        {
          id: `e-${id}-lhs`,
          source: `param-${id}-0`,
          sourceHandle: 'output',
          target: sumNodeId,
          targetHandle: 'lhs',
          type: 'default',
        } as Edge,
        {
          id: `e-${id}-rhs`,
          source: `param-${id}-1`,
          sourceHandle: 'output',
          target: sumNodeId,
          targetHandle: 'rhs',
          type: 'default',
        } as Edge,
      );
    }

    setNodes(ns => [...ns, ...nodesToAdd]);
    if (edgesToAdd.length) setEdges(es => [...es, ...edgesToAdd]);

    // make sure the viewport centers on the new body group for better UX
    // slight timeout to ensure nodes are rendered before fitting view
    setTimeout(() => {
      const currentNodes = getNodes().filter(n => n.id === id || n.parentId === id);
      if (currentNodes.length) {
        fitView({ nodes: currentNodes, padding: 0.2 });
      }
    }, 0);
  }, [getNodes, id, normalisedParameters, setEdges, setNodes, fitView]);

  // create body nodes on mount / when parameters change
  React.useEffect(() => {
    ensureBodyNodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalisedParameters]);

  const clickPosRef = React.useRef<{x:number;y:number}>({x:0,y:0});

  const handleContextMenu = React.useCallback((e: React.MouseEvent<HTMLDivElement>)=>{
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    clickPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  },[]);

  const addChildNode = React.useCallback((type:string)=>{
    const {x,y}=clickPosRef.current;
    const idNew = generateId();
    let nodeData: any = { type };
    if(type==='variable') nodeData = { name:'newVar', variableType:'number', type };
    if(type==='literal') nodeData = { value:'0', literalType:'number', type };
    if(type==='binaryOp') nodeData = { operator:'+', type };
    const newNode: Node = {
      id: idNew,
      type,
      parentId: id,
      extent:'parent',
      position:{x,y},
      data: nodeData,
    } as Node;
    setNodes(ns=>[...ns,newNode]);
  },[id,setNodes]);

  return (
    <>
      <div className="relative w-[600px] min-h-[500px] rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Function Header */}
        <div className="border-b p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/10">
              <FunctionSquare className="h-4 w-4 text-purple-500" />
            </div>
            <Input
              value={data.name || 'anonymous'}
              onChange={(e) => {
                const val = e.target.value;
                updateNodeData({ name: val });
              }}
              className="h-7 flex-1 text-xs"
              placeholder="Function name"
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
            />
            <Switch
              id={`${id}-async`}
              checked={data.async}
              onCheckedChange={(checked)=>updateNodeData({async: checked})}
              className="h-4 w-8"
              title="Toggle async"
            />
          </div>
        </div>

        {/* Parameters Section */}
        <div className="relative border-b p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">Input Parameters</div>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setIsEditingParams(!isEditingParams)}>
              <span className="text-xs">{isEditingParams ? '✔' : '+'}</span>
            </Button>
          </div>
          {isEditingParams ? (
            <Input
              value={paramsInput}
              onChange={(e) => {
                const val = e.target.value;
                setParamsInput(val);
                // split into array
                const paramArr = val.split(',').map(p=>p.trim()).filter(Boolean);
                updateNodeData({ parameters: paramArr });
              }}
              onBlur={() => setIsEditingParams(false)}
              className="h-7 text-xs"
              placeholder="id: string, count: number"
            />
          ) : (
            <div className="flex flex-wrap gap-2" onDoubleClick={() => setIsEditingParams(true)}>
              {normalisedParameters.length ? (
                normalisedParameters.map((param: string, index: number) => (
                  <div key={index} className="relative group">
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={`param-${index}`}
                      isConnectable={isConnectable}
                      className="!left-0 !bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="rounded-md border bg-muted px-2 py-1 text-xs">
                      {param.trim()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground italic">No parameters</div>
              )}
            </div>
          )}
        </div>

        {/* Function Body Section */}
        <div className="border-t p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">Function Body</div>
            {/* body header actions can be added here if needed */}
          </div>
          
          {/* Function body interaction area with context menu */}
          <ContextMenu>
            <ContextMenuTrigger
              className="h-[300px] w-full"
              onContextMenu={handleContextMenu}
            >
              <div className="h-full w-full" />
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onSelect={()=>addChildNode('variable')} className="flex items-center gap-2">
                <Variable className="h-4 w-4" />
                <span>Add Variable</span>
              </ContextMenuItem>
              <ContextMenuItem onSelect={()=>addChildNode('literal')} className="flex items-center gap-2">
                <Quote className="h-4 w-4" />
                <span>Add Literal</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={()=>addChildNode('binaryOp')} className="flex items-center gap-2">
                <Divide className="h-4 w-4" />
                <span>Add Binary Operation</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {/* Output handle pinned to middle right */}
        <Handle
          id="output"
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!right-0 !top-1/2 !-translate-y-1/2 !h-3 !w-3 !rounded-full !bg-purple-500"
          title="Drag to use this function's return value"
        />
      </div>
    </>
  )
})

FunctionNode.displayName = 'FunctionNode'

export { FunctionNode } 