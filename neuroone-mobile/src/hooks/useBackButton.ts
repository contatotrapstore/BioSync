import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook para gerenciar o back button do Android
 *
 * @param handler - Callback customizado (retorne false para bloquear)
 * @param priority - Prioridade do handler (10 = alta, 1 = baixa)
 * @param enabled - Se o handler está ativado
 *
 * @example
 * // Handler simples
 * useBackButton(() => navigate(-1));
 *
 * @example
 * // Handler com confirmação
 * useBackButton(() => {
 *   if (confirm('Deseja sair?')) {
 *     navigate('/');
 *   }
 *   return false; // Bloqueia comportamento padrão
 * });
 *
 * @example
 * // Handler de alta prioridade (jogo)
 * useBackButton(handleExit, 10);
 */

export interface UseBackButtonOptions {
  /** Callback customizado ao pressionar back */
  onBack?: () => void | boolean;
  /** Prioridade (10 = alta, 1 = baixa) */
  priority?: number;
  /** Se deve confirmar antes de sair do app */
  confirmExit?: boolean;
  /** Se o handler está habilitado */
  enabled?: boolean;
}

export const useBackButton = (
  options: UseBackButtonOptions | (() => void | boolean) = {}
) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Permitir passar apenas a função como primeiro parâmetro
  const opts: UseBackButtonOptions = typeof options === 'function'
    ? { onBack: options }
    : options;

  const {
    onBack,
    priority = 1,
    confirmExit = false,
    enabled = true
  } = opts;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let listener: PluginListenerHandle | null = null;

    const setupListener = async () => {
      listener = await CapacitorApp.addListener('backButton', (event) => {
        console.log('[useBackButton] Back button pressed', {
          priority,
          canGoBack: event.canGoBack,
          path: location.pathname
        });

        // 1. Executar handler customizado se existir
        if (onBack) {
          const result = onBack();

          // Se retornou false, bloqueia comportamento padrão
          if (result === false) {
            console.log('[useBackButton] Handler blocked default behavior');
            return;
          }
        }

        // 2. Comportamento padrão baseado na prioridade
        if (priority >= 10) {
          // Alta prioridade - não faz nada (handler customizado deve lidar)
          console.log('[useBackButton] High priority handler - skipping default');
          return;
        }

        // 3. Comportamento padrão para prioridade normal
        const isRootRoute = location.pathname === '/' ||
                           location.pathname === '/library' ||
                           location.pathname === '/login';

        if (isRootRoute) {
          // Tela principal - confirmar saída se configurado
          if (confirmExit) {
            const shouldExit = window.confirm('Deseja sair do NeuroOne?');

            if (shouldExit) {
              CapacitorApp.exitApp();
            }
          } else {
            // Sair direto
            CapacitorApp.exitApp();
          }
        } else {
          // Tela interna - navegar para trás
          if (event.canGoBack) {
            console.log('[useBackButton] Navigating back');
            navigate(-1);
          } else {
            // Não pode voltar - ir para root
            console.log('[useBackButton] Cannot go back, going to library');
            navigate('/library');
          }
        }
      });

      console.log('[useBackButton] Listener registered', { priority, path: location.pathname });
    };

    setupListener();

    // Cleanup
    return () => {
      if (listener) {
        listener.remove();
        console.log('[useBackButton] Listener removed', { priority, path: location.pathname });
      }
    };
  }, [onBack, navigate, location.pathname, priority, confirmExit, enabled]);
};

/**
 * Hook simplificado para confirmação de saída
 * Usa apenas na página principal (biblioteca)
 */
export const useExitConfirmation = () => {
  const location = useLocation();
  const isLibrary = location.pathname === '/library';

  useBackButton({
    confirmExit: isLibrary,
    enabled: isLibrary
  });
};
