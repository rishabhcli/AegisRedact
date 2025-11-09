/**
 * Find a Chinese ID that ends in 'X'
 */

const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const checkChars = '10X98765432';

// Try specific base IDs
const testBases = [
  '11010119900307850',
  '11010119900307851',
  '11010119900307852',
  '11010119900307853',
  '11010119900307854',
  '11010119900307855',
  '11010119900307856',
  '11010119900307857',
  '11010119900307858',
  '11010119900307859'
];

console.log('Testing for Chinese ID with X check digit:\n');

for (const base of testBases) {
  let sum = 0;

  for (let j = 0; j < 17; j++) {
    sum += parseInt(base[j], 10) * weights[j];
  }

  const checkChar = checkChars[sum % 11];
  console.log(`${base}${checkChar} (check: ${checkChar})`);

  if (checkChar === 'X') {
    console.log(`\n✓ Found: ${base}${checkChar}`);
  }
}
