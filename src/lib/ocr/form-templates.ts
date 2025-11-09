/**
 * Form Template Recognition
 * Identifies common form types and applies template-specific field extraction
 */

export interface FormTemplate {
  name: string;
  description: string;
  keywords: string[];  // Keywords that indicate this form type
  fields: FormTemplateField[];
}

export interface FormTemplateField {
  label: string;
  type: 'name' | 'ssn' | 'email' | 'phone' | 'address' | 'date' | 'account' | 'ein' | 'wage' | 'generic';
  required: boolean;
  aliases: string[];  // Alternative label names
}

/**
 * W-2 Tax Form (Wage and Tax Statement)
 * Used by employers to report wages paid and taxes withheld
 */
const W2_TEMPLATE: FormTemplate = {
  name: 'W-2',
  description: 'Wage and Tax Statement',
  keywords: ['w-2', 'w2', 'wage and tax statement', 'form w-2', 'employer annual'],
  fields: [
    {
      label: 'Employee SSN',
      type: 'ssn',
      required: true,
      aliases: ['social security number', 'ssn', 'employee\'s social security number']
    },
    {
      label: 'Employer EIN',
      type: 'ein',
      required: true,
      aliases: ['employer identification number', 'ein', 'employer\'s ein']
    },
    {
      label: 'Employee Name',
      type: 'name',
      required: true,
      aliases: ['employee name', 'employee\'s name and address', 'name']
    },
    {
      label: 'Employee Address',
      type: 'address',
      required: true,
      aliases: ['employee address', 'address', 'street address']
    },
    {
      label: 'Employer Name',
      type: 'name',
      required: true,
      aliases: ['employer name', 'employer\'s name', 'company name']
    },
    {
      label: 'Employer Address',
      type: 'address',
      required: true,
      aliases: ['employer address', 'company address']
    },
    {
      label: 'Wages',
      type: 'wage',
      required: false,
      aliases: ['wages tips other compensation', 'box 1', 'wages']
    }
  ]
};

/**
 * I-9 Employment Eligibility Verification
 * Used to verify identity and employment authorization
 */
const I9_TEMPLATE: FormTemplate = {
  name: 'I-9',
  description: 'Employment Eligibility Verification',
  keywords: ['i-9', 'i9', 'employment eligibility', 'form i-9', 'uscis'],
  fields: [
    {
      label: 'Last Name',
      type: 'name',
      required: true,
      aliases: ['last name', 'surname', 'family name']
    },
    {
      label: 'First Name',
      type: 'name',
      required: true,
      aliases: ['first name', 'given name']
    },
    {
      label: 'Middle Initial',
      type: 'name',
      required: false,
      aliases: ['middle initial', 'middle name', 'mi']
    },
    {
      label: 'Date of Birth',
      type: 'date',
      required: true,
      aliases: ['date of birth', 'dob', 'birth date', 'birthday']
    },
    {
      label: 'SSN',
      type: 'ssn',
      required: true,
      aliases: ['social security number', 'ssn', 'u.s. social security number']
    },
    {
      label: 'Email Address',
      type: 'email',
      required: false,
      aliases: ['email', 'e-mail', 'email address']
    },
    {
      label: 'Telephone Number',
      type: 'phone',
      required: false,
      aliases: ['telephone', 'phone', 'phone number', 'tel']
    },
    {
      label: 'Address',
      type: 'address',
      required: true,
      aliases: ['address', 'street address and apt number']
    }
  ]
};

/**
 * Medical Patient Intake Form
 * Standard medical office patient information form
 */
const MEDICAL_INTAKE_TEMPLATE: FormTemplate = {
  name: 'Medical Intake',
  description: 'Patient Information Form',
  keywords: ['patient information', 'medical history', 'intake form', 'patient intake', 'registration'],
  fields: [
    {
      label: 'Patient Name',
      type: 'name',
      required: true,
      aliases: ['patient name', 'name', 'full name']
    },
    {
      label: 'Date of Birth',
      type: 'date',
      required: true,
      aliases: ['date of birth', 'dob', 'birth date']
    },
    {
      label: 'SSN',
      type: 'ssn',
      required: false,
      aliases: ['social security number', 'ssn']
    },
    {
      label: 'Address',
      type: 'address',
      required: true,
      aliases: ['address', 'home address', 'street address']
    },
    {
      label: 'Phone',
      type: 'phone',
      required: true,
      aliases: ['phone', 'telephone', 'phone number', 'home phone', 'cell phone']
    },
    {
      label: 'Email',
      type: 'email',
      required: false,
      aliases: ['email', 'e-mail', 'email address']
    },
    {
      label: 'Insurance ID',
      type: 'account',
      required: false,
      aliases: ['insurance id', 'policy number', 'member id', 'insurance number']
    },
    {
      label: 'Patient ID',
      type: 'account',
      required: false,
      aliases: ['patient id', 'patient number', 'medical record number', 'mrn']
    }
  ]
};

/**
 * Job Application Form
 * Standard employment application
 */
const JOB_APPLICATION_TEMPLATE: FormTemplate = {
  name: 'Job Application',
  description: 'Employment Application',
  keywords: ['employment application', 'job application', 'application for employment', 'apply'],
  fields: [
    {
      label: 'Applicant Name',
      type: 'name',
      required: true,
      aliases: ['name', 'applicant name', 'your name', 'full name']
    },
    {
      label: 'Address',
      type: 'address',
      required: true,
      aliases: ['address', 'street address', 'home address', 'current address']
    },
    {
      label: 'Phone',
      type: 'phone',
      required: true,
      aliases: ['phone', 'telephone', 'phone number', 'contact number']
    },
    {
      label: 'Email',
      type: 'email',
      required: true,
      aliases: ['email', 'e-mail', 'email address']
    },
    {
      label: 'SSN',
      type: 'ssn',
      required: false,
      aliases: ['social security number', 'ssn']
    },
    {
      label: 'Date of Birth',
      type: 'date',
      required: false,
      aliases: ['date of birth', 'dob', 'birth date']
    }
  ]
};

/**
 * Bank Account Application
 * New bank account opening form
 */
const BANK_ACCOUNT_TEMPLATE: FormTemplate = {
  name: 'Bank Account Application',
  description: 'New Account Application',
  keywords: ['account application', 'new account', 'open account', 'banking application'],
  fields: [
    {
      label: 'Full Name',
      type: 'name',
      required: true,
      aliases: ['name', 'full name', 'legal name', 'account holder name']
    },
    {
      label: 'SSN',
      type: 'ssn',
      required: true,
      aliases: ['social security number', 'ssn', 'taxpayer id']
    },
    {
      label: 'Date of Birth',
      type: 'date',
      required: true,
      aliases: ['date of birth', 'dob', 'birth date']
    },
    {
      label: 'Address',
      type: 'address',
      required: true,
      aliases: ['address', 'residential address', 'home address', 'street address']
    },
    {
      label: 'Phone',
      type: 'phone',
      required: true,
      aliases: ['phone', 'telephone', 'phone number', 'contact number']
    },
    {
      label: 'Email',
      type: 'email',
      required: true,
      aliases: ['email', 'e-mail', 'email address']
    }
  ]
};

/**
 * All available form templates
 */
export const FORM_TEMPLATES: FormTemplate[] = [
  W2_TEMPLATE,
  I9_TEMPLATE,
  MEDICAL_INTAKE_TEMPLATE,
  JOB_APPLICATION_TEMPLATE,
  BANK_ACCOUNT_TEMPLATE
];

/**
 * Detect form type from text content
 * Searches for form-specific keywords
 *
 * @param text - Full text from OCR
 * @returns Detected form template or null
 */
export function detectFormType(text: string): FormTemplate | null {
  const lowerText = text.toLowerCase();

  for (const template of FORM_TEMPLATES) {
    // Check if any keywords match
    const matchCount = template.keywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    ).length;

    // Require at least one keyword match
    if (matchCount > 0) {
      return template;
    }
  }

  return null;
}

/**
 * Get expected fields for a detected form type
 * Useful for boosting confidence when fields match template
 *
 * @param formType - Detected form template
 * @returns Array of expected field types
 */
export function getExpectedFields(formType: FormTemplate): FormTemplateField[] {
  return formType.fields;
}

/**
 * Check if a field label matches a template field
 * Uses aliases for fuzzy matching
 *
 * @param labelText - Detected label text
 * @param templateField - Template field definition
 * @returns true if label matches template field
 */
export function matchesTemplateField(labelText: string, templateField: FormTemplateField): boolean {
  const lowerLabel = labelText.toLowerCase().trim();

  // Check main label
  if (lowerLabel.includes(templateField.label.toLowerCase())) {
    return true;
  }

  // Check aliases
  return templateField.aliases.some(alias =>
    lowerLabel.includes(alias.toLowerCase())
  );
}

/**
 * Enhance field detection with template matching
 * Boosts confidence for fields that match expected template fields
 *
 * @param detectedFields - Fields detected by generic algorithm
 * @param formTemplate - Detected form template
 * @returns Enhanced fields with boosted confidence
 */
export function enhanceWithTemplate(
  detectedFields: Array<{ label: string; value: string; type: string; confidence: number }>,
  formTemplate: FormTemplate
): Array<{ label: string; value: string; type: string; confidence: number; fromTemplate: boolean }> {
  return detectedFields.map(field => {
    // Check if field matches any template field
    for (const templateField of formTemplate.fields) {
      if (matchesTemplateField(field.label, templateField)) {
        return {
          ...field,
          type: templateField.type,  // Override type with template type
          confidence: Math.min(1.0, field.confidence + 0.2),  // Boost confidence by 20%
          fromTemplate: true
        };
      }
    }

    return { ...field, fromTemplate: false };
  });
}

/**
 * Find missing required fields from template
 * Helps identify fields that should be present but weren't detected
 *
 * @param detectedFields - Fields detected by algorithm
 * @param formTemplate - Detected form template
 * @returns Array of missing required field labels
 */
export function findMissingRequiredFields(
  detectedFields: Array<{ label: string }>,
  formTemplate: FormTemplate
): string[] {
  const missing: string[] = [];

  for (const templateField of formTemplate.fields) {
    if (!templateField.required) continue;

    // Check if any detected field matches this template field
    const found = detectedFields.some(field =>
      matchesTemplateField(field.label, templateField)
    );

    if (!found) {
      missing.push(templateField.label);
    }
  }

  return missing;
}
