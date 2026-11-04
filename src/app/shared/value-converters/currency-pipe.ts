// replace-commas.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'replaceCommas',
})
export class ReplaceCommasPipe implements PipeTransform {
	transform(value: number): string {
		if (!isNaN(value) && typeof value === 'number') {
			var currencySymbol = '₹ ';
			var roundedValue = value.toFixed(2); // Round the value to 2 decimal places
			var result = roundedValue.toString().split('.');

			var lastThree = result[0].substring(result[0].length - 3);
			var otherNumbers = result[0].substring(0, result[0].length - 3);
			if (otherNumbers != '') lastThree = ',' + lastThree;
			var output = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

			if (result.length > 1) {
				output += '.' + result[1];
			}

			return currencySymbol + output;
		} else {
			// Handle the case when value is not a valid number
			console.error('Invalid value:', value);
			return ''; // or any other appropriate fallback value
		}
	}
}
