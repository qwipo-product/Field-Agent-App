export function isValidEmail(email: string) {
    var re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
export function isValidName(name: string) {
    var reg = /^[a-zA-Z ]+$/;
    return reg.test(name);
}

export function isValidMobileNumber(value: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/; // Validates a 10-digit Indian mobile number
    return phoneRegex.test(value);
}

export function isValidOTPNumber(value: string): boolean {
    const phoneRegex = /^[0-9]\d{5}$/;
    return phoneRegex.test(value);
}

export function isValidStreet(name: string) {
    var reg = /^(?!0+$)(?=.*[a-zA-Z])[a-zA-Z0-9 ']*$/;
    return reg.test(name);
}
export function isValidState(name: string) {
    var reg = /^[a-zA-Z]*$/;
    return reg.test(name);
}
export function isValidLandmark(name: string) {
    var reg = /^[a-zA-Z ]*$/;
    return reg.test(name);
}

export function isValidCity(name: string) {
    // var reg = /^[a-zA-Z ]*$/;
    var reg = /^[a-zA-Z0-9 ]*$/;
    return reg.test(name);
}
export function isValidBusinessName(name: string) {
    var reg = /^[a-zA-Z0-9& ]{1,100}$/;
    return reg.test(name);
}
export function isValidPincode(name: string) {
    var reg = /^\d{6}$/;
    return reg.test(name);
}
export function validateAmount(amount: any) {
    var reg = /^[0-9]{0,6}\d*(\.\d{0,2})?$/;
    return reg.test(amount);
}
export function isValidGst(gstIn: string) {
    // var reg = /^([0-9]{2}[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[0-9]{1}[Zz]{1}[a-zA-Z]{1}){0,15}$/;
    // return reg.test(name);
    const codePointChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const mod = codePointChars.length;
    const inputChars = gstIn.slice(0, -1);
    let factor = 1;
    let total = 0;

    for (let char of inputChars) {
        let digit = factor * codePointChars.indexOf(char);
        digit = Math.floor(digit / mod) + (digit % mod);
        total += digit;
        factor = factor === 1 ? 2 : 1;
    }

    const checkDigit = codePointChars[(mod - (total % mod)) % mod];
    return gstIn.slice(-1) === checkDigit;
}
export function containsSpecialChars(input: string): boolean {
    const regex: RegExp = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

    return regex.test(input);
}
export function validateSpecialCharacters(input: string): boolean {
    const hasLettersAndNumbers = /[a-zA-Z]+.*\d+|\d+.*[a-zA-Z]+/;

    return hasLettersAndNumbers.test(input);
}
export function validateOnlyNumbers(input: string): boolean {
    const onlyNumbers = /^\d+$/;

    return onlyNumbers.test(input);
}
export function validateText(input: string): boolean {
    const onlyLetters = /^[A-Za-z\s]+$/;
    return onlyLetters.test(input);
}
