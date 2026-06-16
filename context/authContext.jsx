"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/me");

        if (!res.ok) {
          setUser(null);
          setError("User not logged in");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        setUser(null);
        setError("Something went wrong while loading user");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function login(userData) {
    setUser(userData);
    setError(null);
  }

  function logout() {
    setUser(null);
    setError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}