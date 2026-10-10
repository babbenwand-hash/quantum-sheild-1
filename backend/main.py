import os
from pathlib import Path
import numpy as np, pandas as pd, networkx as nx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import precision_score, recall_score, f1_score, average_precision_score, roc_auc_score

app=FastAPI(title="QuantumShield API",version="1.0")
app.add_middleware(CORSMiddleware,allow_origins=os.getenv("FRONTEND_ORIGINS","*").split(","),allow_credentials=False,allow_methods=["*"],allow_headers=["*"])
DATA=Path(os.getenv("DATA_PATH",Path(__file__).parent/"data"/"creditcard.csv"))
models={}; benchmark=[]; graph=nx.Graph(); data=None
def init():
 global data,models,benchmark
 if DATA.exists():
  data=pd.read_csv(DATA)
  if not {"Class","Amount","Time","V14","V4","V10","V12"}.issubset(data.columns): raise ValueError("ULB CSV missing expected columns")
 else:
  rng=np.random.default_rng(42); n=1500; y=(rng.random(n)<.08).astype(int)
  data=pd.DataFrame({"Class":y,"Amount":rng.lognormal(3,1,n),"Time":rng.integers(0,172800,n)})
  for c in [f"V{i}" for i in range(1,29)]: data[c]=rng.normal(size=n)
  data["V14"]-=y*1.4; data["V4"]+=y*.8; data["V10"]-=y*.7; data["V12"]-=y*.9
 X=data[["V14","V4","V10","V12","Amount","Time"]].replace([np.inf,-np.inf],np.nan).fillna(0); y=data.Class.astype(int)
 if y.nunique()<2: return
 if len(X)>30000:
  X,_,y,_=train_test_split(X,y,test_size=1-30000/len(X),random_state=42,stratify=y)
 xt,xv,yt,yv=train_test_split(X,y,test_size=.25,random_state=42,stratify=y)
 for name,m in [("Logistic Regression",make_pipeline(StandardScaler(),LogisticRegression(class_weight="balanced",max_iter=1000))),("Random Forest",RandomForestClassifier(n_estimators=100,class_weight="balanced",random_state=42,n_jobs=1)),("Classical SVM",make_pipeline(StandardScaler(),SVC(class_weight="balanced",probability=True))) ]:
  m.fit(xt,yt); s=m.predict_proba(xv)[:,1]; p=m.predict(xv)
  benchmark.append({"model":name,"precision":round(float(precision_score(yv,p,zero_division=0)),3),"recall":round(float(recall_score(yv,p,zero_division=0)),3),"f1":round(float(f1_score(yv,p,zero_division=0)),3),"pr_auc":round(float(average_precision_score(yv,s)),3),"roc_auc":round(float(roc_auc_score(yv,s)),3)})
  models[name]=m
init_error=None
try: init()
except Exception as e: init_error=str(e)
rng=np.random.default_rng(21); n=240; amount=rng.lognormal(3.2,.7,n); device=rng.random(n)<.12; loc=rng.random(n)<.1; burst=rng.random(n)<.08
score=np.clip(np.abs(np.log1p(amount)-np.log1p(np.median(amount)))/3*.3+device*.25+loc*.25+burst*.2,0,1)*100
behavior=pd.DataFrame({"transaction_id":[f"QS-{10001+i}" for i in range(n)],"user_id":[f"user-{rng.integers(100,999)}" for _ in range(n)],"amount":amount.round(2),"new_device":device,"location_change":loc,"burst":burst,"fraud_dna_score":score.round(1)})
behavior["risk_level"]=np.where(score>=75,"CRITICAL",np.where(score>=50,"HIGH",np.where(score>=25,"MEDIUM","LOW")))
behavior["attack_type"]=np.where(burst,"Transaction Burst",np.where(device,"New Device / Possible ATO",np.where(loc,"Location Anomaly","None detected")))
behavior["recommended_action"]=np.where(score>=75,"HOLD_AND_REVIEW",np.where(score>=50,"STEP_UP_VERIFICATION",np.where(score>=25,"APPROVE_WITH_MONITORING","APPROVE")))
for i in range(12):
 u=f"user-{i+100}"; graph.add_edge(u,f"device-{i//2}"); graph.add_edge(u,f"ip-{i//3}")
class Analyze(BaseModel): transaction_id:str
@app.get("/")
def root(): return {"name":"QuantumShield API","docs":"/docs"}
@app.get("/api/health")
def health(): return {"status":"ok","dataset":"ULB" if DATA.exists() else "synthetic fallback","rows":len(data) if data is not None else 0,"startup_error":init_error,"quantum_enabled":False,"note":"Quantum SVM is not enabled in this starter deployment."}
@app.get("/api/overview")
def overview(): return {"transactions":len(behavior),"flagged":int((behavior.fraud_dna_score>=50).sum()),"synthetic_fraud_rate":round(float((behavior.fraud_dna_score>=50).mean()*100),2),"network_nodes":graph.number_of_nodes(),"network_edges":graph.number_of_edges()}
@app.get("/api/transactions")
def transactions(limit:int=50): return {"items":behavior.head(max(1,min(limit,200))).to_dict("records"),"notice":"Synthetic behavioral demo records."}
@app.post("/api/analyze")
def analyze(req:Analyze):
 r=behavior[behavior.transaction_id==req.transaction_id]
 if r.empty: raise HTTPException(404,"Transaction ID not found")
 row=r.iloc[0].to_dict()
 return {"transaction":row,"behavioral_score":row["fraud_dna_score"],"quantum_svm_decision_score":None,"quantum_note":"Quantum SVM is not enabled in this starter. No quantum advantage is claimed.","data_notice":"Synthetic demo transaction; not a real payment decision."}
@app.get("/api/benchmarks")
def get_benchmarks(): return {"items":benchmark,"note":"Metrics are measured on held-out data. If the CSV is absent, metrics use synthetic fallback data and must not be presented as real ULB results."}
@app.get("/api/network")
def network(): return {"nodes":[{"id":str(n),"kind":"user" if str(n).startswith("user-") else "entity"} for n in graph.nodes()],"edges":[{"source":str(a),"target":str(b)} for a,b in graph.edges()],"notice":"Synthetic graph."}
