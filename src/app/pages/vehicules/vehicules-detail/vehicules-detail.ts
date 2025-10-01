import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Vehicules } from '../../../services/vehicules/vehicules';

@Component({
  selector: 'app-vehicules-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehicules-detail.html',
  styleUrl: './vehicules-detail.css'
})
export class VehiculesDetail {
  private vehiculeService = inject(Vehicules);
  private route = inject(ActivatedRoute);

  vm$ = this.route.paramMap.pipe(
    switchMap(p => this.vehiculeService.getPerso(Number(p.get('id'))))
  );
}
