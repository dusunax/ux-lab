"use client"

import ComposeButton from './components/ComposeButton'
import ApplyButton from './components/ApplyButton'
import SidebarItem from './components/SidebarItem'
import SidebarNav from './components/SidebarNav'
import TopBar from './components/TopBar'

const FIGMA_FILE_KEY = 'X5wEqf2YQKEOOlTcM06gMd'

function figmaUrl(nodeId: string) {
  return `https://www.figma.com/design/${FIGMA_FILE_KEY}?node-id=${nodeId.replace(':', '-')}&m=dev`
}

type ComponentEntry = {
  name: string
  figmaNode: string
  previewHeight?: string
  overflow?: boolean
  preview: React.ReactNode
}

const COMPONENTS: ComponentEntry[] = [
  // ── Buttons ───────────────────────────────────────────────────────────────
  {
    name: 'Button / Compose Message',
    figmaNode: '0:40522',
    preview: <ComposeButton />,
  },
  {
    name: 'Button / Apply Now',
    figmaNode: '0:40526',
    preview: <ApplyButton />,
  },

  // ── Sidebar Items ─────────────────────────────────────────────────────────
  {
    name: 'Navigation / Sidebar Item — all variants',
    figmaNode: '0:40322',
    previewHeight: 'min-h-[320px]',
    preview: (
      <div className="flex gap-8 flex-wrap justify-center items-start">
        <div className="flex flex-col">
          <p className="font-nunito text-[11px] text-gray-400 mb-2 text-center">Blue · Active</p>
          <SidebarItem label="Products" active variant="blue" />
        </div>
        <div className="flex flex-col">
          <p className="font-nunito text-[11px] text-gray-400 mb-2 text-center">Blue · Inactive</p>
          <SidebarItem label="Products" variant="blue" />
        </div>
        <div className="flex flex-col">
          <p className="font-nunito text-[11px] text-gray-400 mb-2 text-center">Light · Active</p>
          <SidebarItem label="Products" active variant="light" />
        </div>
        <div className="flex flex-col">
          <p className="font-nunito text-[11px] text-gray-400 mb-2 text-center">Light · Inactive</p>
          <SidebarItem label="Products" variant="light" />
        </div>
        <div className="flex flex-col">
          <p className="font-nunito text-[11px] text-gray-400 mb-2 text-center">Dark · Active</p>
          <SidebarItem label="Products" active variant="dark" />
        </div>
        <div className="flex flex-col">
          <p className="font-nunito text-[11px] text-gray-400 mb-2 text-center">Dark · Inactive</p>
          <SidebarItem label="Products" variant="dark" />
        </div>
      </div>
    ),
  },

  // ── Sidebars ──────────────────────────────────────────────────────────────
  {
    name: 'Navigation / Sidebar #1 (Light)',
    figmaNode: '0:40298',
    previewHeight: 'h-[500px]',
    overflow: true,
    preview: (
      <div className="h-[500px] overflow-y-auto rounded-lg shadow-soft-lg">
        <SidebarNav theme="light" activeItem="Dashboard" />
      </div>
    ),
  },
  {
    name: 'Navigation / Sidebar #2 (Blue)',
    figmaNode: '0:40223',
    previewHeight: 'h-[500px]',
    overflow: true,
    preview: (
      <div className="h-[500px] overflow-y-auto rounded-lg shadow-soft-lg">
        <SidebarNav theme="blue" activeItem="Products" />
      </div>
    ),
  },

  // ── Top Bars ──────────────────────────────────────────────────────────────
  {
    name: 'Navigation / Top Bar / Light (variant 1)',
    figmaNode: '0:40369',
    previewHeight: 'min-h-[100px]',
    preview: (
      <div className="w-full rounded-lg overflow-hidden shadow-soft">
        <TopBar theme="light" variant="1" />
      </div>
    ),
  },
  {
    name: 'Navigation / Top Bar / Dark (variant 1)',
    figmaNode: '0:40412',
    previewHeight: 'min-h-[100px]',
    preview: (
      <div className="w-full rounded-lg overflow-hidden shadow-soft">
        <TopBar theme="dark" variant="1" />
      </div>
    ),
  },
  {
    name: 'Navigation / Top Bar #2 (Light)',
    figmaNode: '0:40567',
    previewHeight: 'min-h-[100px]',
    preview: (
      <div className="w-full rounded-lg overflow-hidden shadow-soft">
        <TopBar theme="light" variant="2" />
      </div>
    ),
  },
  {
    name: 'Navigation / Top Bar #2 (Dark)',
    figmaNode: '0:40870',
    previewHeight: 'min-h-[100px]',
    preview: (
      <div className="w-full rounded-lg overflow-hidden shadow-soft">
        <TopBar theme="dark" variant="2" />
      </div>
    ),
  },
]

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-[#f4f6fb] font-nunito">
      <header className="border-b border-gray-200 bg-white px-8 py-4 flex items-center gap-3">
        <span className="text-xl font-bold text-[#4880ff]">Design Harness</span>
        <span className="text-gray-400 text-sm">DashStack component showcase</span>
        <span className="ml-auto text-[11px] text-gray-400">{COMPONENTS.length} components</span>
      </header>

      <main className="px-8 py-10 max-w-5xl mx-auto">
        <div className="grid gap-6">
          {COMPONENTS.map(({ name, figmaNode, previewHeight = 'min-h-[140px]', preview }) => (
            <div key={figmaNode} className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div>
                  <span className="font-semibold text-[13px] text-gray-800">{name}</span>
                  <span className="ml-3 font-mono text-[11px] text-gray-400">{figmaNode}</span>
                </div>
                <a
                  href={figmaUrl(figmaNode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#4880ff] hover:underline"
                >
                  Figma →
                </a>
              </div>

              <div
                className={`flex items-center justify-center ${previewHeight} p-8 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%2216%22 height=%2216%22 fill=%22%23f8f9fb%22/><rect x=%220%22 y=%220%22 width=%228%22 height=%228%22 fill=%22%23f0f2f6%22/><rect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%23f0f2f6%22/></svg>')]`}
              >
                <div className="w-full flex justify-center">
                  {preview}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
