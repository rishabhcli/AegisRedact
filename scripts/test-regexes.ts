/**
 * Test if IDs match the regex patterns before validation
 */

import {
  CHINESE_ID,
  JAPANESE_MY_NUMBER
} from '../src/lib/detect/patterns-asian.js';

import {
  CURP_MX
} from '../src/lib/detect/patterns-latam.js';

import {
  DNI_ES,
  NIE_ES
} from '../src/lib/detect/patterns-european.js';

console.log('=== Testing Regex Patterns ===\n');

// Chinese ID
const chineseTests = ['110101199003078515', '11010119900307854X'];
console.log('Chinese ID regex:', CHINESE_ID);
console.log('Chinese ID tests:');
for (const test of chineseTests) {
  const match = CHINESE_ID.test(test);
  console.log(`  ${test}: ${match ? '✓ matches' : '✗ no match'}`);
  // Reset regex lastIndex
  CHINESE_ID.lastIndex = 0;
}
console.log();

// Japanese My Number
const myNumberTests = ['123456789018', '1234-5678-9018', '100000000005'];
console.log('Japanese My Number regex:', JAPANESE_MY_NUMBER);
console.log('My Number tests:');
for (const test of myNumberTests) {
  const match = JAPANESE_MY_NUMBER.test(test);
  console.log(`  ${test}: ${match ? '✓ matches' : '✗ no match'}`);
  JAPANESE_MY_NUMBER.lastIndex = 0;
}
console.log();

// CURP
const curpTests = ['HEGG560427MVZRRL04', 'MAMX850203HDFRLN06'];
console.log('CURP regex:', CURP_MX);
console.log('CURP tests:');
for (const test of curpTests) {
  const match = CURP_MX.test(test);
  console.log(`  ${test}: ${match ? '✓ matches' : '✗ no match'}`);
  CURP_MX.lastIndex = 0;
}
console.log();

// Spanish DNI
const dniTests = ['12345678Z', '87654321X'];
console.log('DNI regex:', DNI_ES);
console.log('DNI tests:');
for (const test of dniTests) {
  const match = DNI_ES.test(test);
  console.log(`  ${test}: ${match ? '✓ matches' : '✗ no match'}`);
  DNI_ES.lastIndex = 0;
}
console.log();

// Spanish NIE
const nieTests = ['X1234567L', 'Y7654321G', 'Z1234567R'];
console.log('NIE regex:', NIE_ES);
console.log('NIE tests:');
for (const test of nieTests) {
  const match = NIE_ES.test(test);
  console.log(`  ${test}: ${match ? '✓ matches' : '✗ no match'}`);
  NIE_ES.lastIndex = 0;
}
