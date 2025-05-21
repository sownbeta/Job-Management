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
