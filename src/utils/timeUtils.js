export function renderJSTTime(cronSchedule) {
  if (!cronSchedule) return 'N/A';
  try {
    if (cronSchedule === '* * * * *') return '毎分 ( Every minute )';
    const parts = cronSchedule.split(' ');
    if (parts.length < 2) return 'Invalid Time';
    const [minute, hour] = parts.map(Number);
    if (isNaN(minute) || isNaN(hour) || minute < 0 || minute > 59 || hour < 0 || hour > 23) {
      return 'Invalid Time';
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    // Tạo ngày giờ theo giờ Việt Nam (UTC+7)
    const vietnamDate = new Date(year, month, day, hour, minute, 0, 0);
    if (isNaN(vietnamDate.getTime())) return 'Invalid Time';
    // Chuyển sang JST (UTC+9, lệch +2 tiếng so với VN)
    const jstDate = new Date(vietnamDate.getTime() + 2 * 60 * 60 * 1000);
    if (isNaN(jstDate.getTime())) return 'Invalid Time';
    const jstYear = jstDate.getFullYear();
    const jstMonth = jstDate.getMonth() + 1;
    const jstDay = jstDate.getDate();
    const formattedTime = jstDate.toLocaleString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${jstYear}年${jstMonth}月${jstDay}日 ${formattedTime} JST`;
  } catch {
    return 'Invalid Time';
  }
}
