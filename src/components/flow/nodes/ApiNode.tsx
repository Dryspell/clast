'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { Button } from '../../ui/button'
import { Globe, PlayCircle, Loader2 } from 'lucide-react'
import { Input } from '../../ui/input'

export interface ApiNodeData {
  label: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  headers?: Record<string, string>
  body?: string
}

const methodColors = {
  GET: 'text-green-500 bg-green-500/10',
  POST: 'text-blue-500 bg-blue-500/10',
  PUT: 'text-yellow-500 bg-yellow-500/10',
  DELETE: 'text-red-500 bg-red-500/10',
} as const

const ApiNode = memo(({ data, isConnectable, id }: NodeProps<any>) => {
  const typedData = data as ApiNodeData;

  const [label, setLabel] = useState(typedData.label)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const { setNodes } = useReactFlow()

  const updateLabel = React.useCallback((val: string) => {
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, data: { ...n.data, label: val } } : n))
  }, [id, setNodes])

  return (
    <div className="relative min-w-[250px] rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-muted-foreground"
      />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-500/10">
            <Globe className="h-4 w-4 text-slate-500" />
          </div>
          <div
            className="flex items-center gap-2"
          >
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${methodColors[typedData.method]}`}>
              {typedData.method}
            </span>
            <Input
              value={label}
              onChange={e => {
                const val = e.target.value;
                setLabel(val);
                updateLabel(val);
              }}
              className="h-7 text-xs"
              placeholder="Request label"
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
            />
          </div>
        </div>
        <div className="rounded-md bg-muted/30 p-2">
          <div className="font-mono text-xs text-muted-foreground">{typedData.endpoint}</div>
          {typedData.headers && Object.keys(typedData.headers).length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-muted-foreground">Headers:</div>
              {Object.entries(typedData.headers).map(([key, value], index) => (
                <div key={index} className="text-xs">
                  <span className="font-mono text-muted-foreground">{key}: </span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={isTesting}
            onClick={async () => {
              if (isTesting) return;
              setIsTesting(true);
              setTestResult(null);
              setTestError(null);
              try {
                const res = await fetch(typedData.endpoint, {
                  method: typedData.method,
                  headers: typedData.headers,
                  body: typedData.method !== 'GET' ? typedData.body : undefined,
                });

                const contentType = res.headers.get('content-type') ?? '';
                let body: string;
                if (contentType.includes('application/json')) {
                  body = JSON.stringify(await res.json(), null, 2);
                } else {
                  body = await res.text();
                }

                setTestResult(`Status: ${res.status} ${res.statusText}\n` + body);
              } catch (err: any) {
                setTestError(err?.message ?? 'Unknown error');
              } finally {
                setIsTesting(false);
              }
            }}
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <PlayCircle className="h-3 w-3" />
            )}
            Test
          </Button>
          {(testResult || testError) && (
            <pre className="max-h-40 overflow-auto rounded-md bg-muted/30 p-2 text-xs font-mono whitespace-pre-wrap">
              {testError ? `Error: ${testError}` : testResult}
            </pre>
          )}
        </div>
      </div>
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!right-0 !h-3 !w-3 !rounded-full !bg-slate-500"
        title="Drag to use the response of this API"
      />
    </div>
  )
})

ApiNode.displayName = 'ApiNode'

export { ApiNode } 