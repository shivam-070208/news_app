"use client"

import dynamic from "next/dynamic"

const Editor = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8 px-4 py-8">
      <div className="h-12 w-3/4 rounded-lg bg-gray-100" />
      <div className="h-px bg-gray-100" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
        <div className="h-4 w-4/6 rounded bg-gray-100" />
      </div>
      <div className="h-px bg-gray-100" />
      <div className="h-64 rounded-lg bg-gray-50" />
    </div>
  ),
})

export default function EditorWrapper() {
  return <Editor />
}
