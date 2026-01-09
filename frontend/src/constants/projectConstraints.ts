/**
 * Project Field Constraints
 * These limits match the backend MongoDB schema validation rules
 * Update here when backend schema changes
 */

export const PROJECT_CONSTRAINTS = {
  title: {
    required: true,
    maxLength: 255,
    label: 'Project Title',
    helperText: 'Required. Max 255 characters'
  },
  subtitle: {
    required: true,
    maxLength: 500,
    label: 'Subtitle/Tagline',
    helperText: 'Required. Max 500 characters'
  },
  description: {
    required: true,
    maxLength: 500,
    label: 'Short Description',
    helperText: 'Required. Max 500 characters. This appears in project lists.'
  },
  detailedDescription: {
    required: true,
    maxLength: 5000,
    label: 'Detailed Description',
    helperText: 'Required. Max 5000 characters. Full project details.'
  },
  category: {
    required: true,
    label: 'Category',
    helperText: 'Required. Select from available categories'
  },
  image: {
    required: false,
    label: 'Project Image URL',
    helperText: 'Optional. Full URL to project image'
  },
  technologies: {
    required: false,
    maxItems: 20,
    label: 'Technologies',
    helperText: 'Optional. Up to 20 technologies'
  },
  tags: {
    required: false,
    maxItems: 15,
    label: 'Tags',
    helperText: 'Optional. Up to 15 tags for discovery'
  },
  featured: {
    required: false,
    label: 'Featured Project',
    helperText: 'Check to display on homepage'
  },
  githubUrl: {
    required: false,
    label: 'GitHub Repository URL',
    helperText: 'Optional. Link to source code'
  },
  demoUrl: {
    required: false,
    label: 'Live Demo URL',
    helperText: 'Optional. Link to live demo'
  }
};

/**
 * Get validation error message for a field
 */
export function getValidationError(field: string, constraint: string, value?: any): string {
  const fieldName = (PROJECT_CONSTRAINTS as any)[field]?.label || field;
  
  switch (constraint) {
    case 'maxLength':
      const maxLen = (PROJECT_CONSTRAINTS as any)[field]?.maxLength;
      const currentLen = value ? String(value).length : 0;
      return `${fieldName} is too long. Maximum ${maxLen} characters allowed. Current: ${currentLen}`;
    case 'minLength':
      return `${fieldName} is too short. Minimum length required.`;
    case 'required':
      return `${fieldName} is required`;
    case 'enum':
      return `${fieldName} has an invalid value`;
    default:
      return `${fieldName} is invalid`;
  }
}

/**
 * Validate a field against constraints
 */
export function validateField(field: string, value: any): string | null {
  const constraint = (PROJECT_CONSTRAINTS as any)[field];
  if (!constraint) return null;

  // Check required
  if (constraint.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return getValidationError(field, 'required');
  }

  // Check maxLength for strings
  if (constraint.maxLength && typeof value === 'string' && value.length > constraint.maxLength) {
    return getValidationError(field, 'maxLength', value);
  }

  // Check maxItems for arrays
  if (constraint.maxItems && Array.isArray(value) && value.length > constraint.maxItems) {
    return `Too many items. Maximum ${constraint.maxItems} allowed. Current: ${value.length}`;
  }

  return null;
}
