import { createContext, useState, useEffect, useContext } from 'react'
import { configuracionAPI } from '../services/api'
import { setCurrency as setGlobalCurrency, getCurrencySymbol } from '../utils/currencyConfig'

const CurrencyContext = createContext(null)

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrencyState] = useState('MXN')
    const [currencySymbol, setCurrencySymbol] = useState('$')
    const [loaded, setLoaded] = useState(false)

    // Load currency from backend on mount
    useEffect(() => {
        const loadCurrency = async () => {
            try {
                const res = await configuracionAPI.getAll()
                const cfg = res.data
                const moneda = cfg.moneda?.valor || 'MXN'
                setGlobalCurrency(moneda)
                setCurrencyState(moneda)
                setCurrencySymbol(getCurrencySymbol())
            } catch (error) {
                console.error('Error loading currency config:', error)
            } finally {
                setLoaded(true)
            }
        }
        loadCurrency()
    }, [])

    /**
     * Update currency system-wide (called from AppearanceSettings on save)
     */
    const updateCurrency = (code) => {
        setGlobalCurrency(code)
        setCurrencyState(code)
        setCurrencySymbol(getCurrencySymbol())
    }

    const value = {
        currency,
        currencySymbol,
        loaded,
        updateCurrency,
    }

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export const useCurrency = () => {
    const context = useContext(CurrencyContext)
    if (!context) {
        // Fallback for components rendered outside the provider
        return { currency: 'MXN', currencySymbol: '$', loaded: false, updateCurrency: () => { } }
    }
    return context
}

export default CurrencyContext
