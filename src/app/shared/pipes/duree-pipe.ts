import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duree',
})
export class DureePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
