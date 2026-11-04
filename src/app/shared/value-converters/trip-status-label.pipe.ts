import { getTripStatusLabel } from '../../common/utility';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tripStatus', standalone: true })

export class TripStatusPipe implements PipeTransform  {
    transform(value: number): string {
        return getTripStatusLabel(value);
    }
}
