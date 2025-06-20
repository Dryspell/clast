'use client'

import React, { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { AstNode } from '@/lib/ast/types'
import { generateCode } from '@/lib/actions/generate-code'

interface CodePreviewProps {
  nodes: AstNode[]
  onCodeChange?: (code: string) => void
  shouldRegenerate: boolean
}

export function CodePreview({ nodes, onCodeChange, shouldRegenerate }: CodePreviewProps) {
  const [code, setCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!shouldRegenerate) return;
    
    async function updateCode() {
      setIsGenerating(true)
      try {
        const generatedCode = await generateCode(nodes)
        setCode(generatedCode)
        onCodeChange?.(generatedCode)
      } catch (error) {
        console.error('Error generating code:', error)
      } finally {
        setIsGenerating(false)
      }
    }
    updateCode()
  }, [nodes, onCodeChange, shouldRegenerate])

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