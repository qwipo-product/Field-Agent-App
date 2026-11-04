import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'vehicleType',
    standalone: true
})
export class VehicleTypePipe  implements PipeTransform{
    transform(type: number): any {
        if (type == 0) {
            return "N/A";
        }
        return `${type} Wheeler`; ///VehicleModel[type];
    }
}
