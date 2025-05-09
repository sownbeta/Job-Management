export const dateToCronb = (timestamp) => {
  const d = new Date(timestamp);
  const min = d.getMinutes();
  const hour = d.getHours();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const dow = '*';
  return `${min} ${hour} ${day} ${month} ${dow}`;
};