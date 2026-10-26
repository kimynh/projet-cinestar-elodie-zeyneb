import { Pipe, PipeTransform } from '@angular/core';

// 148 → « 2h28 »
@Pipe({
  name: 'duree',
})
export class DureePipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (!minutes) {
      return '';
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
  }
}
