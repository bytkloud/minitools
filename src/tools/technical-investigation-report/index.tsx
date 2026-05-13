import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TechnicalInvestigationReportForm from './form'
import './report.css'

export default function TechnicalInvestigationReport() {
  return (
    <div className="tir-root">
      <div className="fixed top-2 left-2 z-10">
        <Link to="/" className="tir-back-link">
          <ArrowLeft size={12} />
          All Tools
        </Link>
      </div>
      <TechnicalInvestigationReportForm />
    </div>
  )
}
