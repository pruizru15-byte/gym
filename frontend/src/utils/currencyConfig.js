/**
 * Currency Configuration Module (Singleton)
 * 
 * Manages the system-wide currency setting.
 * This module is imported by formatters, PDF generators, and components
 * to get the current currency code, symbol, and locale.
 */

// Currency → locale mapping
const CURRENCY_LOCALES = {
    MXN: 'es-MX',
    USD: 'en-US',
    EUR: 'de-DE',
    COP: 'es-CO',
    ARS: 'es-AR',
    CLP: 'es-CL',
    PEN: 'es-PE',
}

// Currency → symbol mapping
const CURRENCY_SYMBOLS = {
    MXN: '$',
    USD: '$',
    EUR: '€',
    COP: '$',
    ARS: '$',
    CLP: '$',
    PEN: 'S/',
}

// Module-level state
let currentCurrency = 'MXN'

/**
 * Set the system currency code
 * @param {string} code - ISO currency code (e.g. 'MXN', 'USD', 'EUR')
 */
export const setCurrency = (code) => {
    if (code && CURRENCY_LOCALES[code]) {
        currentCurrency = code
    }
}

/**
 * Get the current currency code
 * @returns {string} ISO currency code
 */
export const getCurrency = () => currentCurrency

/**
 * Get the locale string for the current currency
 * @returns {string} Locale string (e.g. 'es-MX')
 */
export const getCurrencyLocale = () => CURRENCY_LOCALES[currentCurrency] || 'es-MX'

/**
 * Get the symbol for the current currency
 * @returns {string} Currency symbol (e.g. '$', '€', 'S/')
 */
export const getCurrencySymbol = () => CURRENCY_SYMBOLS[currentCurrency] || '$'
