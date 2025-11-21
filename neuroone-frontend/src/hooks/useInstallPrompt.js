import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar o prompt de instalação do PWA
 *
 * @returns {Object} - Objeto com estado e funções para controle do prompt
 * @property {boolean} isInstallable - Se o PWA pode ser instalado
 * @property {boolean} isInstalled - Se o PWA já está instalado
 * @property {Function} promptInstall - Função para mostrar o prompt de instalação
 * @property {Function} dismissPrompt - Função para dispensar o prompt
 * @property {string|null} installResult - Resultado da tentativa de instalação ('accepted' ou 'dismissed')
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installResult, setInstallResult] = useState(null);

  useEffect(() => {
    // Verifica se já está instalado
    const checkIfInstalled = () => {
      // PWA standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      // iOS standalone mode
      const isIOSStandalone = window.navigator.standalone === true;

      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (event) => {
      console.log('[PWA] beforeinstallprompt event fired');

      // Previne o mini-infobar do Chrome 67+ em mobile
      event.preventDefault();

      // Salva o evento para uso posterior
      setDeferredPrompt(event);
      setIsInstallable(true);

      console.log('[PWA] App is installable');
    };

    // Captura o evento appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed successfully');

      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);

      // Dispara evento customizado para analytics ou notificações
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    };

    // Adiciona listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Mostra o prompt de instalação do PWA
   * @returns {Promise<'accepted'|'dismissed'>} - Resultado da interação do usuário
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No deferred prompt available');
      return 'dismissed';
    }

    // Mostra o prompt
    deferredPrompt.prompt();

    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[PWA] User ${outcome} the install prompt`);

    setInstallResult(outcome);

    // Limpa o prompt após uso
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome;
  }, [deferredPrompt]);

  /**
   * Dispensa o prompt sem instalar (para uso em "Não agora", etc)
   */
  const dismissPrompt = useCallback(() => {
    console.log('[PWA] Install prompt dismissed by user');

    setDeferredPrompt(null);
    setIsInstallable(false);
    setInstallResult('dismissed');

    // Salva a DATA (não timestamp) quando dispensado - reseta à meia-noite
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    localStorage.setItem('pwa-install-dismissed-date', today);
    console.log(`[PWA] Dismissed on ${today} - will show again tomorrow`);
  }, []);

  /**
   * Verifica se o prompt foi dispensado hoje (reseta à meia-noite)
   * @returns {boolean} - true se foi dispensado no mesmo dia
   */
  const wasDismissedToday = useCallback(() => {
    const dismissedDate = localStorage.getItem('pwa-install-dismissed-date');

    if (!dismissedDate) return false;

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    return dismissedDate === today;
  }, []);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
    installResult,
    wasDismissedToday,
  };
}
