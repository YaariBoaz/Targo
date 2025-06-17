import { Component, OnInit } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-bottom-menu',
  templateUrl: './bottom-menu.component.html',
  styleUrls: ['./bottom-menu.component.scss'],
  standalone:true,
  imports:[MatIconModule]
})
export class BottomMenuComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
