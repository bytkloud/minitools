import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PenaltyCalc from './penalty'

export default function InsuranceCalc() {
  return (
    <div>
      <div className="fixed top-2 left-2 z-10">
        <Link to="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200">
          <ArrowLeft size={12} />
          All Tools
        </Link>
      </div>
      <PenaltyCalc />
    </div>
  )
}
