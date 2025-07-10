'use client'

import React, { memo, useState, useMemo, useEffect } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { PlayCircle, AlertCircle, CheckCircle } from 'lucide-react'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

export interface CallNodeData {
  type: 'call'
  funcName?: string
  args?: string[]
  label?: string
  expectedArgs?: string[]
  [key: string]: unknown
}

interface CallNodeProps extends NodeProps {
  data: CallNodeData
}

const CallNode = memo(({ data, id, isConnectable }: CallNodeProps) => {
  const { setNodes, getNodes } = useReactFlow()
  const [label, setLabel] = useState(data.label ?? '')

  const updateNodeData = React.useCallback((partial: Partial<CallNodeData>) => {
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

  // Get available functions from the flow
  const availableFunctions = useMemo(() => {
    const nodes = getNodes()
    const functions = nodes
      .filter(n => n.type === 'function')
      .map(n => ({
        id: n.id,
        name: String(n.data.name || 'unnamed'),
        parameters: Array.isArray(n.data.parameters) 
          ? n.data.parameters 
          : typeof n.data.parameters === 'string' 
            ? n.data.parameters.split(',').map((p: string) => p.trim()).filter(Boolean)
            : []
      }))
    
    return functions
  }, [getNodes])

  // Validation state
  const validation = useMemo(() => {
    const expected = data.expectedArgs?.length || 0
    const provided = data.args?.filter(Boolean).length || 0
    return {
      isValid: expected === provided && expected > 0,
      missingArgs: Math.max(0, expected - provided),
      extraArgs: Math.max(0, provided - expected),
      hasFunction: !!data.funcName
    }
  }, [data.expectedArgs, data.args, data.funcName])

  const handleFunctionSelect = (funcName: string) => {
    const selectedFunc = availableFunctions.find(f => f.name === funcName)
    updateNodeData({ 
      funcName, 
      expectedArgs: selectedFunc?.parameters || [],
      args: [] // Reset args when function changes
    })
  }

  // Calculate dynamic height based on parameters
  const nodeHeight = Math.max(140, 140 + (data.expectedArgs?.length || 0) * 30)

  // Safeguard: If this node doesn't have call type, show warning
  if (data.type !== 'call') {
    return (
      <div className="relative w-[260px] p-3 rounded-lg border-2 border-red-200 bg-red-50">
        <div className="text-sm font-medium text-red-600">⚠ Invalid Call Node</div>
        <div className="text-xs text-red-500">Node type: {data.type || 'undefined'}</div>
        <div className="text-xs text-red-500">Expected: call</div>
      </div>
    )
  }

  return (
    <div 
      className="relative w-[260px] rounded-lg border-2 border-cyan-200 bg-card shadow-lg transition-shadow hover:shadow-xl"
      style={{ height: nodeHeight }}
    >
      <div className="p-3">
        <div className="flex gap-2 items-center mb-3">
          <div className="flex justify-center items-center w-6 h-6 rounded-full bg-cyan-500/20">
            <PlayCircle className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-sm font-semibold text-cyan-700">Function Call</span>
          <div className="ml-auto">
            {validation.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : validation.hasFunction ? (
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        {/* Function Selector - Make it prominent */}
        <div className="mb-3">
          <label className="block mb-1 text-xs font-medium text-muted-foreground">
            Select Function
          </label>
          <Select value={data.funcName || ''} onValueChange={handleFunctionSelect}>
            <SelectTrigger className="h-8 text-sm border-cyan-200 focus:border-cyan-400">
              <SelectValue placeholder="Choose a function to call..." />
            </SelectTrigger>
            <SelectContent>
              {availableFunctions.length > 0 ? (
                availableFunctions.map(func => (
                  <SelectItem key={func.id} value={func.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{func.name}</span>
                      {func.parameters.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Parameters: {func.parameters.join(', ')}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__no_functions__" disabled>
                  No functions available - create a function first
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Function Name Display */}
        {data.funcName && (
          <div className="p-2 mb-3 bg-cyan-50 rounded border border-cyan-200">
            <div className="font-mono text-sm text-cyan-800">
              {data.funcName}({data.expectedArgs?.join(', ') || ''})
            </div>
          </div>
        )}

        {/* Optional label */}
        <div className="mb-3">
          <label className="block mb-1 text-xs font-medium text-muted-foreground">
            Label (optional)
          </label>
          <Input
            value={label}
            onChange={(e) => {
              const v = e.target.value
              setLabel(v)
              updateNodeData({ label: v })
            }}
            className="w-full h-7 text-xs"
            placeholder="e.g. result, output"
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
          />
        </div>

        {/* Parameter Status */}
        {data.expectedArgs && data.expectedArgs.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">
              Arguments ({data.args?.filter(Boolean).length || 0}/{data.expectedArgs.length})
            </div>
            {data.expectedArgs.map((param, idx) => (
              <div key={idx} className="flex relative justify-between items-center p-2 bg-gray-50 rounded border">
                {/* Visual indicator for connection handle */}
                <div className="absolute left-0 top-1/2 w-3 h-3 bg-cyan-500 rounded-full border-2 border-white opacity-70 transform -translate-x-1/2 -translate-y-1/2"></div>
                <span className="flex-1 mr-2 ml-2 text-xs font-medium text-gray-700 truncate">
                  {param}
                </span>
                <span className={`font-mono text-xs px-2 py-1 rounded ${
                  data.args?.[idx] 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-red-700 bg-red-100'
                }`}>
                  {data.args?.[idx] || 'missing'}
                </span>
              </div>
            ))}
            <div className="text-xs italic text-muted-foreground">
              💡 Drag variables from the left to connect them as arguments
            </div>
          </div>
        ) : data.funcName ? (
          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-xs text-yellow-700">
              ⚠ Function "{data.funcName}" has no parameters
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <div className="text-xs text-gray-600">
              Select a function to see its parameters
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {data.funcName && (
          <div className="mt-3 text-xs">
            {validation.missingArgs > 0 && (
              <div className="font-medium text-red-600">
                ⚠ Missing {validation.missingArgs} argument{validation.missingArgs > 1 ? 's' : ''}
              </div>
            )}
            {validation.isValid && (
              <div className="font-medium text-green-600">
                ✓ All arguments provided
              </div>
            )}
          </div>
        )}
      </div>

      {/* Function target handle (top) - for dragging function TO this call */}
      <Handle
        id="func"
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!h-4 !w-4 !rounded-full !bg-cyan-600 !border-2 !border-white"
        style={{ top: -8 }}
        title="Drag a function here to call it"
      />

      {/* Dynamic Argument handles - for dragging variables TO the arguments */}
      {data.expectedArgs?.map((param, idx) => {
        // Calculate position based on parameter sections
        const baseTop = 140; // Start after header sections
        const paramSpacing = 45; // Space between each parameter
        const handleTop = baseTop + (idx * paramSpacing);
        
        return (
          <Handle
            key={`arg-${idx}`}
            id={`arg-${idx}`}
            type="target"
            position={Position.Left}
            isConnectable={isConnectable}
            className="!h-4 !w-4 !rounded-full !bg-cyan-600 !border-2 !border-white"
            style={{ top: handleTop }}
            title={`Drag a variable here to use as argument ${idx + 1}`}
          />
        )
      })}
    </div>
  )
})

CallNode.displayName = 'CallNode'

export { CallNode }