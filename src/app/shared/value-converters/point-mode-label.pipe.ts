import { Pipe, PipeTransform } from '@angular/core';
import { getPointModeLabel } from '../../common/utility';
import { PointMode } from '../../common/enums';

@Pipe({ name: 'pointModeLabel', standalone: true })
export class PointModeLabelValueConverter implements PipeTransform {
    transform(value: PointMode): string {
        return getPointModeLabel(value);
    }
}
