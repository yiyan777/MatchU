export function formatDateHeader(date: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // 今天的 00:00

  const target = new Date(date);
  target.setHours(0, 0, 0, 0); // 訊息那天的 00:00

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = (target.getTime() - now.getTime()) / msPerDay;

  if (diffDays === 0) {
    return "今天";
  } else if (diffDays === -1) {
    return "昨天";
  } else {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
    return `${year}年${month}月${day}日（${weekday}）`;
  }
}
