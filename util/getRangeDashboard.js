// Utility to get start/end date based on filter type
const getDateRange = (filter, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (filter) {
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'weekly': {
      const first = now.getDate() - now.getDay();
      start = new Date(now.setDate(first));
      end = new Date(now.setDate(first + 6));
      break;
    }
    case 'custom':
      start = new Date(startDate);
      end = new Date(endDate);
      break;
    default:
      start = new Date(2000, 0, 1);
      end = new Date();
  }

  return { start, end };
};

export default getDateRange;
