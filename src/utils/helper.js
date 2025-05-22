import moment from 'moment';
import 'moment-timezone';
import cronstrue from 'cronstrue';

export const dateToCron = (date, type, form) => {
  if (type === 'custom') return form.getFieldValue('custom_cron');
  if (type === 'run_once') {
    const minute = date.minute();
    const hour = (date.hour() + 2) % 24; 
    const day = date.date();
    const month = date.month() + 1;
    return `${minute} ${hour} ${day} ${month} *`;
  }
  const minute = date.minute();
  const hour = (date.hour() + 2) % 24; 
  return `${minute} ${hour} * * *`;
};

export const formatToJST = (time) => {
  if (!time) return 'N/A';
  return moment(time).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH:mm:ss');
};

export const updateCronPreview = (cron, language) => {
  try {
    const description = cronstrue.toString(cron, { throwExceptionOnParseError: true });
    return description;
  } catch (error) {
    console.error('Invalid cron expression:', error);
    return language === 'en' ? 'Invalid cron expression' : '無効なcron式';
  }
};
