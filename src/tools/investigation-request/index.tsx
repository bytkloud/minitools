import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import InvestigationRequestForm from './form'
import './report.css'

export default function InvestigationRequest() {
  return (
    <div className="ir-root">
      <div className="fixed top-2 left-2 z-10">
        <Link to="/" className="ir-back-link">
          <ArrowLeft size={12} />
          All Tools
        </Link>
      </div>
      <InvestigationRequestForm />
    </div>
  )
}
