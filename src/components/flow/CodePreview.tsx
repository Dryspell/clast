'use client'

import React, { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { AstNode } from '@/lib/ast/types'
import { generateCode } from '@/lib/actions/generate-code'

interface CodePreviewProps {
  nodes: AstNode[]
  /** Optional initial code to display when no nodes are available */
  initialCode?: string
  onCodeChange?: (code: string) => void
}

export function CodePreview({ nodes, initialCode = '', onCodeChange }: CodePreviewProps) {
  const [code, setCode] = useState(initialCode)

  useEffect(() => {
    // If there are no nodes yet we fall back to the provided initialCode so
    // that users immediately see something in the editor. Once nodes are
    // available we switch to the generated code representation.
    async function updateCode() {
      try {
        if (nodes.length === 0) {
          // Only set when current code is still the initial one or empty to
          // avoid overriding user edits.
          setCode((prev) => (prev === '' || prev === initialCode ? initialCode : prev))
          return
        }

        const generatedCode = await generateCode(nodes)
        setCode(generatedCode)
        onCodeChange?.(generatedCode)
      } catch (error) {
        console.error('Error generating code:', error)
      }
    }
    updateCode()
  }, [nodes, initialCode, onCodeChange])

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