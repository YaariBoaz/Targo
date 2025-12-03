import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { registerChartJS } from './app/core/config/chart.config';

// Register Chart.js components
registerChartJS();

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
