import {
  Component,
  ChangeDetectorRef,
  NgZone,
  OnInit,
  Type,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService, StackEntry } from '../navigation.service';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-navigation-outlet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation-outlet.component.html',
  styleUrls: ['./navigation-outlet.component.scss'],
})
export class NavigationOutletComponent implements OnInit {
  stack: StackEntry[] = [];

  constructor(
    public nav: NavigationService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone,
    public platformService: PlatformService
  ) {}

  ngOnInit(): void {
    this.nav.stackChanges$.subscribe(stack => {
      this.zone.run(() => {
        this.stack = stack;
        this.cdRef.markForCheck();
      });
    });
  }

  trackByKey(index: number, entry: StackEntry): number {
    return entry.key;
  }
}
