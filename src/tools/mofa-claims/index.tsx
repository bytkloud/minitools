import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import MofaClaimsForm from './form'
import './report.css'

export default function MofaClaims() {
  return (
    <div className="mc-root">
      <div className="fixed top-2 left-2 z-10">
        <Link to="/" className="mc-back-link">
          <ArrowLeft size={12} />
          All Tools
        </Link>
      </div>
      <MofaClaimsForm />
    </div>
  )
}
