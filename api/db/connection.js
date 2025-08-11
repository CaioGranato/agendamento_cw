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

// Supabase table already exists - no need to create

const executeQuery = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', { text, error: error.message });
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
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
      $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47,
      $48, $49, $50, $51, $52, $53
    )
    RETURNING *
  `;
  
  const scheduleFromSaoPaulo = dayjs.tz(schedule_from, 'America/Sao_Paulo');
  const alertFromSaoPaulo = alert_from ? dayjs.tz(alert_from, 'America/Sao_Paulo') : null;
  
  const values = [
    scheduleFromSaoPaulo.toDate(), // schedule_from
    alert, // alert
    alertFromSaoPaulo ? alertFromSaoPaulo.toDate() : null, // alert_from
    comment || null, // comment
    message, // message
    JSON.stringify(attachments), // attachments
    'scheduled', // status
    null, // location (will be set to schedule_id by trigger)
    contact.id, // contactid
    contact.name || null, // name
    contact.phone_number || null, // phone_number
    contact.identifier || null, // identifier
    contact.email || null, // email
    conversation.id, // conversationid
    conversation.inbox_id || null, // inboxid
    contact.id, // persons_id
    contact.id, // leads_id
    nowSaoPaulo.toDate(), // lastupdate
    nowSaoPaulo.toDate(), // lastupdateutc
    nowSaoPaulo.toDate(), // timestamp
    nowSaoPaulo.toDate(), // keep_alive_time
    contact.id, // contact_id
    contact.name || null, // contact_name
    contact.email || null, // contact_email
    contact.phone_number || null, // contact_phone_number
    contact.identifier || null, // contact_identifier
    contact.thumbnail || null, // contact_thumbnail
    contact.custom_attributes?.cidade || null, // contact_custom_attributes_cidade
    contact.custom_attributes?.plano || null, // contact_custom_attributes_plano
    contact.custom_attributes?.id_externo || null, // contact_custom_attributes_id_externo
    conversation.id, // conversation_id
    conversation.status || null, // conversation_status
    conversation.inbox_id || null, // conversation_inbox_id
    conversation.custom_attributes?.motivo_contato || null, // conversation_custom_attributes_motivo_contato
    conversation.custom_attributes?.prioridade || null, // conversation_custom_attributes_prioridade
    conversation.agent?.id || null, // conversation_agent_id
    conversation.agent?.name || null, // conversation_agent_name
    conversation.agent?.email || null, // conversation_agent_email
    conversation.team?.id || null, // conversation_team_id
    conversation.team?.name || null, // conversation_team_name
    meta?.sender?.id || null, // meta_sender_id
    meta?.sender?.name || null, // meta_sender_name
    meta?.sender?.email || null, // meta_sender_email
    meta?.sender?.phone_number || null, // meta_sender_phone_number
    meta?.sender?.identifier || null, // meta_sender_identifier
    meta?.sender?.thumbnail || null, // meta_sender_thumbnail
    meta?.sender?.custom_attributes?.cidade || null, // meta_sender_custom_attributes_cidade
    meta?.sender?.custom_attributes?.plano || null, // meta_sender_custom_attributes_plano
    meta?.sender?.custom_attributes?.id_externo || null, // meta_sender_custom_attributes_id_externo
    meta?.assignee?.id || null, // meta_assignee_id
    meta?.assignee?.name || null, // meta_assignee_name
    meta?.assignee?.email || null // meta_assignee_email
  ];
  
  const result = await executeQuery(query, values);
  return result.rows[0];
};

const updateSchedule = async (schedule_id, scheduleData, chatwootData) => {
  const {
    schedule_from,
    message,
    attachments,
    alert,
    alert_from,
    comment
  } = scheduleData;

  const { contact, conversation, meta } = chatwootData;
  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');
  
  const query = `
    UPDATE agendamento_msg 
    SET 
      schedule_from = COALESCE($1, schedule_from),
      message = COALESCE($2, message),
      attachments = COALESCE($3, attachments),
      alert = COALESCE($4, alert),
      alert_from = COALESCE($5, alert_from),
      comment = COALESCE($6, comment),
      status = 'edited',
      lastupdate = $7,
      lastupdateutc = $8,
      updated_at = NOW(),
      keep_alive_time = $9,
      contact_name = COALESCE($10, contact_name),
      contact_email = COALESCE($11, contact_email),
      contact_phone_number = COALESCE($12, contact_phone_number),
      contact_identifier = COALESCE($13, contact_identifier),
      contact_thumbnail = COALESCE($14, contact_thumbnail),
      contact_custom_attributes_cidade = COALESCE($15, contact_custom_attributes_cidade),
      contact_custom_attributes_plano = COALESCE($16, contact_custom_attributes_plano),
      contact_custom_attributes_id_externo = COALESCE($17, contact_custom_attributes_id_externo),
      conversation_status = COALESCE($18, conversation_status),
      conversation_custom_attributes_motivo_contato = COALESCE($19, conversation_custom_attributes_motivo_contato),
      conversation_custom_attributes_prioridade = COALESCE($20, conversation_custom_attributes_prioridade),
      conversation_agent_id = COALESCE($21, conversation_agent_id),
      conversation_agent_name = COALESCE($22, conversation_agent_name),
      conversation_agent_email = COALESCE($23, conversation_agent_email),
      conversation_team_id = COALESCE($24, conversation_team_id),
      conversation_team_name = COALESCE($25, conversation_team_name),
      meta_sender_name = COALESCE($26, meta_sender_name),
      meta_sender_email = COALESCE($27, meta_sender_email),
      meta_sender_phone_number = COALESCE($28, meta_sender_phone_number),
      meta_sender_identifier = COALESCE($29, meta_sender_identifier),
      meta_sender_thumbnail = COALESCE($30, meta_sender_thumbnail),
      meta_sender_custom_attributes_cidade = COALESCE($31, meta_sender_custom_attributes_cidade),
      meta_sender_custom_attributes_plano = COALESCE($32, meta_sender_custom_attributes_plano),
      meta_sender_custom_attributes_id_externo = COALESCE($33, meta_sender_custom_attributes_id_externo),
      meta_assignee_id = COALESCE($34, meta_assignee_id),
      meta_assignee_name = COALESCE($35, meta_assignee_name),
      meta_assignee_email = COALESCE($36, meta_assignee_email)
    WHERE schedule_id = $37
    RETURNING *
  `;
  
  const scheduleFromSaoPaulo = schedule_from ? dayjs.tz(schedule_from, 'America/Sao_Paulo') : null;
  const alertFromSaoPaulo = alert_from ? dayjs.tz(alert_from, 'America/Sao_Paulo') : null;
  
  const values = [
    scheduleFromSaoPaulo ? scheduleFromSaoPaulo.toDate() : null, // schedule_from
    message, // message
    attachments ? JSON.stringify(attachments) : null, // attachments
    alert, // alert
    alertFromSaoPaulo ? alertFromSaoPaulo.toDate() : null, // alert_from
    comment, // comment
    nowSaoPaulo.toDate(), // lastupdate
    nowSaoPaulo.toDate(), // lastupdateutc
    nowSaoPaulo.toDate(), // keep_alive_time
    contact?.name || null, // contact_name
    contact?.email || null, // contact_email
    contact?.phone_number || null, // contact_phone_number
    contact?.identifier || null, // contact_identifier
    contact?.thumbnail || null, // contact_thumbnail
    contact?.custom_attributes?.cidade || null, // contact_custom_attributes_cidade
    contact?.custom_attributes?.plano || null, // contact_custom_attributes_plano
    contact?.custom_attributes?.id_externo || null, // contact_custom_attributes_id_externo
    conversation?.status || null, // conversation_status
    conversation?.custom_attributes?.motivo_contato || null, // conversation_custom_attributes_motivo_contato
    conversation?.custom_attributes?.prioridade || null, // conversation_custom_attributes_prioridade
    conversation?.agent?.id || null, // conversation_agent_id
    conversation?.agent?.name || null, // conversation_agent_name
    conversation?.agent?.email || null, // conversation_agent_email
    conversation?.team?.id || null, // conversation_team_id
    conversation?.team?.name || null, // conversation_team_name
    meta?.sender?.name || null, // meta_sender_name
    meta?.sender?.email || null, // meta_sender_email
    meta?.sender?.phone_number || null, // meta_sender_phone_number
    meta?.sender?.identifier || null, // meta_sender_identifier
    meta?.sender?.thumbnail || null, // meta_sender_thumbnail
    meta?.sender?.custom_attributes?.cidade || null, // meta_sender_custom_attributes_cidade
    meta?.sender?.custom_attributes?.plano || null, // meta_sender_custom_attributes_plano
    meta?.sender?.custom_attributes?.id_externo || null, // meta_sender_custom_attributes_id_externo
    meta?.assignee?.id || null, // meta_assignee_id
    meta?.assignee?.name || null, // meta_assignee_name
    meta?.assignee?.email || null, // meta_assignee_email
    schedule_id // WHERE condition
  ];
  
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
      updated_at = NOW(),
      keep_alive_time = $3
    WHERE schedule_id = $4
    RETURNING *
  `;
  const values = [
    nowSaoPaulo.toDate(),
    nowSaoPaulo.toDate(),
    nowSaoPaulo.toDate(),
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