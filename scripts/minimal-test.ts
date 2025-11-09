/**
 * Minimal test to isolate the issue
 */

import { validateCURP } from '../src/lib/detect/patterns-latam';
import { validateChineseID } from '../src/lib/detect/patterns-asian';
import { validateDNI_ES, validateNIE_ES } from '../src/lib/detect/patterns-european';

console.log('Testing with relative imports (like tests do):');
console.log('validateCURP("MAMX850203HDFRLN06"):', validateCURP('MAMX850203HDFRLN06'));
console.log('validateChineseID("11010119900307854X"):', validateChineseID('11010119900307854X'));
console.log('validateDNI_ES("87654321X"):', validateDNI_ES('87654321X'));
console.log('validateNIE_ES("Y7654321G"):', validateNIE_ES('Y7654321G'));
