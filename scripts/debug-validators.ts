/**
 * Debug script to test validators directly
 */

import {
  validateCURP
} from '../src/lib/detect/patterns-latam.js';
import {
  validateChineseID,
  validateMyNumber
} from '../src/lib/detect/patterns-asian.js';
import {
  validateDNI_ES,
  validateNIE_ES
} from '../src/lib/detect/patterns-european.js';

console.log('=== Debugging Validators ===\n');

console.log('CURP Tests:');
console.log('  HEGG560427MVZRRL04:', validateCURP('HEGG560427MVZRRL04'));
console.log('  MAMX850203HDFRLN06:', validateCURP('MAMX850203HDFRLN06'));
console.log();

console.log('Chinese ID Tests:');
console.log('  110101199003078515:', validateChineseID('110101199003078515'));
console.log('  11010119900307854X:', validateChineseID('11010119900307854X'));
console.log();

console.log('My Number Tests:');
console.log('  123456789012:', validateMyNumber('123456789012'));
console.log();

console.log('Spanish DNI Tests:');
console.log('  12345678Z:', validateDNI_ES('12345678Z'));
console.log('  87654321X:', validateDNI_ES('87654321X'));
console.log();

console.log('Spanish NIE Tests:');
console.log('  X1234567L:', validateNIE_ES('X1234567L'));
console.log('  Y7654321G:', validateNIE_ES('Y7654321G'));
console.log('  Z1234567R:', validateNIE_ES('Z1234567R'));
console.log();
