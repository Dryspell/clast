'use client'

import React, { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { AstNode } from '@/lib/ast/types'
import { generateCode } from '@/lib/actions/generate-code'

interface CodePreviewProps {
  nodes: AstNode[]
  onCodeChange?: (code: string) => void
}

export function CodePreview({ nodes, onCodeChange }: CodePreviewProps) {
  const [code, setCode] = useState('')

  useEffect(() => {
    async function updateCode() {
      try {
        const generatedCode = await generateCode(nodes)
        setCode(generatedCode)
        onCodeChange?.(generatedCode)
      } catch (error) {
        console.error('Error generating code:', error)
      }
    }
    updateCode()
  }, [nodes, onCodeChange])

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