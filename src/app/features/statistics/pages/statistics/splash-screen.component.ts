import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        style({ opacity: 1 }),
        animate('600ms ease-out', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class SplashScreenComponent implements OnInit {
  // Control visibility from the parent component
  @Input() show: boolean = true;

  async ngOnInit() {
    // Hide the native splash screen (the "first" one) immediately when this component loads
    await SplashScreen.hide();
  }
}
