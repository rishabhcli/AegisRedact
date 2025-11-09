/**
 * Find valid 8-digit BSN that becomes valid when padded to 9 digits
 */

function validateBSN(bsn: string): boolean {
  const digits = bsn.replace(/\D/g, '');
  const paddedBSN = digits.padStart(9, '0');

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const weight = (9 - i);
    const digit = parseInt(paddedBSN[i], 10);
    sum += digit * (i === 8 ? -1 : weight);
  }

  return sum % 11 === 0;
}

console.log('Testing 8-digit BSNs:\n');

// Test a few 8-digit numbers
const testNumbers = [
  '12345678',
  '11122233',
  '12345670',
  '10000001',
  '10000012',
  '10000023',
  '10000034',
  '10000045'
];

for (const num of testNumbers) {
  const isValid = validateBSN(num);
  const padded = num.padStart(9, '0');
  console.log(`${num} -> ${padded}: ${isValid ? '✓ VALID' : '✗ invalid'}`);
}

console.log('\n\nSearching for valid 8-digit BSNs...\n');

let found = 0;
for (let i = 10000000; i < 10000100 && found < 5; i++) {
  const num = i.toString();
  if (validateBSN(num)) {
    console.log(`  ${num} ✓`);
    found++;
  }
}
