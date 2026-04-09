const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

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

app.get('/', (req, res) => {
  res.json({
    name: 'CWIN LifeCycle Admin API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      clients: '/api/clients',
      appointments: '/api/appointments',
      bills: '/api/bills',
      tasks: '/api/tasks',
      ai: '/api/ai/request'
    }
  });
});

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ CWIN LifeCycle Admin API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
