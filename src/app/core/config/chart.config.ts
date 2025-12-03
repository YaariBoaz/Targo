import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
export function registerChartJS() {
  Chart.register(...registerables);
}
