/**
 * Find a Chilean RUT that ends in 'K'
 */

function generateValidRUT(baseNumber: string): string {
  const digits = baseNumber;
  let sum = 0;
  let multiplier = 2;

  for (let i = digits.length - 1; i >= 0; i--) {
    sum += parseInt(digits[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  let checkChar: string;
  if (checkDigit === 11) {
    checkChar = '0';
  } else if (checkDigit === 10) {
    checkChar = 'K';
  } else {
    checkChar = checkDigit.toString();
  }

  return { full: `${baseNumber}-${checkChar}`, checkChar };
}

// Find RUTs that end in 'K'
console.log('Finding RUTs that end in K:\n');

for (let i = 10000000; i < 10000100; i++) {
  const result = generateValidRUT(i.toString());
  if (result.checkChar === 'K') {
    console.log('  ', result.full);
  }
}

// Also generate one with X check digit for Chinese ID
console.log('\n\nFinding Chinese ID with X check digit:\n');

const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const checkChars = '10X98765432';

for (let i = 110101199003070000; i < 110101199003071000; i++) {
  const base = i.toString();
  let sum = 0;

  for (let j = 0; j < 17; j++) {
    sum += parseInt(base[j], 10) * weights[j];
  }

  const checkChar = checkChars[sum % 11];
  if (checkChar === 'X') {
    console.log('  ', base + checkChar);
    break;
  }
}
