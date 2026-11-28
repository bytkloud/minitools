import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { trackPageview } from './utils/track'
import Home from './pages/Home'

const InsuranceCalc = lazy(() => import('./tools/insurance-calc'))
const TechnicalReport = lazy(() => import('./tools/technical-report'))
const OrientTotalLoss = lazy(() => import('./tools/orient-total-loss'))
const TechnicalInvestigationReport =lazy(() => import('./tools/technical-investigation-report'))
const Mofa = lazy(() => import('./tools/mofa'))
const MofaClaims = lazy(() => import('./tools/mofa-claims'))
const InvestigationRequest = lazy(() => import('./tools/investigation-request'))

function PageviewTracker() {
  const { pathname } = useLocation()
  useEffect(() => { trackPageview(pathname) }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <PageviewTracker />
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/insurance-calc" element={<InsuranceCalc />} />
          <Route path="/technical-report" element={<TechnicalReport />} />
          <Route path="/orient-total-loss" element={<OrientTotalLoss />} />
          <Route path="/technical-investigation-report" element={<TechnicalInvestigationReport />} />
          <Route path="/mofa" element={<Mofa />} />
          <Route path="/mofa-claims" element={<MofaClaims />} />
          <Route path="/investigation-request" element={<InvestigationRequest />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
