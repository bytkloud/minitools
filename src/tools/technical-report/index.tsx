import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TechnicalReportForm from './form'
import './report.css'

export default function TechnicalReport() {
  return (
    <div className="tr-root">
      <div className="fixed top-2 left-2 z-10">
        <Link to="/" className="tr-back-link">
          <ArrowLeft size={12} />
          All Tools
        </Link>
      </div>
      <TechnicalReportForm />
    </div>
  )
}
