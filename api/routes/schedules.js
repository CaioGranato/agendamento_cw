const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  getSchedulesByContactId,
  createSchedule,
  updateSchedule,
  cancelSchedule,
  getScheduleById
} = require('../db/connection');

// Função para enviar webhook de agendamento (SEMPRE enviar)
const sendScheduleWebhook = async (scheduleData) => {
  try {
    const dataToSend = { ...scheduleData };

    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend)
    });
    
    if (!response.ok) {
      console.error('Failed to send schedule webhook:', response.status, response.statusText);
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error sending schedule webhook to N8N:', error);
    return false;
  }
};

// Função para enviar webhook de alerta (condicional - apenas se alert === true)
const sendAlertWebhook = async (scheduleData) => {
  if (!scheduleData.alert) {
    return true; // Não enviar se alert for false
  }
  
  try {
    const dataToSend = { ...scheduleData };

    const response = await fetch(process.env.N8N_ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend)
    });
    
    if (!response.ok) {
      console.error('Failed to send alert webhook:', response.status, response.statusText);
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error sending alert webhook to N8N:', error);
    return false;
  }
};

// GET /api/schedules/:contactId - Buscar agendamentos por contato
router.get('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    if (!contactId || isNaN(parseInt(contactId))) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    
    const schedules = await getSchedulesByContactId(parseInt(contactId));
    
    // Converter attachments de string para JSON se necessário
    const parsedSchedules = schedules.map(schedule => ({
      ...schedule,
      attachments: typeof schedule.attachments === 'string' 
        ? JSON.parse(schedule.attachments) 
        : schedule.attachments
    }));
    
    res.json(parsedSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/schedules - Criar novo agendamento
router.post('/', async (req, res) => {
  try {
    const { scheduleData, contact, conversation, meta } = req.body;
    
    // Validações obrigatórias
    if (!scheduleData || !contact || !conversation) {
      return res.status(400).json({ error: 'Missing required fields: scheduleData, contact, conversation' });
    }
    
    if (!contact.id || !conversation.id) {
      return res.status(400).json({ error: 'Missing required IDs: contact.id, conversation.id' });
    }
    
    if (!scheduleData.message || !scheduleData.schedule_from) {
      return res.status(400).json({ error: 'Missing required schedule fields: message, schedule_from' });
    }

    const chatwootData = { contact, conversation, meta };

    // Criar o agendamento no banco
    const newSchedule = await createSchedule(scheduleData, chatwootData);

    // Enviar para webhook de agendamento N8N (SEMPRE)
    const scheduleWebhookSuccess = await sendScheduleWebhook(newSchedule);
    if (!scheduleWebhookSuccess) {
      console.warn('Failed to send schedule webhook to N8N, but schedule was saved');
    }

    // Enviar para webhook de alerta N8N (apenas se alert === true)
    const alertWebhookSuccess = await sendAlertWebhook(newSchedule);
    if (!alertWebhookSuccess && newSchedule.alert) {
      console.warn('Failed to send alert webhook to N8N, but schedule was saved');
    }

    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/schedules/:schedule_id - Atualizar agendamento
router.put('/:schedule_id', async (req, res) => {
  try {
    const { schedule_id } = req.params;
    const { scheduleData, contact, conversation, meta } = req.body;
    
    // Validações obrigatórias
    if (!scheduleData) {
      return res.status(400).json({ error: 'Missing required field: scheduleData' });
    }
    
    // Verificar se o agendamento existe
    const existingSchedule = await getScheduleById(schedule_id);
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const chatwootData = { contact, conversation, meta };

    // Atualizar o agendamento (status será automaticamente 'edited')
    const updatedSchedule = await updateSchedule(schedule_id, scheduleData, chatwootData);
    
    // Enviar para webhook de agendamento N8N (SEMPRE)
    const scheduleWebhookSuccess = await sendScheduleWebhook(updatedSchedule);
    if (!scheduleWebhookSuccess) {
      console.warn('Failed to send updated schedule webhook to N8N');
    }

    // Enviar para webhook de alerta N8N (apenas se alert === true)
    const alertWebhookSuccess = await sendAlertWebhook(updatedSchedule);
    if (!alertWebhookSuccess && updatedSchedule.alert) {
      console.warn('Failed to send updated alert webhook to N8N');
    }

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/schedules/:schedule_id - Cancelar agendamento
router.delete('/:schedule_id', async (req, res) => {
  try {
    const { schedule_id } = req.params;
    
    // Verificar se o agendamento existe
    const existingSchedule = await getScheduleById(schedule_id);
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Cancelar o agendamento (status será 'cancelled')
    const cancelledSchedule = await cancelSchedule(schedule_id);
    
    res.json({ message: 'Schedule cancelled successfully', schedule: cancelledSchedule });
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedules/single/:schedule_id - Buscar agendamento específico por ID
router.get('/single/:schedule_id', async (req, res) => {
  try {
    const { schedule_id } = req.params;
    const schedule = await getScheduleById(schedule_id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Converter attachments de string para JSON se necessário
    const parsedSchedule = {
      ...schedule,
      attachments: typeof schedule.attachments === 'string' 
        ? JSON.parse(schedule.attachments) 
        : schedule.attachments
    };
    
    res.json(parsedSchedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
