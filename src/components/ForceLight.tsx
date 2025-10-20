// src/components/ForceLight.tsx
'use client';
import { useEffect } from 'react';

export function ForceLight() {
  useEffect(() => {
    // remove qualquer 'dark' no <html> e força esquema claro
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    // trava o fundo claro (até contra extensões mais agressivas)
    document.body.style.setProperty('background-color', '#ffffff', 'important');
    document.body.style.setProperty('color', '#171717', 'important');
  }, []);
  return null;
}
