import { getPointTypeLabel } from '../../common/utility';
import { PointType } from '../../common/enums';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pointTypeLabel', standalone: true })

export class PointTypeLabelValueConverter implements PipeTransform  {
    transform(value: PointType): string {
        return getPointTypeLabel(value);
    }
}
