/**
 * Debug specific validator failures
 */

import { validateCURP } from '../src/lib/detect/patterns-latam.js';
import { validateChineseID } from '../src/lib/detect/patterns-asian.js';
import { validateDNI_ES, validateNIE_ES } from '../src/lib/detect/patterns-european.js';

console.log('=== Detailed Debugging ===\n');

// Test CURP: MAMX850203HDFRLN06
console.log('CURP: MAMX850203HDFRLN06');
const curp = 'MAMX850203HDFRLN06';
console.log('  Length:', curp.length);
console.log('  Date part: 850203 (year=85, month=02, day=03)');
console.log('  Gender: H (valid)');
console.log('  State: DF');

// Manually calculate checksum
const checksumTable = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
let sum = 0;
for (let i = 0; i < 17; i++) {
  const char = curp[i];
  const value = checksumTable.indexOf(char);
  sum += value * (18 - i);
}
console.log('  Checksum sum:', sum);
console.log('  Check digit: (10 - (' + sum + ' % 10)) % 10 =', (10 - (sum % 10)) % 10);
console.log('  Expected check digit:', curp[17]);
console.log('  Validator result:', validateCURP(curp));
console.log();

// Test Chinese ID: 11010119900307854X
console.log('Chinese ID: 11010119900307854X');
const chineseId = '11010119900307854X';
console.log('  Length:', chineseId.length);

const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const checkChars = '10X98765432';
let chineseSum = 0;
for (let i = 0; i < 17; i++) {
  chineseSum += parseInt(chineseId[i], 10) * weights[i];
}
console.log('  Checksum sum:', chineseSum);
console.log('  Sum % 11:', chineseSum % 11);
console.log('  Expected check char:', checkChars[chineseSum % 11]);
console.log('  Actual check char:', chineseId[17]);
console.log('  Validator result:', validateChineseID(chineseId));
console.log();

// Test DNI: 87654321X
console.log('DNI: 87654321X');
const dni = '87654321X';
const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
const number = parseInt(dni.substring(0, 8), 10);
const remainder = number % 23;
console.log('  Number:', number);
console.log('  Remainder:', remainder);
console.log('  Expected letter:', letters.charAt(remainder));
console.log('  Actual letter:', dni.charAt(8));
console.log('  Validator result:', validateDNI_ES(dni));
console.log();

// Test NIE: Y7654321G
console.log('NIE: Y7654321G');
const nie = 'Y7654321G';
const prefixMap: Record<string, number> = { 'X': 0, 'Y': 1, 'Z': 2 };
const fullNumber = prefixMap['Y'].toString() + nie.substring(1, 8);
const nieNumber = parseInt(fullNumber, 10);
const nieRemainder = nieNumber % 23;
console.log('  Full number:', fullNumber, '=', nieNumber);
console.log('  Remainder:', nieRemainder);
console.log('  Expected letter:', letters.charAt(nieRemainder));
console.log('  Actual letter:', nie.charAt(8));
console.log('  Validator result:', validateNIE_ES(nie));
