'use client'

import React, { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { AstNode } from '@/lib/ast/types'
import { generateCodeSync } from '@/lib/generateCodeSync'

interface CodePreviewProps {
  nodes: AstNode[]
  /** Optional initial code to display when no nodes are available */
  initialCode?: string
  onCodeChange?: (code: string) => void
}

export function CodePreview({ nodes, initialCode = '', onCodeChange }: CodePreviewProps) {
  const derivedCode = React.useMemo(() => {
    if (nodes.length === 0) return initialCode
    return generateCodeSync(nodes)
  }, [nodes, initialCode])

  const [code, setCode] = useState(derivedCode)

  // Keep editor in sync when derivation changes
  useEffect(() => {
    setCode(derivedCode)
  }, [derivedCode])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
      onCodeChange?.(value)
    }
  }

  return (
    <div className="h-full w-full rounded-lg border bg-card">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          readOnly: false,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  )
} 