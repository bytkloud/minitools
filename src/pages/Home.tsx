import { Link } from 'react-router-dom'
import { Calculator, FileText } from 'lucide-react'

const tools = [
  {
    name: 'Insurance Calculator',
    description: 'Calculate under-insurance penalties and payouts (LKR)',
    path: '/insurance-calc',
    icon: Calculator,
  },
  {
    name: 'Technical Report',
    description: 'Vehicle technical report form with photos and signatures',
    path: '/technical-report',
    icon: FileText,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Minitools</h1>
        <p className="text-slate-500 text-sm mb-8">A collection of small, useful tools.</p>

        <div className="grid gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
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
