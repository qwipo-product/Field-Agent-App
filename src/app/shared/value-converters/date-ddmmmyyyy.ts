import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'date_ddmmmyyyy',
    standalone: true })
export class DateDDMMMYYYPipe implements PipeTransform {
    transform(date: number): any {
        var givenDate = new Date(date);
        var dd: number = givenDate.getDate();
        var mm: number = (givenDate.getMonth());
        var yyyy = givenDate.getFullYear();
        var dateContext: string = "";
        var monthName: string = "";
        switch (mm) {
            case 0:
                monthName = 'Jan';
                break;
            case 1:
                monthName = 'Feb';
                break;
            case 2:
                monthName = 'Mar';
                break;
            case 3:
                monthName = 'Apr';
                break;
            case 4:
                monthName = 'May';
                break;
            case 5:
                monthName = 'Jun';
                break;
            case 6:
                monthName = 'Jul';
                break;
            case 7:
                monthName = 'Aug';
                break;
            case 8:
                monthName = 'Sept';
                break;
            case 9:
                monthName = 'Oct';
                break;
            case 10:
                monthName = 'Nov';
                break;
            case 11:
                monthName = 'Dec';
                break;

            default:
                monthName = 'mmm';
                break;
        }
        dateContext = `${dd}-${monthName}-${yyyy}`;
        return dateContext;
    }

}
