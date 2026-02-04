import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar-item',
  imports: [MatIconModule],
  templateUrl: './sidebar-item.html',
  styleUrl: './sidebar-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarItem {
  @Input() icon = ""
  @Input() label = ""
  @Input() active = false

}
