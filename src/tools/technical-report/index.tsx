import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TotalLossReportForm from './form'
import './report.css'

export default function TotalLossReport() {
  return (
    <div className="tlr-root">
      <div className="fixed top-2 left-2 z-10">
        <Link to="/" className="tlr-back-link">
          <ArrowLeft size={12} />
          All Tools
        </Link>
      </div>
      <TotalLossReportForm />
    </div>
  )
}
