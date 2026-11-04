import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "currency",
    standalone : true
 })
export class CurrencyPipe implements PipeTransform {
    transform(value: number): string {
        return this.formatNumberWithPipe(value);
    }

    private formatNumberWithPipe(number: number): string {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}
