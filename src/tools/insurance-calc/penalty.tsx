import { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, Info, Percent, Banknote } from 'lucide-react';

const PenaltyCalc = () => {
  const [sumInsured, setSumInsured] = useState<any>(800000);
  const [marketValue, setMarketValue] = useState<any>(1000000);
  const [repairCost, setRepairCost] = useState<any>(10000);
  const [threshold, setThreshold] = useState<any>(85);

  const [results, setResults] = useState({
    underInsuranceRatio: 0,
    penaltyPercentage: 0,
    payableAmount: 0,
    isUnderInsured: false,
    thresholdValue: 0
  });

  const formatInputDisplay = (val: any) => {
    if (val === "" || val === null || isNaN(val)) return "";
    return new Intl.NumberFormat('en-LK').format(val);
  };

  const parseInputValue = (val: string) => {
    const cleanValue = val.replace(/,/g, '');
    return cleanValue === "" ? 0 : Number(cleanValue);
  };

  useEffect(() => {
    const si = Number(sumInsured);
    const pav = Number(marketValue);
    const acr = Number(repairCost);
    
    const thresholdVal = (pav * threshold) / 100;
    const isUnder = si < thresholdVal;
    
    const ratio = pav > 0 ? si / pav : 0;
    const penalty = 100 - (ratio * 100);
    const payable = isUnder ? (ratio * acr) : acr;

    setResults({
      underInsuranceRatio: ratio,
      penaltyPercentage: Math.max(0, penalty),
      payableAmount: Math.max(0, payable),
      isUnderInsured: isUnder,
      thresholdValue: thresholdVal
    });
  }, [sumInsured, marketValue, repairCost, threshold]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 p-3 md:p-4 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        <header className="mb-3 text-center shrink-0">
          <h1 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Calculator className="text-blue-600" size={22} />
            Insurance Claim Calculator
          </h1>
          <p className="text-slate-500 text-sm">Calculate Under-Insurance Penalties & Payouts (LKR)</p>
        </header>

        <div className="space-y-3 flex-1 min-h-0 overflow-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Banknote size={16} className="text-blue-500" />
              Claim & Policy Details
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Sum Insured (SI)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputDisplay(sumInsured)}
                    onChange={(e) => setSumInsured(parseInputValue(e.target.value))}
                    placeholder="Enter amount"
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">LKR</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Present Market Value (PAV)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputDisplay(marketValue)}
                    onChange={(e) => setMarketValue(parseInputValue(e.target.value))}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">LKR</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Approx. Cost of Repair (ACR)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputDisplay(repairCost)}
                    onChange={(e) => setRepairCost(parseInputValue(e.target.value))}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">LKR</span>
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-600 mb-2 flex justify-between">
                  Under Insurance Percentage(%)
                  <span className="text-blue-600 font-bold">{threshold}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Info size={16} className="text-blue-500" />
              Final Payout Calculation
            </h2>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg border flex items-start gap-2 ${results.isUnderInsured ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                {results.isUnderInsured ? (
                  <>
                    <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                    <div>
                      <p className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">Under-Insurance Penalty Active</p>
                      <p className="text-xs text-amber-700">
                        Sum Insured is below {threshold}% of Market Value.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="text-green-600 shrink-0" size={18} />
                    <div>
                      <p className="font-bold text-green-900 uppercase text-[10px] tracking-wider">Policy Fully Covered</p>
                      <p className="text-xs text-green-700">Sum Insured meets threshold. No penalty applied.</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.15em] mb-1">Deduction %</p>
                  <div className="flex items-center gap-1.5">
                    <Percent size={16} className="text-red-500" />
                    <span className="text-xl font-bold text-slate-800">{results.penaltyPercentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-[9px] text-blue-600 uppercase font-black tracking-[0.15em] mb-1">Final Payout</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-blue-700">{formatCurrency(results.payableAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Requested Claim:</span>
                      <span className="font-bold text-slate-700">{formatCurrency(repairCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
                      <span className="text-slate-500 font-medium italic">Penalty Reduction:</span>
                      <span className="font-bold text-red-600">-{formatCurrency(repairCost - results.payableAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-2">
                      <span className="text-slate-800">Final Payable:</span>
                      <span className="text-blue-700 underline decoration-blue-200 decoration-2 underline-offset-2">{formatCurrency(results.payableAmount)}</span>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-3 text-center text-slate-400 text-[10px] shrink-0 pb-1">
          Insurance Under-Insurance Calculator &bull; LKR Currency Standard &bull; Average Clause Principles
        </footer>
      </div>
    </div>
  );
};

export default PenaltyCalc;
