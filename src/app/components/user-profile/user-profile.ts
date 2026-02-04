import { ChangeDetectionStrategy, Component} from '@angular/core';
import { Cargo } from '../../enums/cargo.enum';

@Component({
  selector: 'app-user-profile',
  imports: [],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile {
  //Atributos
  nombre:String = "Jorge Lopez"
  cargo:Cargo = Cargo.Administrador

  //Getter
  get iniciales(): String {
    const partesNombre = this.nombre.split(" "); 

    const primera = partesNombre[0].charAt(0);
    const segunda = partesNombre.length > 1 ? partesNombre[1].charAt(0) : "";

    return (primera + segunda).toUpperCase();
  }

}



