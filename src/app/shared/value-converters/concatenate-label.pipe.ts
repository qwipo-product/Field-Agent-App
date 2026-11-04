import { getConcatenateLabel } from '../../common/utility';
import { Pipe, PipeTransform } from '@angular/core';
import { PointMode } from '../../common/enums';

@Pipe({ name: 'concatenateLabel', standalone: true })
export class ConcatenateLabelValueConverter implements PipeTransform {
    transform(value: PointMode): string {
        return getConcatenateLabel(value);
    }
}
