/**
 * PIIRedactionService: Utilities for detecting and redacting PII (personally identifiable information)
 * Provides methods for safe storage and transmission of user data
 */

// Common PII patterns (email, phone, SSN, credit card, IP address, etc.)
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  ssn: /\b(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\b/g,
  creditCard: /\b(?:\d[ -]*?){13,19}\b/g,
  ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  apiKey: /(?:api[_-]?key|apikey|token|secret|password)\s*[:=]\s*['\"]?([A-Za-z0-9\-_.]+)['\"]?/gi,
  homeAddress: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Parkway|Pkwy|Plaza|Pl)\b/g,
  zipCode: /\b[0-9]{5}(?:-[0-9]{4})?\b/g,
  socialMediaHandle: /@[A-Za-z0-9_]+/g,
  phoneticName: /\b(?:my name is|i'm|i am|call me|you can call me)\s+([A-Z][A-Za-z\-\']+)\b/gi
};

// Redaction tokens by severity
const REDACTION_TOKENS = {
  email: '[EMAIL_REDACTED]',
  phone: '[PHONE_REDACTED]',
  ssn: '[SSN_REDACTED]',
  creditCard: '[CARD_REDACTED]',
  ipAddress: '[IP_REDACTED]',
  apiKey: '[SECRET_REDACTED]',
  homeAddress: '[ADDRESS_REDACTED]',
  zipCode: '[ZIP_REDACTED]',
  socialMediaHandle: '[HANDLE_REDACTED]',
  name: '[NAME_REDACTED]'
};

/**
 * Detect PII in text and return matches with locations
 */
function detectPII(text) {
  if (!text || typeof text !== 'string') return [];

  const detections = [];
  const textLower = text.toLowerCase();

  // Email detection
  const emailMatches = [...text.matchAll(PII_PATTERNS.email)];
  emailMatches.forEach((match) => {
    detections.push({
      type: 'email',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      severity: 'high'
    });
  });

  // Phone detection
  const phoneMatches = [...text.matchAll(PII_PATTERNS.phone)];
  phoneMatches.forEach((match) => {
    detections.push({
      type: 'phone',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      severity: 'high'
    });
  });

  // SSN detection
  const ssnMatches = [...text.matchAll(PII_PATTERNS.ssn)];
  ssnMatches.forEach((match) => {
    detections.push({
      type: 'ssn',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      severity: 'critical'
    });
  });

  // Credit card detection
  const ccMatches = [...text.matchAll(PII_PATTERNS.creditCard)];
  ccMatches.forEach((match) => {
    detections.push({
      type: 'creditCard',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      severity: 'critical'
    });
  });

  // IP address detection
  const ipMatches = [...text.matchAll(PII_PATTERNS.ipAddress)];
  ipMatches.forEach((match) => {
    detections.push({
      type: 'ipAddress',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      severity: 'medium'
    });
  });

  // API/Secret key detection
  const apiMatches = [...text.matchAll(PII_PATTERNS.apiKey)];
  apiMatches.forEach((match) => {
    detections.push({
      type: 'apiKey',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      severity: 'critical'
    });
  });

  return detections;
}

/**
 * Redact PII from text
 * Replaces PII with redaction tokens
 */
function redactPII(text, redactionLevel = 'high') {
  if (!text || typeof text !== 'string') return text;

  let redacted = text;

  // Redact based on severity level
  const severityMap = {
    'low': ['email', 'phone'],
    'medium': ['email', 'phone', 'ipAddress', 'socialMediaHandle'],
    'high': ['email', 'phone', 'ipAddress', 'socialMediaHandle', 'homeAddress', 'zipCode', 'apiKey'],
    'critical': ['email', 'phone', 'ssn', 'creditCard', 'ipAddress', 'apiKey', 'homeAddress']
  };

  const typesToRedact = severityMap[redactionLevel] || severityMap['high'];

  // Remove API keys/secrets first
  if (typesToRedact.includes('apiKey')) {
    redacted = redacted.replace(PII_PATTERNS.apiKey, '[SECRET_REDACTED]');
  }

  // Remove emails
  if (typesToRedact.includes('email')) {
    redacted = redacted.replace(PII_PATTERNS.email, REDACTION_TOKENS.email);
  }

  // Remove phone numbers
  if (typesToRedact.includes('phone')) {
    redacted = redacted.replace(PII_PATTERNS.phone, REDACTION_TOKENS.phone);
  }

  // Remove SSNs (critical)
  if (typesToRedact.includes('ssn')) {
    redacted = redacted.replace(PII_PATTERNS.ssn, REDACTION_TOKENS.ssn);
  }

  // Remove credit cards (critical)
  if (typesToRedact.includes('creditCard')) {
    redacted = redacted.replace(PII_PATTERNS.creditCard, REDACTION_TOKENS.creditCard);
  }

  // Remove IP addresses
  if (typesToRedact.includes('ipAddress')) {
    redacted = redacted.replace(PII_PATTERNS.ipAddress, REDACTION_TOKENS.ipAddress);
  }

  // Remove home addresses
  if (typesToRedact.includes('homeAddress')) {
    redacted = redacted.replace(PII_PATTERNS.homeAddress, REDACTION_TOKENS.homeAddress);
  }

  // Remove zip codes
  if (typesToRedact.includes('zipCode')) {
    redacted = redacted.replace(PII_PATTERNS.zipCode, REDACTION_TOKENS.zipCode);
  }

  // Remove social media handles
  if (typesToRedact.includes('socialMediaHandle')) {
    redacted = redacted.replace(PII_PATTERNS.socialMediaHandle, REDACTION_TOKENS.socialMediaHandle);
  }

  return redacted;
}

/**
 * Extract and validate names from text
 * Returns high-confidence name extractions
 */
function extractNames(text) {
  if (!text || typeof text !== 'string') return [];

  const names = [];

  // Pattern 1: "My name is [Name]"
  const nameIsPattern = text.match(/(?:my name is|i am|i'm)\s+([A-Z][A-Za-z\-\']+(?:\s+[A-Z][A-Za-z\-\']+)*)/gi);
  if (nameIsPattern) {
    nameIsPattern.forEach((match) => {
      const name = match.replace(/(?:my name is|i am|i'm)\s+/i, '').trim();
      if (name && name.length < 100) {
        names.push({
          value: name,
          pattern: 'direct_statement',
          confidence: 0.95
        });
      }
    });
  }

  // Pattern 2: "Call me [Name]"
  const callMePattern = text.match(/(?:call me|you can call me)\s+([A-Z][A-Za-z\-\']+)\b/gi);
  if (callMePattern) {
    callMePattern.forEach((match) => {
      const name = match.replace(/(?:call me|you can call me)\s+/i, '').trim();
      if (name && name.length < 100) {
        names.push({
          value: name,
          pattern: 'nickname',
          confidence: 0.85
        });
      }
    });
  }

  // Pattern 3: Salutation in introduction
  const introPattern = text.match(/(?:hi|hello|hey),?\s+([A-Z][A-Za-z\-\']+)\b/i);
  if (introPattern) {
    const name = introPattern[1].trim();
    if (name && name.length < 100) {
      names.push({
        value: name,
        pattern: 'salutation',
        confidence: 0.7
      });
    }
  }

  // Remove duplicates, keeping highest confidence
  const uniqueNames = new Map();
  names.forEach((n) => {
    const key = n.value.toLowerCase();
    if (!uniqueNames.has(key) || uniqueNames.get(key).confidence < n.confidence) {
      uniqueNames.set(key, n);
    }
  });

  return Array.from(uniqueNames.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check if PII is present in text
 */
function hasPII(text) {
  return detectPII(text).length > 0;
}

/**
 * Get a summary of PII detections
 */
function getPIISummary(text) {
  const detections = detectPII(text);
  const summary = {
    hasPII: detections.length > 0,
    totalDetections: detections.length,
    byType: {},
    critical: [],
    high: [],
    medium: []
  };

  detections.forEach((d) => {
    summary.byType[d.type] = (summary.byType[d.type] || 0) + 1;

    if (d.severity === 'critical') {
      summary.critical.push(d.type);
    } else if (d.severity === 'high') {
      summary.high.push(d.type);
    } else if (d.severity === 'medium') {
      summary.medium.push(d.type);
    }
  });

  summary.critical = [...new Set(summary.critical)];
  summary.high = [...new Set(summary.high)];
  summary.medium = [...new Set(summary.medium)];

  return summary;
}

/**
 * Validate name against confidence threshold
 */
function isValidName(name, minLength = 2, maxLength = 100) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength && /^[A-Za-z\s\-\']+$/.test(trimmed);
}

/**
 * Sanitize name for storage (remove extra spaces, normalize case)
 */
function sanitizeName(name) {
  if (!isValidName(name)) return null;
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Export for CommonJS
module.exports = {
  detectPII,
  redactPII,
  extractNames,
  hasPII,
  getPIISummary,
  isValidName,
  sanitizeName
};
