'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as esbuild from 'esbuild-wasm'

// Track whether esbuild has been initialised globally for this session
let esbuildInitialised = false

async function ensureEsbuild () {
  if (esbuildInitialised) return
  await esbuild.initialize({
    wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.8/esbuild.wasm',
    worker: true,
  })
  esbuildInitialised = true
}

interface SandboxRunnerProps {
  /** Raw TypeScript source to execute */
  code: string
}

/**
 * SandboxRunner compiles TypeScript code on-the-fly (esbuild-wasm) and runs it
 * in a sandboxed <iframe>. Any console output is piped back via postMessage and
 * displayed in a small log panel. This keeps the user inside the CLAST UI while
 * still giving them full feedback from their generated code.
 */
export function SandboxRunner ({ code }: SandboxRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [logs, setLogs] = useState<Array<{ level: string; msg: string }>>([])

  // Listen for console events coming from the iframe
  useEffect(() => {
    function handleMessage (ev: MessageEvent) {
      if (ev.data?.type !== 'console-event') return
      const { level, args } = ev.data.payload as { level: string; args: any[] }
      setLogs((current) => [...current, { level, msg: args.join(' ') }])
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Whenever source code changes, recompile & refresh the iframe
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        await ensureEsbuild()
        const result = await esbuild.transform(code, {
          loader: 'ts',
          format: 'esm',
          sourcemap: 'inline',
        })
        if (cancelled) return

        // Reset logs for the new run
        setLogs([])

        const compiled = result.code
        const iframe = iframeRef.current
        if (!iframe) return

        // Construct the sandbox document
        iframe.srcdoc = `<!DOCTYPE html><html><body>
          <script>
            // ----- bridge console.* to parent -----
            ;['log','info','warn','error'].forEach((level)=>{
              const orig = console[level];
              console[level] = (...args)=>{
                window.parent.postMessage({type:'console-event', payload:{level, args}}, '*');
                orig.apply(console, args);
              };
            });
            window.onerror = function(msg){
              window.parent.postMessage({type:'console-event', payload:{level:'error', args:[msg]}}, '*');
            };
          <\/script>
          <script type="module">
          ${compiled.replace(/<\/script>/g, '<\\/script>')}
          <\/script>
        </body></html>`
      } catch (err) {
        setLogs((curr) => [
          ...curr,
          { level: 'error', msg: err instanceof Error ? err.message : String(err) },
        ])
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      {/* Hidden sandbox iframe */}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        title="sandbox-runner"
        className="hidden"
      />

      {/* Visible log output */}
      <div className="flex-1 overflow-y-auto p-2 text-xs font-mono">
        {logs.length === 0 && <div className="text-muted-foreground">Console output will appear here…</div>}
        {logs.map((l, idx) => (
          <div
            key={idx}
            className={
              l.level === 'error'
                ? 'text-red-400'
                : l.level === 'warn'
                ? 'text-yellow-400'
                : 'text-gray-100'
            }
          >
            {l.level}&gt; {l.msg}
          </div>
        ))}
      </div>
    </div>
  )
} 