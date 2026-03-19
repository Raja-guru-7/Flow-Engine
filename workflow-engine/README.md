# Workflow Engine

## 🚀 Overview
This project is a workflow engine that executes steps dynamically based on defined rules.

## ⚙️ Features
- Step-based workflow execution
- Rule evaluation system
- Dynamic next-step routing
- Supports conditions like amount, country, priority

## 🛠 Tech Stack
- Backend: Node.js, Express
- Frontend: React
- Database: MongoDB

## ▶️ Run Locally

### Backend
cd backend  
npm install  
npm start  

### Frontend
cd frontend  
npm install  
npm run dev  

## 🌐 Live Demo
https://flow-engine-mu.vercel.app

## 📌 Example Input
```json
{
  "amount": 250,
  "country": "US",
  "priority": "High"
}
```


## 🔄 Workflow Example

Manager Approval → Finance Notification → CEO Approval → Task Completion

## 📡 API Endpoints

### Workflows
- POST /workflows  
- GET /workflows  
- POST /workflows/:workflow_id/execute  

### Steps
- POST /workflows/:workflow_id/steps  
- GET /workflows/:workflow_id/steps  

### Rules
- POST /steps/:step_id/rules  
- GET /steps/:step_id/rules  

### Executions
- GET /executions/:id  