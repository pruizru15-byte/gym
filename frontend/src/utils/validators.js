/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (Mexican format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Mexican phone numbers are 10 digits
  return cleaned.length === 10
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if meets minimum length
 */
export const minLength = (value, minLength) => {
  if (!value) return false
  return value.length >= minLength
}

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if within maximum length
 */
export const maxLength = (value, maxLength) => {
  if (!value) return true
  return value.length <= maxLength
}

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
export const isInRange = (value, min, max) => {
  const num = parseFloat(value)
  if (isNaN(num)) return false
  return num >= min && num <= max
}

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @returns {boolean} True if positive
 */
export const isPositive = (value) => {
  const num = parseFloat(value)
  if (isNaN(num)) return false
  return num > 0
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid date
 */
export const isValidDate = (date) => {
  if (!date) return false
  
  const dateObj = new Date(date)
  return !isNaN(dateObj.getTime())
}

/**
 * Validate date is in the future
 * @param {string} date - Date string to validate
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false
  
  const dateObj = new Date(date)
  const now = new Date()
  
  return dateObj > now
}

/**
 * Validate date is in the past
 * @param {string} date - Date string to validate
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false
  
  const dateObj = new Date(date)
  const now = new Date()
  
  return dateObj < now
}

/**
 * Comprehensive form validator
 * @param {object} values - Form values to validate
 * @param {object} rules - Validation rules
 * @returns {object} Object with errors
 */
export const validateForm = (values, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const value = values[field]
    const fieldRules = rules[field]
    
    // Required validation
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = fieldRules.requiredMessage || 'Este campo es requerido'
      return
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !fieldRules.required) return
    
    // Email validation
    if (fieldRules.email && !isValidEmail(value)) {
      errors[field] = fieldRules.emailMessage || 'Email inválido'
      return
    }
    
    // Phone validation
    if (fieldRules.phone && !isValidPhone(value)) {
      errors[field] = fieldRules.phoneMessage || 'Teléfono inválido (10 dígitos)'
      return
    }
    
    // Min length validation
    if (fieldRules.minLength && !minLength(value, fieldRules.minLength)) {
      errors[field] = fieldRules.minLengthMessage || `Mínimo ${fieldRules.minLength} caracteres`
      return
    }
    
    // Max length validation
    if (fieldRules.maxLength && !maxLength(value, fieldRules.maxLength)) {
      errors[field] = fieldRules.maxLengthMessage || `Máximo ${fieldRules.maxLength} caracteres`
      return
    }
    
    // Positive number validation
    if (fieldRules.positive && !isPositive(value)) {
      errors[field] = fieldRules.positiveMessage || 'Debe ser un número positivo'
      return
    }
    
    // Custom validation function
    if (fieldRules.custom && !fieldRules.custom(value, values)) {
      errors[field] = fieldRules.customMessage || 'Valor inválido'
      return
    }
  })
  
  return errors
}
