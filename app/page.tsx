'use client'

import { AppProvider, useApp } from '@/lib/store'
import LockScreen from '@/app/components/LockScreen'
import AppScreen from '@/app/components/AppScreen'
import TimeLockOverlay from '@/app/components/TimeLockOverlay'
import Toast from '@/app/components/Toast'

function AppShell() {
  const { state } = useApp()

  return (
    <>
      {state.currentScreen === 'lock' && <LockScreen />}
      {state.currentScreen === 'app' && state.isUnlocked && <AppScreen />}
      <TimeLockOverlay />
      <Toast />
    </>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
