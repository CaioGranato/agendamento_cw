const express = require('express');
const router = express.Router();
const {
  getSchedulesByContactId,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleById
} = require('../db/connection');

const sendToN8n = async (scheduleData, contact, conversation) => {
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');
  const datetimeSaoPaulo = dayjs.tz(scheduleData.datetime, 'America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
  
  const payload = {
    schedule: {
      ...scheduleData,
      datetime_sao_paulo: datetimeSaoPaulo,
      lastUpdate: nowSaoPaulo.format('YYYY-MM-DDTHH:mm:ss'),
      lastUpdateUTC: nowSaoPaulo.toISOString(),
      timestamp: nowSaoPaulo.format('YYYY-MM-DDTHH:mm:ss'),
    },
    contact,
    conversation,
  };

  try {
    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error sending schedule to n8n:', error);
    return false;
  }
};

// GET /api/schedules/:contactId - Buscar agendamentos por contato
router.get('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
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
    const { scheduleData, contact, conversation } = req.body;
    
    if (!scheduleData || !contact || !conversation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Criar o agendamento no banco
    const newSchedule = await createSchedule({
      ...scheduleData,
      contactid: contact.id,
      conversationid: conversation.id
    });

    // Enviar para N8N
    const n8nSuccess = await sendToN8n(newSchedule, contact, conversation);
    
    if (!n8nSuccess) {
      console.warn('Failed to send schedule to N8N, but schedule was saved');
    }

    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/schedules/:id - Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleData, contact, conversation } = req.body;
    
    // Verificar se o agendamento existe
    const existingSchedule = await getScheduleById(id);
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Atualizar o agendamento
    const updatedSchedule = await updateSchedule(id, scheduleData);
    
    // Enviar atualização para N8N se necessário
    if (contact && conversation) {
      const n8nSuccess = await sendToN8n(updatedSchedule, contact, conversation);
      if (!n8nSuccess) {
        console.warn('Failed to send updated schedule to N8N');
      }
    }

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/schedules/:id - Cancelar/deletar agendamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o agendamento existe
    const existingSchedule = await getScheduleById(id);
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Deletar o agendamento
    const deletedSchedule = await deleteSchedule(id);
    
    res.json({ message: 'Schedule deleted successfully', schedule: deletedSchedule });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedules/single/:id - Buscar agendamento específico por ID
router.get('/single/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await getScheduleById(id);
    
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