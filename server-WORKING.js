const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// ==================== AGENTIC AI ORCHESTRATION ====================

class AIAgent {
  constructor() {
    this.capabilities = {
      appointment: new AppointmentAgent(),
      billing: new BillingAgent(),
      coordination: new CoordinationAgent(),
      documentation: new DocumentationAgent(),
      family: new FamilyAgent()
    };
  }

  async processRequest(request, context) {
    const { type, action, data, clientId } = request;
    
    if (!this.capabilities[type]) {
      return { error: 'Unknown request type', code: 'INVALID_TYPE' };
    }

    try {
      const result = await this.capabilities[type].execute(action, data, context);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message, code: 'AGENT_ERROR' };
    }
  }
}

class AppointmentAgent {
  async execute(action, data, context) {
    const { clientId } = context;
    switch (action) {
      case 'schedule':
        return {
          appointmentId: `APT${Date.now()}`,
          message: `Appointment scheduled with ${data.provider}`,
          status: 'pending_confirmation'
        };
      case 'list':
        return db.appointments.filter(a => a.clientId === clientId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

class BillingAgent {
  async execute(action, data, context) {
    const { clientId } = context;
    switch (action) {
      case 'listBills':
        return db.bills.filter(b => b.clientId === clientId);
      case 'reconcileBills':
        const bills = db.bills.filter(b => b.clientId === clientId);
        return {
          totalUnpaid: bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0),
          totalBills: bills.length
        };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

class CoordinationAgent {
  async execute(action, data, context) {
    const { clientId } = context;
    switch (action) {
      case 'listTasks':
        return db.tasks.filter(t => t.clientId === clientId);
      case 'createTask':
        const task = {
          id: `TSK${Date.now()}`,
          clientId,
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        db.tasks.push(task);
        return task;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

class DocumentationAgent {
  async execute(action, data, context) {
    const { clientId } = context;
    switch (action) {
      case 'listDocuments':
        const client = db.clients.find(c => c.id === clientId);
        return client.documents || [];
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

class FamilyAgent {
  async execute(action, data, context) {
    const { clientId } = context;
    const client = db.clients.find(c => c.id === clientId);
    switch (action) {
      case 'listFamilyContacts':
        return client.familyContacts || [];
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

const db = {
  clients: [
    {
      id: 'C001',
      name: 'Margaret Chen',
      email: 'margaret@email.com',
      tier: 'Comprehensive',
      status: 'active',
      documents: [],
      familyContacts: [{ name: 'David Chen', relationship: 'Son' }]
    },
    {
      id: 'C002',
      name: 'Robert Williams',
      email: 'robert@email.com',
      tier: 'Essentials',
      status: 'active',
      documents: [],
      familyContacts: []
    }
  ],
  appointments: [
    { id: 'APT001', clientId: 'C001', provider: 'Dr. Patel', date: '2026-04-15', status: 'scheduled' },
    { id: 'APT002', clientId: 'C002', provider: 'Dr. Brown', date: '2026-04-20', status: 'scheduled' }
  ],
  bills: [
    { id: 'BILL001', clientId: 'C001', vendor: 'Medical Center Lab', amount: 245.00, status: 'unpaid' },
    { id: 'BILL002', clientId: 'C002', vendor: 'Pharmacy Plus', amount: 89.50, status: 'paid' }
  ],
  tasks: [
    { id: 'TSK001', clientId: 'C001', title: 'Confirm appointment', status: 'pending' }
  ]
};

const aiAgent = new AIAgent();

// ==================== HOMEPAGE ====================
const HOMEPAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CWIN LifeCycle Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 900px;
      width: 100%;
      padding: 50px;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      font-size: 1.1em;
      margin-bottom: 30px;
    }
    .status {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 30px;
    }
    .status p {
      color: #2e7d32;
      font-weight: 500;
    }
    .endpoints {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .endpoints h2 {
      color: #333;
      font-size: 1.2em;
      margin-bottom: 15px;
    }
    .endpoint {
      background: white;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #667eea;
      border-left: 3px solid #667eea;
    }
    .endpoint:last-child {
      margin-bottom: 0;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .feature {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .feature h3 {
      color: #667eea;
      margin-bottom: 8px;
      font-size: 1em;
    }
    .feature p {
      color: #666;
      font-size: 0.85em;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 0.9em;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .check {
      color: #4caf50;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1><span class="check">✓</span> CWIN LifeCycle Admin</h1>
    <p class="subtitle">AI-Powered Care Coordination Platform</p>
    
    <div class="status">
      <p>✓ API is running and responding to requests</p>
    </div>

    <div class="endpoints">
      <h2>Available API Endpoints</h2>
      <div class="endpoint">GET /api/health</div>
      <div class="endpoint">GET /api/clients</div>
      <div class="endpoint">GET /api/appointments</div>
      <div class="endpoint">GET /api/bills</div>
      <div class="endpoint">GET /api/tasks</div>
      <div class="endpoint">POST /api/ai/request</div>
    </div>

    <div class="features">
      <div class="feature">
        <h3>👥 Clients</h3>
        <p>Manage client profiles</p>
      </div>
      <div class="feature">
        <h3>📅 Appointments</h3>
        <p>Schedule appointments</p>
      </div>
      <div class="feature">
        <h3>💰 Billing</h3>
        <p>Track payments</p>
      </div>
      <div class="feature">
        <h3>✅ Tasks</h3>
        <p>Manage tasks</p>
      </div>
      <div class="feature">
        <h3>🤖 AI Agents</h3>
        <p>5 autonomous agents</p>
      </div>
      <div class="feature">
        <h3>📄 API</h3>
        <p>Full REST API</p>
      </div>
    </div>

    <div class="footer">
      <p>CWIN LifeCycle Admin v1.0.0 | Vercel Production</p>
      <p>Status: Active ✓</p>
    </div>
  </div>
</body>
</html>
`;

// ==================== API ROUTES ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'CWIN LifeCycle Admin API is running' });
});

app.get('/api/clients', (req, res) => {
  res.json(db.clients);
});

app.get('/api/clients/:id', (req, res) => {
  const client = db.clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

app.get('/api/appointments', (req, res) => {
  const clientId = req.query.clientId;
  const appointments = clientId
    ? db.appointments.filter(a => a.clientId === clientId)
    : db.appointments;
  res.json(appointments);
});

app.get('/api/bills', (req, res) => {
  const clientId = req.query.clientId;
  const bills = clientId
    ? db.bills.filter(b => b.clientId === clientId)
    : db.bills;
  res.json(bills);
});

app.get('/api/tasks', (req, res) => {
  const clientId = req.query.clientId;
  const tasks = clientId
    ? db.tasks.filter(t => t.clientId === clientId)
    : db.tasks;
  res.json(tasks);
});

app.post('/api/ai/request', async (req, res) => {
  try {
    const { type, action, data } = req.body;
    const clientId = req.query.clientId || data.clientId || 'C001';

    const context = {
      userId: 'demo-user',
      clientId
    };

    const result = await aiAgent.processRequest(
      { type, action, data },
      context
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SERVE HOMEPAGE ====================
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(HOMEPAGE);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/clients',
      '/api/appointments',
      '/api/bills',
      '/api/tasks',
      '/api/ai/request'
    ]
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// FOR LOCAL DEVELOPMENT
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ CWIN LifeCycle Admin API running on http://localhost:${PORT}`);
  });
}

// FOR VERCEL SERVERLESS
module.exports = app;
