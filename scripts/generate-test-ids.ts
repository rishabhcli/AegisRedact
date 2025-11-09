/**
 * Script to generate valid test IDs for international validators
 * This helps create test data that passes checksum algorithms
 */

// Chilean RUT
function generateValidRUT(baseNumber: string): string {
  const digits = baseNumber;
  let sum = 0;
  let multiplier = 2;

  // Process digits from right to left
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

  return `${baseNumber}-${checkChar}`;
}

// Mexican CURP
function generateValidCURP(curpBase: string): string {
  const checksumTable = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const char = curpBase[i];
    const value = checksumTable.indexOf(char);
    sum += value * (18 - i);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return curpBase + checkDigit.toString();
}

// Chinese ID
function generateValidChineseID(base: string): string {
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkChars = '10X98765432';
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    sum += parseInt(base[i], 10) * weights[i];
  }

  return base + checkChars[sum % 11];
}

// Japanese My Number
function generateValidMyNumber(base: string): string {
  const P_N = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  let sum = 0;

  for (let i = 0; i < 11; i++) {
    let n = parseInt(base[i], 10) * P_N[i];
    sum += Math.floor(n / 10) + (n % 10);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit.toString();
}

// Spanish DNI
function generateValidDNI(baseNumber: string): string {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const number = parseInt(baseNumber, 10);
  const letter = letters.charAt(number % 23);
  return baseNumber + letter;
}

// Spanish NIE
function generateValidNIE(prefix: string, baseNumber: string): string {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const prefixMap: Record<string, number> = { 'X': 0, 'Y': 1, 'Z': 2 };
  const fullNumber = prefixMap[prefix].toString() + baseNumber;
  const number = parseInt(fullNumber, 10);
  const letter = letters.charAt(number % 23);
  return prefix + baseNumber + letter;
}

// Dutch BSN
function generateValidBSN(baseNumber: string): string {
  const paddedBSN = baseNumber.padStart(8, '0');
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    const weight = (9 - i);
    sum += parseInt(paddedBSN[i], 10) * weight;
  }

  // Find check digit that makes sum % 11 === 0
  for (let checkDigit = 0; checkDigit <= 9; checkDigit++) {
    const testSum = sum - checkDigit;
    if (testSum % 11 === 0) {
      return paddedBSN + checkDigit.toString();
    }
  }

  return paddedBSN + '0';
}

console.log('=== Valid Test IDs ===\n');

console.log('Chilean RUT:');
console.log('  ', generateValidRUT('12345678'));  // Should generate valid check digit
console.log('  ', generateValidRUT('87654321'));
console.log();

console.log('Mexican CURP (with valid state and date):');
console.log('  ', generateValidCURP('HEGG560427MVZRRL0'));  // V=Veracruz
console.log('  ', generateValidCURP('MAMX850203HDFRLN0'));  // DF=Mexico City
console.log();

console.log('Chinese ID:');
console.log('  ', generateValidChineseID('11010119900307851'));
console.log('  ', generateValidChineseID('44052419890726001'));
console.log();

console.log('Japanese My Number:');
console.log('  ', generateValidMyNumber('12345678901'));
console.log('  ', generateValidMyNumber('98765432101'));
console.log();

console.log('Spanish DNI:');
console.log('  ', generateValidDNI('12345678'));
console.log('  ', generateValidDNI('87654321'));
console.log();

console.log('Spanish NIE:');
console.log('  ', generateValidNIE('X', '1234567'));
console.log('  ', generateValidNIE('Y', '7654321'));
console.log('  ', generateValidNIE('Z', '1234567'));
console.log();

console.log('Dutch BSN:');
console.log('  ', generateValidBSN('11122233'));
console.log('  ', generateValidBSN('12345678'));
console.log();
