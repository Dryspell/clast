'use client'

import React from 'react'
import Editor from '@monaco-editor/react'

interface CodePreviewProps {
  code: string
  onCodeChange: (code: string) => void
}

export function CodePreview({ code, onCodeChange }: CodePreviewProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
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