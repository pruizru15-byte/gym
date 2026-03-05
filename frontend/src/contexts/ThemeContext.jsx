import { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

const getStoredTheme = () => {
    try {
        const stored = localStorage.getItem('gym-theme')
        if (stored === 'dark' || stored === 'light') return stored
    } catch { /* ignore */ }
    return 'light'
}

const applyTheme = (theme) => {
    const root = document.documentElement
    if (theme === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
}

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(getStoredTheme)

    // useLayoutEffect fires synchronously before paint — no flash
    useLayoutEffect(() => {
        applyTheme(theme)
        try {
            localStorage.setItem('gym-theme', theme)
        } catch { /* ignore */ }
    }, [theme])

    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export default ThemeContext
