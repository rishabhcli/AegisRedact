/**
 * Detailed calculator for check digits
 */

// CURP
function calculateCURPCheckDigit(curpBase: string): string {
  console.log(`\nCalculating CURP check digit for: ${curpBase}`);

  const checksumTable = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const char = curpBase[i];
    const value = checksumTable.indexOf(char);
    const weight = 18 - i;
    const contribution = value * weight;
    console.log(`  [${i}] ${char} -> value:${value} * weight:${weight} = ${contribution}`);
    sum += contribution;
  }

  console.log(`  Sum: ${sum}`);
  const checkDigit = (10 - (sum % 10)) % 10;
  console.log(`  Check digit: (10 - (${sum} % 10)) % 10 = ${checkDigit}`);

  return curpBase + checkDigit.toString();
}

// Chinese ID
function calculateChineseIDCheckDigit(base: string): string {
  console.log(`\nCalculating Chinese ID check digit for: ${base}`);

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkChars = '10X98765432';
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const digit = parseInt(base[i], 10);
    const contribution = digit * weights[i];
    console.log(`  [${i}] ${digit} * ${weights[i]} = ${contribution}`);
    sum += contribution;
  }

  console.log(`  Sum: ${sum}`);
  console.log(`  Sum % 11: ${sum % 11}`);
  const checkChar = checkChars[sum % 11];
  console.log(`  Check char: ${checkChar}`);

  return base + checkChar;
}

// My Number
function calculateMyNumberCheckDigit(base: string): string {
  console.log(`\nCalculating My Number check digit for: ${base}`);

  const P_N = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  let sum = 0;

  for (let i = 0; i < 11; i++) {
    const digit = parseInt(base[i], 10);
    let n = digit * P_N[i];
    const contribution = Math.floor(n / 10) + (n % 10);
    console.log(`  [${i}] ${digit} * ${P_N[i]} = ${n} -> ${Math.floor(n / 10)} + ${n % 10} = ${contribution}`);
    sum += contribution;
  }

  console.log(`  Sum: ${sum}`);
  const checkDigit = (10 - (sum % 10)) % 10;
  console.log(`  Check digit: (10 - (${sum} % 10)) % 10 = ${checkDigit}`);

  return base + checkDigit.toString();
}

// Spanish DNI
function calculateDNICheckLetter(baseNumber: string): string {
  console.log(`\nCalculating DNI check letter for: ${baseNumber}`);

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const number = parseInt(baseNumber, 10);
  const remainder = number % 23;
  const letter = letters.charAt(remainder);

  console.log(`  ${number} % 23 = ${remainder}`);
  console.log(`  Letter: ${letter}`);

  return baseNumber + letter;
}

// Spanish NIE
function calculateNIECheckLetter(prefix: string, baseNumber: string): string {
  console.log(`\nCalculating NIE check letter for: ${prefix}${baseNumber}`);

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const prefixMap: Record<string, number> = { 'X': 0, 'Y': 1, 'Z': 2 };
  const fullNumber = prefixMap[prefix].toString() + baseNumber;
  const number = parseInt(fullNumber, 10);
  const remainder = number % 23;
  const letter = letters.charAt(remainder);

  console.log(`  Prefix ${prefix} -> ${prefixMap[prefix]}`);
  console.log(`  Full number: ${fullNumber} = ${number}`);
  console.log(`  ${number} % 23 = ${remainder}`);
  console.log(`  Letter: ${letter}`);

  return prefix + baseNumber + letter;
}

// Test cases
console.log('=== Check Digit Calculations ===');

calculateCURPCheckDigit('MAMX850203HDFRLN0');
calculateChineseIDCheckDigit('11010119900307854');
calculateMyNumberCheckDigit('12345678901');
calculateDNICheckLetter('87654321');
calculateNIECheckLetter('Y', '7654321');
