import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ScheduledMessage, Contact, Conversation } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);

// Alert webhook function
export const sendAlertWebhook = async (
    scheduleData: ScheduledMessage,
    contact: Contact,
    conversation: Conversation
): Promise<boolean> => {
    const ALERT_WEBHOOK_URL = process.env.N8N_ALERT_WEBHOOK_URL;
    
    if (!ALERT_WEBHOOK_URL) {
        console.error('Alert webhook URL not configured');
        return false;
    }
    
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
        const response = await fetch(ALERT_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'no-cors'
        });
        
        console.log('Alert webhook sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending alert webhook:', error);
        return false;
    }
};