const { Pool } = require('pg');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const executeQuery = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, params, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', { text, params, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

const getSchedulesByContactId = async (contactId) => {
  const query = `
    SELECT * FROM agendamento_msg 
    WHERE contactid = $1 
    AND status IN ('scheduled', 'agendado', 'edited', 'editado')
    ORDER BY schedule_from ASC
  `;
  const result = await executeQuery(query, [contactId]);
  return result.rows;
};

const createSchedule = async (scheduleData, chatwootData) => {
  const {
    schedule_from,
    message,
    attachments = [],
    alert = false,
    alert_from,
    comment
  } = scheduleData;

  const { contact, conversation, meta } = chatwootData;
  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');

  const query = `
    INSERT INTO agendamento_msg (
      schedule_from, alert, alert_from, comment, message, attachments, status,
      location, contactid, name, phone_number, identifier, email, conversationid,
      inboxid, persons_id, leads_id, lastupdate, lastupdateutc, timestamp,
      keep_alive_time, contact_id, contact_name, contact_email, contact_phone_number,
      contact_identifier, contact_thumbnail, contact_custom_attributes_cidade,
      contact_custom_attributes_plano, contact_custom_attributes_id_externo,
      conversation_id, conversation_status, conversation_inbox_id,
      conversation_custom_attributes_motivo_contato, conversation_custom_attributes_prioridade,
      conversation_agent_id, conversation_agent_name, conversation_agent_email,
      conversation_team_id, conversation_team_name, meta_sender_id, meta_sender_name,
      meta_sender_email, meta_sender_phone_number, meta_sender_identifier,
      meta_sender_thumbnail, meta_sender_custom_attributes_cidade,
      meta_sender_custom_attributes_plano, meta_sender_custom_attributes_id_externo,
      meta_assignee_id, meta_assignee_name, meta_assignee_email
    ) VALUES (
      $1, $2, $3, $4, $5, $6, 'scheduled', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
      $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
      $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47,
      $48, $49, $50, $51
    )
    RETURNING *
  `;

  const scheduleFromString = schedule_from ? dayjs.tz(schedule_from, 'America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss') : null;
  const alertFromString = alert_from ? dayjs.tz(alert_from, 'America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss') : null;

  const values = [
    scheduleFromString,
    alert,
    alertFromString,
    comment || null,
    message,
    JSON.stringify(attachments),
    null, // location
    contact.id,
    contact.name || null,
    contact.phone_number || null,
    contact.identifier || null,
    contact.email || null,
    conversation.id,
    conversation.inbox_id || null,
    contact.id, // persons_id
    contact.id, // leads_id
    nowSaoPaulo.format('YYYY-MM-DD HH:mm:ss'),
    nowSaoPaulo.toISOString(),
    nowSaoPaulo.format('YYYY-MM-DD HH:mm:ss'),
    nowSaoPaulo.toISOString(),
    contact.id,
    contact.name || null,
    contact.email || null,
    contact.phone_number || null,
    contact.identifier || null,
    contact.thumbnail || null,
    contact.custom_attributes?.cidade || null,
    contact.custom_attributes?.plano || null,
    contact.custom_attributes?.id_externo || null,
    conversation.id,
    conversation.status || null,
    conversation.inbox_id || null,
    conversation.custom_attributes?.motivo_contato || null,
    conversation.custom_attributes?.prioridade || null,
    conversation.agent?.id || null,
    conversation.agent?.name || null,
    conversation.agent?.email || null,
    conversation.team?.id || null,
    conversation.team?.name || null,
    meta?.sender?.id || null,
    meta?.sender?.name || null,
    meta?.sender?.email || null,
    meta?.sender?.phone_number || null,
    meta?.sender?.identifier || null,
    meta?.sender?.thumbnail || null,
    meta?.sender?.custom_attributes?.cidade || null,
    meta?.sender?.custom_attributes?.plano || null,
    meta?.sender?.custom_attributes?.id_externo || null,
    meta?.assignee?.id || null,
    meta?.assignee?.name || null,
    meta?.assignee?.email || null
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

const updateSchedule = async (schedule_id, scheduleData, chatwootData) => {
  const { contact, conversation, meta } = chatwootData;
  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');

  const fieldsToUpdate = {};
  const dataMapping = {
    schedule_from: scheduleData.schedule_from,
    message: scheduleData.message,
    attachments: scheduleData.attachments,
    alert: scheduleData.alert,
    alert_from: scheduleData.alert_from,
    comment: scheduleData.comment,
    contact_name: contact?.name,
    contact_email: contact?.email,
    contact_phone_number: contact?.phone_number,
    contact_identifier: contact?.identifier,
    contact_thumbnail: contact?.thumbnail,
    contact_custom_attributes_cidade: contact?.custom_attributes?.cidade,
    contact_custom_attributes_plano: contact?.custom_attributes?.plano,
    contact_custom_attributes_id_externo: contact?.custom_attributes?.id_externo,
    conversation_status: conversation?.status,
    conversation_custom_attributes_motivo_contato: conversation?.custom_attributes?.motivo_contato,
    conversation_custom_attributes_prioridade: conversation?.custom_attributes?.prioridade,
    conversation_agent_id: conversation?.agent?.id,
    conversation_agent_name: conversation?.agent?.name,
    conversation_agent_email: conversation?.agent?.email,
    conversation_team_id: conversation?.team?.id,
    conversation_team_name: conversation?.team?.name,
    meta_sender_name: meta?.sender?.name,
    meta_sender_email: meta?.sender?.email,
    meta_sender_phone_number: meta?.sender?.phone_number,
    meta_sender_identifier: meta?.sender?.identifier,
    meta_sender_thumbnail: meta?.sender?.thumbnail,
    meta_sender_custom_attributes_cidade: meta?.sender?.custom_attributes?.cidade,
    meta_sender_custom_attributes_plano: meta?.sender?.custom_attributes?.plano,
    meta_sender_custom_attributes_id_externo: meta?.sender?.custom_attributes?.id_externo,
    meta_assignee_id: meta?.assignee?.id,
    meta_assignee_name: meta?.assignee?.name,
    meta_assignee_email: meta?.assignee?.email,
  };

  for (const [key, value] of Object.entries(dataMapping)) {
    if (value !== undefined && value !== null) {
      if (key === 'schedule_from' || key === 'alert_from') {
        fieldsToUpdate[key] = dayjs.tz(value, 'America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
      } else if (key === 'attachments') {
        fieldsToUpdate[key] = JSON.stringify(value);
      } else {
        fieldsToUpdate[key] = value;
      }
    }
  }

  fieldsToUpdate.status = 'edited';
  fieldsToUpdate.lastupdate = nowSaoPaulo.format('YYYY-MM-DD HH:mm:ss');
  fieldsToUpdate.lastupdateutc = nowSaoPaulo.toISOString();
  fieldsToUpdate.updated_at = nowSaoPaulo.toISOString();
  fieldsToUpdate.keep_alive_time = nowSaoPaulo.toISOString();

  const setClauses = Object.keys(fieldsToUpdate).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(fieldsToUpdate);

  const query = `
    UPDATE agendamento_msg
    SET ${setClauses}
    WHERE schedule_id = $${values.length + 1}
    RETURNING *
  `;

  values.push(schedule_id);

  const result = await executeQuery(query, values);
  return result.rows[0];
};

const cancelSchedule = async (schedule_id) => {
  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');
  const query = `
    UPDATE agendamento_msg 
    SET 
      status = 'cancelled',
      lastupdate = $1,
      lastupdateutc = $2,
      updated_at = $3
    WHERE schedule_id = $4
    RETURNING *
  `;
  const values = [
    nowSaoPaulo.format('YYYY-MM-DD HH:mm:ss'),
    nowSaoPaulo.toISOString(),
    nowSaoPaulo.toISOString(),
    schedule_id
  ];
  const result = await executeQuery(query, values);
  return result.rows[0];
};

const getScheduleById = async (schedule_id) => {
  const query = 'SELECT * FROM agendamento_msg WHERE schedule_id = $1';
  const result = await executeQuery(query, [schedule_id]);
  return result.rows[0];
};

module.exports = {
  pool,
  executeQuery,
  getSchedulesByContactId,
  createSchedule,
  updateSchedule,
  cancelSchedule,
  getScheduleById
};