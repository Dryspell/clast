'use client'

import React, { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import * as ts from 'typescript'

function getDiagnostics(code: string): ts.Diagnostic[] {
  const res = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    reportDiagnostics: true,
  })
  return res.diagnostics ?? []
}

interface CodePreviewProps {
  code: string
  onCodeChange: (code: string) => void
  onDiagnostics?: (diags: ts.Diagnostic[]) => void
}

export function CodePreview({ code, onCodeChange, onDiagnostics }: CodePreviewProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
    }
  }

  const lastCodeRef = useRef<string>(code)

  useEffect(() => {
    if (code !== lastCodeRef.current) {
      lastCodeRef.current = code
      const diags = getDiagnostics(code)
      onDiagnostics?.(diags)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

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