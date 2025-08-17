import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular'; // Import Lucide icons

@Component({
  selector: 'app-kpi',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kpi.component.html',
  styleUrls: ['./kpi.component.scss'],
})
export class KpiComponent {
  @Input() icon!: string;
  @Input() label!: string;
  @Input() value!: string;
}
