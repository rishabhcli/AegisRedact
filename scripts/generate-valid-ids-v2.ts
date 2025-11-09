/**
 * Generate valid IDs using the ACTUAL algorithms from the validators
 */

// My Number - Using correct algorithm from validator
function generateValidMyNumber(base: string): string {
  console.log(`\nGenerating valid My Number from base: ${base}`);

  // Weights from actual validator: [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const weights = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 11; i++) {
    const digit = parseInt(base[i], 10);
    const contribution = digit * weights[i];
    console.log(`  [${i}] ${digit} * ${weights[i]} = ${contribution}`);
    sum += contribution;
  }

  console.log(`  Sum: ${sum}`);
  const remainder = sum % 11;
  console.log(`  Remainder: ${remainder}`);

  let checkDigit: number;
  if (remainder <= 1) {
    checkDigit = 0;
  } else {
    checkDigit = 11 - remainder;
  }

  console.log(`  Check digit: ${checkDigit}`);
  return base + checkDigit.toString();
}

// Test with different bases
console.log('=== Generating Valid My Numbers ===');

const myNumberBases = [
  '12345678901',
  '98765432101',
  '11111111111',
  '10000000001',
  '50000000001'
];

for (const base of myNumberBases) {
  const valid = generateValidMyNumber(base);
  console.log(`  Result: ${valid}\n`);
}

// Find a My Number that looks reasonable
console.log('\n=== Searching for reasonable My Numbers ===\n');

for (let i = 10000000000; i <= 10000000050; i++) {
  const base = i.toString();
  const weights = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let j = 0; j < 11; j++) {
    sum += parseInt(base[j], 10) * weights[j];
  }

  const remainder = sum % 11;
  const checkDigit = (remainder <= 1) ? 0 : (11 - remainder);

  console.log(`${base}${checkDigit}`);
}
