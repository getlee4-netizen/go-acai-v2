'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share2, Plus } from 'lucide-react'

export default function InstallPrompt() {
  const pathname = usePathname()
  const deferredRef = useRef<any>(null)
  const [show, setShow] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [appName, setAppName] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    setShow(false)
    const match = pathname.match(/^\/app\/([^/]+)/)
    if (!match) return
    const slug = match[1]
    fetch(`/app/${slug}/manifest`).then(r => r.json()).then(m => {
      setAppName(m.name || slug)
    }).catch(() => {
      setAppName(slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    })
  }, [pathname])

  useEffect(() => {
    const match = pathname.match(/^\/app\/([^/]+)/)
    if (!match) return

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    if (localStorage.getItem('goacai_install_dismissed')) {
      setIsDismissed(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)

    if ((window as any).__deferredPrompt) {
      deferredRef.current = (window as any).__deferredPrompt
      setTimeout(() => setShow(true), 2000)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e
      ;(window as any).__deferredPrompt = e
      if (!show) {
        setTimeout(() => setShow(true), 2000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    const timeout = setTimeout(() => {
      setShow(true)
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timeout)
    }
  }, [pathname])

  const handleInstall = async () => {
    const prompt = deferredRef.current || (window as any).__deferredPrompt
    if (prompt) {
      prompt.prompt()
      const result = await prompt.userChoice
      if (result.outcome === 'accepted') {
        setShow(false)
        setIsInstalled(true)
      }
      deferredRef.current = null
      ;(window as any).__deferredPrompt = null
    } else {
      setToast('Use o menu do Chrome > "Instalar aplicativo"')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('goacai_install_dismissed', '1')
    setIsDismissed(true)
  }

  if (!show || isInstalled || isDismissed) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={handleDismiss}
      >
        <div
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-5"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-acai-500 flex items-center justify-center mx-auto shadow-lg">
            <Download className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-dark-900">Instalar {appName}</h2>
            <p className="text-dark-500 text-sm mt-1">
              {isIos
                ? `Instale o app ${appName} na tela de início do seu iPhone para receber notificações e pedir mais rápido!`
                : `Instale o app ${appName} no seu celular para receber notificações em tempo real e acessar com 1 clique!`}
            </p>
          </div>
          {isIos ? (
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50">
                <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center text-sm font-bold text-dark-600">1</div>
                <p className="text-sm text-dark-700">Toque em <Share2 className="w-4 h-4 inline text-primary-500" /> Compartilhar</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50">
                <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center text-sm font-bold text-dark-600">2</div>
                <p className="text-sm text-dark-700">Role e toque em <Plus className="w-4 h-4 inline text-primary-500" /> Adicionar à Tela de Início</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full py-3.5 rounded-2xl text-white font-bold transition-all bg-gradient-to-r from-primary-600 to-acai-500 hover:from-primary-700 hover:to-acai-600 shadow-lg"
            >
              <Download className="w-5 h-5 inline mr-2" />Instalar Agora
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl border-2 border-dark-200 text-dark-600 font-semibold hover:bg-dark-50 transition-all text-sm"
          >
            Agora não
          </button>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-dark-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-semibold text-center">
            {toast}
          </div>
        </div>
      )}
    </>
  )
}
