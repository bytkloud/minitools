import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Home from './pages/Home'

const InsuranceCalc = lazy(() => import('./tools/insurance-calc'))
const TechnicalReport = lazy(() => import('./tools/technical-report'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/insurance-calc" element={<InsuranceCalc />} />
          <Route path="/technical-report" element={<TechnicalReport />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
