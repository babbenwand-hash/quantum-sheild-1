# QuantumShield (quantum-sheild)

React/Vite frontend + FastAPI backend research prototype.

## Local run
Backend (Python 3.11 recommended):
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Frontend, in another terminal:
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```
Open the Vite URL shown in the terminal. API docs: http://localhost:8000/docs

## Dataset
Place ULB Kaggle `creditcard.csv` at `backend/data/creditcard.csv`. The file is intentionally not included. Without it, the backend uses synthetic fallback data, so metrics must not be represented as real ULB benchmark results. ULB V1–V28 columns are anonymized transformed features.

## Deploy
**Render backend:** New Web Service → connect repository → Root Directory `backend`; Build `pip install -r requirements.txt`; Start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `FRONTEND_ORIGINS` to the Vercel URL after deployment.

**Vercel frontend:** Import same GitHub repository; Root Directory `frontend`; Build `npm run build`; Output `dist`; environment variable `VITE_API_URL=https://YOUR-API.onrender.com`. Redeploy, then set Render `FRONTEND_ORIGINS` to the actual Vercel URL.

Free Render services can sleep when idle. The starter does not enable QSVM by default because Qiskit kernel training is expensive and can be slow on free CPU. It reports this clearly rather than fabricating a quantum score. Do not claim quantum advantage. Demo transactions and graph are synthetic; this is not a production payment authorization system.
