import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserProfile } from '../user-profile/user-profile';
import { SidebarItem } from '../sidebar-item/sidebar-item';



@Component({
  selector: 'app-sidebar',
  imports: [UserProfile, SidebarItem],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar { 
  
}
