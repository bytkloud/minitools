import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Calculator, FileText, Search, ClipboardCheck, Stamp, ListChecks } from 'lucide-react'

type Category = 'Engineering' | 'Claims'

const tools: { name: string; description: string; path: string; icon: typeof Calculator; category: Category }[] = [
  {
    name: 'Insurance Calculator',
    description: 'Calculate under-insurance penalties and payouts (LKR)',
    path: '/insurance-calc',
    icon: Calculator,
    category: 'Engineering',
  },
  {
    name: 'Insurance Calculator',
    description: 'Calculate under-insurance penalties and payouts (LKR)',
    path: '/insurance-calc',
    icon: Calculator,
    category: 'Claims',
  },
  {
    name: 'Total loss report',
    description: 'Vehicle total loss report form with photos and signatures',
    path: '/technical-report',
    icon: FileText,
    category: 'Engineering',
  },
  {
    name: 'Technical Investigation Report',
    description: 'Vehicle technical investigation report form',
    path: '/technical-investigation-report',
    icon: Search,
    category: 'Engineering',
  },
  {
    name: 'MOFA',
    description: 'Motor officer approval request — estimate, full & final, cash in lieu, or wreck basis',
    path: '/mofa',
    icon: ClipboardCheck,
    category: 'Engineering',
  },
  {
    name: 'MOFA Claims',
    description: 'MOFA memorandum for total loss settlement approval',
    path: '/mofa-claims',
    icon: Stamp,
    category: 'Claims',
  },
  {
    name: 'Investigation Request',
    description: 'Investigation checklist with insured/driver/assessor details and photo evidence',
    path: '/investigation-request',
    icon: ListChecks,
    category: 'Claims',
  },
]

const categories: Category[] = ['Engineering', 'Claims']

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>('Engineering')
  const visibleTools = tools.filter((tool) => tool.category === activeCategory)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Minitools</h1>
        <p className="text-slate-500 text-sm mb-6">A collection of small, useful tools.</p>

        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeCategory === category
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {visibleTools.map((tool) => (
            <Link
              key={`${activeCategory}-${tool.path}`}
              to={tool.path}
              className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                <tool.icon size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{tool.name}</h2>
                <p className="text-xs text-slate-500">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
