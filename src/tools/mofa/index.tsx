import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import MofaForm from './form'
import './report.css'

export default function Mofa() {
  return (
    <div className="mofa-root">
      <div className="fixed top-2 left-2 z-10">
        <Link to="/" className="mofa-back-link">
          <ArrowLeft size={12} />
          All Tools
        </Link>
      </div>
      <MofaForm />
    </div>
  )
}
