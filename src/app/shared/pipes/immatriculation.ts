import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'immat', standalone: true })
export class ImmatriculationPipe implements PipeTransform {
  transform(v?: string | null) {
    if (!v) return '—';
    return v.toUpperCase().replace(/[^A-Z0-9]/g,'').replace(
      /^([A-Z]{2})(\d{3})([A-Z]{2})$/,
      '$1-$2-$3'
    );
  }
}
