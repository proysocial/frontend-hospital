import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar-item',
  imports: [RouterModule, MatIconModule],
  templateUrl: './sidebar-item.html',
  styleUrl: './sidebar-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarItem {
  @Input() icon = ""
  @Input() label = ""
  @Input() active = false
  @Input() link = "" 
}
