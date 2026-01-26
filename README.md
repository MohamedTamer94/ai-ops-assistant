# AI Ops Assistant

AI Ops Assistant is an intelligent incident analysis and debugging platform that helps engineers understand production failures by correlating logs, timelines, and system events with AI-assisted root cause analysis.

The goal of this project is to provide a practical, evidence-based AI assistant for production incidents — not just log search, but real incident understanding.

---

## Core Features (MVP)

- Upload or paste application and system logs  
- Automatic log normalization and parsing  
- Timeline view of events and failures  
- Error grouping and fingerprinting  
- Rule-based incident detection (OOM, DB failures, timeouts, etc.)  
- AI-assisted incident analysis with evidence citations  
- Automatic incident report generation (postmortem draft)  

---

## Architecture Overview

- **Backend:** FastAPI (Python)  
- **Database:** PostgreSQL  
- **Cache / Jobs:** Redis + Celery  
- **Frontend:** React + Vite + Tailwind  
- **AI Layer:** Pluggable LLM provider interface  
- **Deployment:** Docker Compose  

The system is designed around:
- Multi-tenant projects  
- Background ingestion and analysis jobs  
- Evidence-based AI outputs with traceable sources  

---

## Project Structure

```
ai-ops-assistant/
    backend/ # FastAPI backend + workers
    frontend/ # React frontend
    docker/ # Dockerfiles and infra config
    samples/ # Sample incident bundles & logs
    docker-compose.yml
```

---

## Roadmap

### Phase 1 (MVP)
- Log upload & normalization  
- Timeline & error grouping  
- Rules engine with basic findings  
- AI incident summary  
- Incident report export  

### Phase 2
- Multi-service correlation  
- Deploy event ingestion  
- Streaming ingestion via webhooks  
- Alerting & notifications  

### Phase 3
- OpenTelemetry traces support  
- Service dependency graph  
- Advanced anomaly detection  

---

## Motivation

Modern observability tools provide data, but not understanding.

This project focuses on:
- Correlating signals across systems  
- Turning logs into narratives  
- Producing actionable incident insights  

The long-term vision is to build an AI assistant that helps engineers debug faster, write better postmortems, and prevent repeated failures.

---

## Status

🚧 Early development — MVP in progress.

---

## License

MIT