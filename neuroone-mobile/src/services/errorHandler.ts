/**
 * Centralized Error Handler
 *
 * Fornece tratamento unificado de erros em toda a aplicação:
 * - Mapeamento de erros para mensagens amigáveis
 * - Log centralizado
 * - Retry automático para erros de rede
 * - Integração futura com Sentry
 */

import type { AxiosError } from 'axios';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, any>;
}

export interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  type: string;
  context: ErrorContext;
  http?: {
    status: number;
    statusText: string;
    url?: string;
    method?: string;
  };
}

class ErrorHandler {
  private errorLog: ErrorLog[] = [];
  private readonly MAX_LOG_SIZE = 100;
  private readonly sentryEnabled = false; // Futuro: integração com Sentry

  constructor() {
    this.init();
  }

  /**
   * Inicializar error handler global
   */
  private init() {
    if (typeof window !== 'undefined') {
      // Capturar erros globais não tratados
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          component: 'Window',
          action: 'global-error'
        });
      });

      // Capturar promises rejeitadas não tratadas
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, {
          component: 'Window',
          action: 'unhandled-rejection'
        });
      });

      console.log('[ErrorHandler] Initialized');
    }
  }

  /**
   * Tratar erro com contexto
   */
  handleError(error: any, context: ErrorContext = {}): ErrorLog {
    const errorData = this.parseError(error, context);

    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('[ErrorHandler]', errorData);
    }

    // Salvar em log local
    this.errorLog.push(errorData);
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.shift();
    }

    // TODO: Enviar para Sentry em produção
    if (this.sentryEnabled && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: { component: context.component },
        extra: context.extra
      });
    }

    return errorData;
  }

  /**
   * Parsear erro para formato padronizado
   */
  private parseError(error: any, context: ErrorContext): ErrorLog {
    const errorData: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: error?.message || String(error),
      stack: error?.stack || null,
      type: error?.name || 'Error',
      context: {
        component: context.component || 'unknown',
        action: context.action || 'unknown',
        userId: context.userId || undefined,
        ...context.extra
      }
    };

    // Parse Axios errors
    if (this.isAxiosError(error)) {
      errorData.http = {
        status: error.response?.status || 0,
        statusText: error.response?.statusText || '',
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      };
    }

    return errorData;
  }

  /**
   * Verificar se é erro do Axios
   */
  private isAxiosError(error: any): error is AxiosError {
    return error?.isAxiosError === true;
  }

  /**
   * Obter mensagem amigável para o usuário
   */
  getUserMessage(error: any): string {
    // Mapeamento de erros conhecidos
    const errorMessages: Record<string, string> = {
      'Network Error': 'Sem conexão com a internet. Verifique sua rede.',
      'ERR_NETWORK': 'Erro de conexão. Verifique sua internet.',
      'ERR_INTERNET_DISCONNECTED': 'Sem conexão com a internet.',
      'Failed to fetch': 'Falha ao buscar dados. Verifique sua conexão.',
      'ECONNREFUSED': 'Não foi possível conectar ao servidor.',
      'ETIMEDOUT': 'Tempo de conexão esgotado.',
      'timeout of': 'Tempo limite excedido. Tente novamente.',
      'Download timeout': 'Download demorou demais. Tente novamente.',
      'Checksum inválido': 'Arquivo corrompido. O download será refeito.',
      'Download pausado': 'Download pausado.',
      'Download cancelado': 'Download cancelado.',
      'Jogo já está instalado': 'Este jogo já está instalado.'
    };

    const message = error?.message || String(error);

    // Buscar por padrões conhecidos
    for (const [pattern, userMsg] of Object.entries(errorMessages)) {
      if (message.includes(pattern)) {
        return userMsg;
      }
    }

    // Erros HTTP
    if (this.isAxiosError(error) && error.response?.status) {
      return this.getHttpErrorMessage(error.response.status);
    }

    // Mensagem genérica
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  /**
   * Obter mensagem de erro HTTP
   */
  private getHttpErrorMessage(status: number): string {
    const httpMessages: Record<number, string> = {
      400: 'Dados inválidos. Verifique e tente novamente.',
      401: 'Sessão expirada. Faça login novamente.',
      403: 'Sem permissão para esta ação.',
      404: 'Recurso não encontrado.',
      409: 'Conflito de dados. Este registro já existe.',
      422: 'Dados inválidos. Verifique os campos.',
      429: 'Muitas tentativas. Aguarde um momento.',
      500: 'Erro no servidor. Tente mais tarde.',
      502: 'Servidor indisponível.',
      503: 'Serviço temporariamente indisponível.',
      504: 'Servidor não respondeu a tempo.'
    };

    return httpMessages[status] || `Erro ${status}. Tente novamente.`;
  }

  /**
   * Verificar se erro deve ter retry automático
   */
  shouldRetry(error: any): boolean {
    // Retry apenas para erros de rede
    const retryableErrors = [
      'Network Error',
      'ERR_NETWORK',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'timeout of'
    ];

    const message = error?.message || '';

    return retryableErrors.some(pattern => message.includes(pattern));
  }

  /**
   * Retry com exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Não fazer retry se não for erro de rede
        if (!this.shouldRetry(error)) {
          throw error;
        }

        // Última tentativa - throw error
        if (attempt === maxRetries) {
          throw error;
        }

        // Calcular delay com exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`[ErrorHandler] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Obter logs de erro
   */
  getLogs(): ErrorLog[] {
    return [...this.errorLog];
  }

  /**
   * Limpar logs
   */
  clearLogs(): void {
    this.errorLog = [];
  }

  /**
   * Exportar logs como JSON
   */
  exportLogs(): void {
    const blob = new Blob([JSON.stringify(this.errorLog, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroone-errors-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;

/**
 * Hook para usar error handler em componentes React
 */
export const useErrorHandler = () => {
  return {
    handleError: (error: any, context?: ErrorContext) =>
      errorHandler.handleError(error, context),
    getUserMessage: (error: any) =>
      errorHandler.getUserMessage(error),
    shouldRetry: (error: any) =>
      errorHandler.shouldRetry(error),
    retryWithBackoff: <T,>(fn: () => Promise<T>, maxRetries?: number, initialDelay?: number) =>
      errorHandler.retryWithBackoff(fn, maxRetries, initialDelay),
    getLogs: () =>
      errorHandler.getLogs(),
    clearLogs: () =>
      errorHandler.clearLogs(),
    exportLogs: () =>
      errorHandler.exportLogs()
  };
};
