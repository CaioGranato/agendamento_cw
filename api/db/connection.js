const { Pool } = require('pg');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:66f26cf0a1b545cfb04266ee8c678016@postgres:5432/postgres',
  ssl: false, // Disable SSL for internal Docker network
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const createTableIfNotExists = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schedule_msg (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      datetime TIMESTAMP WITH TIME ZONE NOT NULL,
      message TEXT NOT NULL,
      attachments JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'scheduled',
      edit_id UUID,
      previous_edit_ids JSONB DEFAULT '[]'::jsonb,
      contactid INTEGER NOT NULL,
      conversationid INTEGER NOT NULL,
      lastupdate TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      lastupdateutc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      scheduled_for TIMESTAMP WITHOUT TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_schedule_msg_contactid ON schedule_msg(contactid);
    CREATE INDEX IF NOT EXISTS idx_schedule_msg_status ON schedule_msg(status);
    CREATE INDEX IF NOT EXISTS idx_schedule_msg_datetime ON schedule_msg(datetime);
  `;

  try {
    await pool.query(createTableQuery);
    console.log('Table schedule_msg created or already exists');
  } catch (error) {
    console.error('Error creating table:', error);
  }
};

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
    SELECT * FROM schedule_msg 
    WHERE contactid = $1 
    ORDER BY datetime ASC
  `;
  const result = await executeQuery(query, [contactId]);
  return result.rows;
};

const createSchedule = async (scheduleData) => {
  const {
    datetime,
    message,
    attachments = [],
    contactid,
    conversationid,
    status = 'scheduled'
  } = scheduleData;

  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');
  const datetimeSaoPaulo = dayjs.tz(datetime, 'America/Sao_Paulo');
  
  const query = `
    INSERT INTO schedule_msg (
      datetime, message, attachments, contactid, conversationid, status,
      lastupdate, lastupdateutc, timestamp, scheduled_for
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const values = [
    datetimeSaoPaulo.toISOString(),
    message,
    JSON.stringify(attachments),
    contactid,
    conversationid,
    status,
    nowSaoPaulo.format('YYYY-MM-DD HH:mm:ss'),
    nowSaoPaulo.toISOString(),
    nowSaoPaulo.format('YYYY-MM-DD HH:mm:ss'),
    datetimeSaoPaulo.format('YYYY-MM-DD HH:mm:ss')
  ];
  
  const result = await executeQuery(query, values);
  return result.rows[0];
};

const updateSchedule = async (id, scheduleData) => {
  const {
    datetime,
    message,
    attachments,
    status
  } = scheduleData;

  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');
  const datetimeSaoPaulo = datetime ? dayjs.tz(datetime, 'America/Sao_Paulo') : null;
  
  const query = `
    UPDATE schedule_msg 
    SET 
      datetime = COALESCE($1, datetime),
      message = COALESCE($2, message),
      attachments = COALESCE($3, attachments),
      status = COALESCE($4, status),
      lastupdate = $5,
      lastupdateutc = $6,
      scheduled_for = COALESCE($7, scheduled_for),
      updated_at = NOW()
    WHERE id = $8
    RETURNING *
  `;
  
  const values = [
    datetimeSaoPaulo ? datetimeSaoPaulo.toISOString() : null,
    message,
    attachments ? JSON.stringify(attachments) : null,
    status,
    nowSaoPaulo.format('YYYY-MM-DD HH:mm:ss'),
    nowSaoPaulo.toISOString(),
    datetimeSaoPaulo ? datetimeSaoPaulo.format('YYYY-MM-DD HH:mm:ss') : null,
    id
  ];
  
  const result = await executeQuery(query, values);
  return result.rows[0];
};

const deleteSchedule = async (id) => {
  const query = 'DELETE FROM schedule_msg WHERE id = $1 RETURNING *';
  const result = await executeQuery(query, [id]);
  return result.rows[0];
};

const getScheduleById = async (id) => {
  const query = 'SELECT * FROM schedule_msg WHERE id = $1';
  const result = await executeQuery(query, [id]);
  return result.rows[0];
};

module.exports = {
  pool,
  createTableIfNotExists,
  executeQuery,
  getSchedulesByContactId,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleById
};