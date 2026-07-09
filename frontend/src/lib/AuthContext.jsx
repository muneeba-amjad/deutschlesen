'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load — restore session from localStorage
  useEffect(() => {
    const token    = localStorage.getItem('dl_token')
    const userData = localStorage.getItem('dl_user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password })
    localStorage.setItem('dl_token', data.token)
    localStorage.setItem('dl_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const data = await api.auth.register({ name, email, password })
    localStorage.setItem('dl_token', data.token)
    localStorage.setItem('dl_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('dl_token')
    localStorage.removeItem('dl_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
