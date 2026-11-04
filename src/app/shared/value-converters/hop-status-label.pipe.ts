import { getHopStatusLabel } from '../../common/utility';
import { Pipe, PipeTransform } from '@angular/core';
import { HopStatus } from '../../common/enums';

@Pipe({ name: 'hopStatusLabel', standalone: true })
export class HopStatusLabelValueConverter implements PipeTransform {
    transform(value: HopStatus): string {
        return getHopStatusLabel(value);
    }
}
