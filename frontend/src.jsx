import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, Activity, Network, Search, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './style.css';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

function App() {
  const [overview, setOverview] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [network, setNetwork] = useState({ nodes: [], edges: [] });
  const [selectedId, setSelectedId] = useState('TX_000288');
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState('Connecting');
  const [activeTab, setActiveTab] = useState('transaction-intelligence');

  async function analyzeTransaction(txId) {
    const idToUse = txId || selectedId;
    if (!idToUse) return;
    try {
      let res = await fetch(API + '/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: idToUse })
      });
      if (!res.ok) return;
      let data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadData() {
    try {
      let res = await Promise.all([
        fetch(API + '/api/overview'),
        fetch(API + '/api/transactions'),
        fetch(API + '/api/benchmarks'),
        fetch(API + '/api/network'),
        fetch(API + '/api/health')
      ]);
      if (res.some(r => !r.ok)) throw new Error('API request failed');
      let data = await Promise.all(res.map(r => r.json()));
      setOverview(data[0]);
      setTransactions(data[1].items);
      setBenchmarks(data[2].items);
      setNetwork(data[3]);
      setStatus('Connected');

      const defaultId = data[1].items.some(x => x.transaction_id === 'TX_000288')
        ? 'TX_000288'
        : data[1].items[0]?.transaction_id || '';
      setSelectedId(defaultId);
      analyzeTransaction(defaultId);
    } catch (e) {
      setStatus('API offline');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const riskClass = (analysis?.risk_level || 'MEDIUM RISK').replace(/\s+/g, '-');

  return (
    <div className="app">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="brand">
          <ShieldCheck size={22} />
          QUANTUM<span>SHIELD</span>
        </div>
        <nav className="top-nav-links">
          <span
            className={`top-nav-item ${activeTab === 'transaction-intelligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('transaction-intelligence')}
          >
            Transaction Intelligence
          </span>
          <span
            className={`top-nav-item ${activeTab === 'model-benchmark' ? 'active' : ''}`}
            onClick={() => setActiveTab('model-benchmark')}
          >
            Model Benchmark
          </span>
          <span
            className={`top-nav-item ${activeTab === 'fraud-network' ? 'active' : ''}`}
            onClick={() => setActiveTab('fraud-network')}
          >
            Fraud Network
          </span>
          <span
            className={`top-nav-item ${activeTab === 'project-overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('project-overview')}
          >
            Project Overview
          </span>
        </nav>
        <div className="status-badge">
          <span className="status-dot"></span>
          {status}
        </div>
      </header>

      <main>
        {/* Transaction Selector Card */}
        <section className="selector-card">
          <span className="selector-label">Select Transaction ID</span>
          <div className="selector-controls">
            <select
              className="transaction-select"
              value={selectedId}
              onChange={e => {
                setSelectedId(e.target.value);
                analyzeTransaction(e.target.value);
              }}
            >
              {transactions.map(x => (
                <option key={x.transaction_id} value={x.transaction_id}>
                  {x.transaction_id}
                </option>
              ))}
            </select>
            <button className="btn-analyze" onClick={() => analyzeTransaction(selectedId)}>
              🔍 Analyze Transaction
            </button>
          </div>
        </section>

        {/* Transaction Intelligence Main Output matching Screenshot */}
        {analysis && (
          <section className="panel" id="transaction-intelligence">
            <h2 className="panel-header-title">
              🛡️ QUANTUMSHIELD — FRAUD INTELLIGENCE
            </h2>

            <div className={`risk-level-banner ${riskClass}`}>
              {analysis.risk_level}
            </div>

            <div className="risk-score-subtitle">
              Final Risk Score: {analysis.final_risk_score.toFixed(2)}/100
            </div>

            {/* Signals Table */}
            <div className="signals-table-wrapper">
              <table className="signals-table">
                <thead>
                  <tr>
                    <th>Intelligence Signal</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="signal-name">Transaction</td>
                    <td className="signal-value">{analysis.intelligence_signals.transaction}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">User</td>
                    <td className="signal-value">{analysis.intelligence_signals.user}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">Amount</td>
                    <td className="signal-value">{analysis.intelligence_signals.amount}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">Behavioral Risk</td>
                    <td className="signal-value">{analysis.intelligence_signals.behavioral_risk}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">Experimental QSVM Risk Index</td>
                    <td className="signal-value" style={{ color: '#818cf8', fontWeight: 'bold' }}>
                      {analysis.intelligence_signals.experimental_qsvm_risk_index}
                    </td>
                  </tr>
                  <tr>
                    <td className="signal-name">Predicted Attack</td>
                    <td className="signal-value">{analysis.intelligence_signals.predicted_attack}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">Attack Model Confidence</td>
                    <td className="signal-value">{analysis.intelligence_signals.attack_model_confidence}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">Simulated Fraud-Ring Signal</td>
                    <td className="signal-value">{analysis.intelligence_signals.simulated_fraud_ring_signal}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Recommended Defense */}
            <div className="recommended-defense-section">
              <div className="defense-label">Recommended Defense</div>
              <div className="defense-action-title">
                {analysis.recommended_defense}
              </div>
              <p className="prototype-notice-text">
                {analysis.quantum_note}
              </p>
            </div>

            {/* Risk Signal Breakdown Table */}
            <h3 className="breakdown-title">Risk Signal Breakdown</h3>
            <div className="signals-table-wrapper">
              <table className="signals-table">
                <thead>
                  <tr>
                    <th>Signal</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="signal-name">Behavioral Risk</td>
                    <td className="signal-value">{analysis.transaction.behavioral_risk}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">Experimental QSVM Risk Index</td>
                    <td className="signal-value" style={{ color: '#818cf8', fontWeight: 'bold' }}>
                      {analysis.transaction.qsvm_risk_index}
                    </td>
                  </tr>
                  <tr>
                    <td className="signal-name">Simulated Fraud-Ring Signal</td>
                    <td className="signal-value">{analysis.transaction.fraud_ring_signal}</td>
                  </tr>
                  <tr>
                    <td className="signal-name">Final Risk Score</td>
                    <td className="signal-value" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                      {analysis.transaction.final_risk_score}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Overview Stats */}
        <section className="overview-grid" id="project-overview">
          <div className="metric-card">
            <div className="metric-card-icon"><Activity size={20}/></div>
            <div className="metric-card-label">Transactions Analyzed</div>
            <div className="metric-card-value">{overview.transactions ?? '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-icon"><Search size={20}/></div>
            <div className="metric-card-label">High-Risk Flags</div>
            <div className="metric-card-value">{overview.flagged ?? '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-icon"><Network size={20}/></div>
            <div className="metric-card-label">Network Entities</div>
            <div className="metric-card-value">{overview.network_nodes ?? '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-icon"><Cpu size={20}/></div>
            <div className="metric-card-label">Model Benchmarks</div>
            <div className="metric-card-value">{benchmarks.length}</div>
          </div>
        </section>

        {/* Model Benchmarks Section */}
        <section className="panel" id="model-benchmark">
          <h2 className="panel-header-title">Model Benchmarks</h2>
          <div style={{ height: 280, marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarks}>
                <XAxis dataKey="model" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="precision" fill="#38bdf8" name="Precision" />
                <Bar dataKey="recall" fill="#a78bfa" name="Recall" />
                <Bar dataKey="f1" fill="#34d399" name="F1 Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {benchmarks.map(b => (
            <div key={b.model} className="bench-item">
              <div className={`bench-name ${b.model.includes('QSVM') ? 'qsvm-highlight' : ''}`}>
                {b.model.includes('QSVM') && <Cpu size={16} />}
                {b.model}
              </div>
              <div className="bench-stats">
                Precision: {b.precision} | Recall: {b.recall} | F1: {b.f1} | PR-AUC: {b.pr_auc} | ROC-AUC: {b.roc_auc}
              </div>
            </div>
          ))}
        </section>

        {/* Fraud Network Section */}
        <section className="panel" id="fraud-network">
          <h2 className="panel-header-title">Fraud Network Explorer</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
            {network.nodes.length} entities connected via {network.edges.length} risk propagation edges.
          </p>
          <div className="node-chips">
            {network.nodes.slice(0, 45).map(node => (
              <span key={node.id} className={`node-chip ${node.kind}`}>
                {node.id}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer>
        QuantumShield · Quantum Kernel Support Vector Machine (QSVM) & Behavioral Intelligence Research Prototype
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
