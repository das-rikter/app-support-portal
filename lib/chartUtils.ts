export function getProductPalette(product: string): string {
  switch (product) {
    case 'BestRide':
    case 'BestRide (B)':
      return '#1f77b4';
    case 'CDXP':
    case 'CDXP (C)':
      return '#aec7e8';
    case "Central API's":
      return '#f7c6c7';
    case 'Credit Logix':
    case 'Credit Logix (CL)':
      return '#ff7f0e';
    case 'Engage To Sell':
    case 'Engage To Sell (ETS)':
      return '#2ca02c';
    case 'Lot Vantage':
    case 'Lot Vantage (LV)':
      return '#98df8a';
    case 'Media Logix':
    case 'Media Logix (ML)':
      return '#d62728';
    case 'Response Logix':
    case 'Response Logix (RL)':
      return '#ff9896';
    case 'Response Path':
    case 'Response Path (RP)':
      return '#9467bd';
    case 'Social Logix':
    case 'Social Logix (SL)':
      return '#c5b0d5';
    default:
      return '#000000';
  }
}

export const PRIORITY_ORDER = ['Highest', 'High', 'Medium', 'Low', 'Lowest'] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  Highest: '#dc2626',
  High: '#f97316',
  Medium: '#2563eb',
  Low: '#0891b2',
  Lowest: '#94a3b8',
};

export function tickColors() {
  return {
    label: '#1a202c',
    muted: '#5a6478',
    grid: 'rgba(0,0,0,0.07)',
  };
}

export function tickDefaults() {
  const { muted } = tickColors();
  return { color: muted, font: { family: "'Satoshi', sans-serif", size: 11 } };
}

export function axisDefaults() {
  const { grid } = tickColors();
  return {
    grid: { color: grid, lineWidth: 1 },
    ticks: tickDefaults(),
    border: { color: 'transparent' },
  };
}
