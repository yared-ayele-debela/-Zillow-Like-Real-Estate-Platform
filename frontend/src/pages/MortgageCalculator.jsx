import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CurrencyDollarIcon, HomeIcon } from '@heroicons/react/24/outline';
import PageHero from '../components/common/PageHero';

const formatCurrency = (value) =>
  value !== null && value !== undefined && !Number.isNaN(value)
    ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : '—';

const MortgageCalculator = () => {
  const [income, setIncome] = useState('');
  const [monthlyDebts, setMonthlyDebts] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTermYears, setLoanTermYears] = useState('30');
  const [taxesInsurance, setTaxesInsurance] = useState('350');

  const safeNumber = (val) => {
    const n = parseFloat(String(val).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const annualIncome = safeNumber(income);
  const debts = safeNumber(monthlyDebts);
  const dp = safeNumber(downPayment);
  const rate = safeNumber(interestRate);
  const years = safeNumber(loanTermYears) || 30;
  const ti = safeNumber(taxesInsurance);

  const monthlyIncome = annualIncome / 12;

  // Standard front-end + back-end DTI constraints
  const maxHousingPayment = monthlyIncome * 0.28;
  const maxTotalPayment = monthlyIncome * 0.43 - debts;
  const targetMonthlyPayment = Math.max(
    0,
    Math.min(maxHousingPayment || 0, maxTotalPayment || 0),
  );

  const monthlyRate = rate > 0 ? rate / 100 / 12 : 0;
  const totalMonths = years * 12;

  let maxLoanAmount = 0;
  if (monthlyRate > 0 && totalMonths > 0 && targetMonthlyPayment > 0) {
    const pAndI = Math.max(targetMonthlyPayment - ti, 0);
    const factor =
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    maxLoanAmount = pAndI / factor;
  }

  const maxHomePrice = maxLoanAmount + dp;

  const chosenPrice = Math.max(maxHomePrice, 0);
  const loanAmountFromPrice = Math.max(chosenPrice - dp, 0);
  let monthlyPrincipalInterest = 0;
  if (monthlyRate > 0 && totalMonths > 0 && loanAmountFromPrice > 0) {
    const factor =
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    monthlyPrincipalInterest = loanAmountFromPrice * factor;
  }
  const totalMonthlyPayment = monthlyPrincipalInterest + ti;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        title="Mortgage Calculator"
        subtitle="Estimate your affordability. Enter your income and expenses to see how much home you can afford."
        centered
      />

      <main className="max-w-6xl mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Inputs */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase">
            Your Financial Snapshot
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Annual gross income
              </label>
              <div className="relative rounded-xl border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full rounded-xl border-0 pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0"
                  placeholder="80,000"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Before taxes, including salary, bonuses, and other income.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Monthly debt payments
              </label>
              <div className="relative rounded-xl border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={monthlyDebts}
                  onChange={(e) => setMonthlyDebts(e.target.value)}
                  className="w-full rounded-xl border-0 pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0"
                  placeholder="500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Car loans, student loans, credit cards, etc.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Down payment
              </label>
              <div className="relative rounded-xl border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="w-full rounded-xl border-0 pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0"
                  placeholder="40,000"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Cash you&apos;ll put toward the purchase.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Interest rate (APR)
              </label>
              <div className="relative rounded-xl border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full rounded-xl border-0 pl-3 pr-8 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0"
                  placeholder="6.5"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs">
                  %
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Approximate 30-year fixed rate.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Loan term
              </label>
              <select
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="30">30 years (most common)</option>
                <option value="20">20 years</option>
                <option value="15">15 years</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Taxes &amp; insurance (monthly)
              </label>
              <div className="relative rounded-xl border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={taxesInsurance}
                  onChange={(e) => setTaxesInsurance(e.target.value)}
                  className="w-full rounded-xl border-0 pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0"
                  placeholder="350"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Estimate for property taxes, insurance, and HOA if applicable.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-900">
            These calculations are estimates only and not a commitment to lend.
            For exact numbers, talk to a licensed mortgage professional.
          </div>
        </section>

        {/* Results */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase mb-4">
              What you can afford
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Estimated max home price
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(Math.round(maxHomePrice || 0))}
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  Based on typical DTI guidelines
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Estimated monthly payment
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(Math.round(totalMonthlyPayment || 0))}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Principal &amp; interest + taxes/insurance
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Principal &amp; interest only
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(Math.round(monthlyPrincipalInterest || 0))}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    At {rate || 0}% for {years} years
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4 text-sm text-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              How this is calculated
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-600">
              <li>Front-end debt-to-income ratio capped around 28% for housing.</li>
              <li>
                Total debt-to-income ratio capped around 43%, subtracting your
                other monthly debt payments.
              </li>
              <li>
                We subtract estimated taxes and insurance to find how much can
                go toward principal &amp; interest.
              </li>
              <li>
                Standard amortization formula is used based on your chosen rate
                and term.
              </li>
            </ul>
          </div>

          <div className="bg-indigo-600 text-white rounded-2xl shadow-sm p-5 text-sm space-y-3">
            <p className="font-semibold">Ready to start home shopping?</p>
            <p className="text-indigo-100 text-xs">
              Use your budget as a guide when browsing listings. You can refine
              your filters by price, beds, baths, and more.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={
                  maxHomePrice > 0
                    ? `/properties?max_price=${Math.round(maxHomePrice)}`
                    : '/properties'
                }
                className="inline-flex items-center px-4 py-2.5 bg-white text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <HomeIcon className="w-4 h-4 mr-1.5" />
                Browse homes within budget
              </Link>
              <Link
                to="/properties"
                className="inline-flex items-center px-4 py-2.5 border border-indigo-200/70 text-indigo-50 rounded-xl text-xs font-semibold hover:bg-indigo-500/40 transition-colors"
              >
                Adjust filters on listings
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MortgageCalculator;

