/**
 * Global TypeScript Types
 */

// ============================================================================
// USER & AUTH
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'psychologist';
  phone?: string;
  hasActiveSubscription: boolean;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  username?: string;
  isAdmin?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  hasActiveSubscription: boolean;
  subscription?: {
    id?: string;
    status?: string;
    planValue?: number;
    plan_value?: number;
    nextDueDate?: string;
    next_due_date?: string;
    paymentMethod?: string;
    payment_method?: string;
    [key: string]: any;
  } | null;
}

// ============================================================================
// GAMES
// ============================================================================

export interface Game {
  id: string;
  title: string;
  name?: string;
  description: string;
  category?: GameCategory | string;
  difficulty?: GameDifficulty | string;
  duration?: number; // em minutos
  thumbnail?: string;
  cover_image?: string; // Alias para thumbnail usado pelo backend
  cover_image_local?: string;
  folder_path?: string;
  tags: string[];
  zipUrl: string;
  download_url?: string; // URL de download do backend
  zipSize?: number; // em bytes
  file_size?: number; // Tamanho do arquivo (alias para zipSize)
  checksum?: string; // SHA256 checksum para validação
  hasAccess?: boolean;
  accessType?: string | null;
  accessExpiresAt?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  supportedPlatforms?: string[]; // Plataformas suportadas: 'pc', 'mobile', 'web'
}

export type GameCategory =
  | 'memory'
  | 'attention'
  | 'logic'
  | 'coordination'
  | 'language'
  | 'executive';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameDownloadProgress {
  gameId: string;
  progress: number; // 0-100
  status: 'downloading' | 'extracting' | 'completed' | 'error';
  error?: string;
}

export interface GameDownloadState {
  [gameId: string]: GameDownloadProgress;
}

// ============================================================================
// PAYMENTS
// ============================================================================

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: 'pix' | 'credit_card';
  planType: 'monthly' | 'annual';
  externalId?: string; // ID do Asaas
  pixQrCode?: string;
  pixCopyPaste?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'completed' // Status de sucesso
  | 'received' // Alias para completed
  | 'RECEIVED' // Uppercase version usado pelo backend
  | 'overdue'
  | 'refunded'
  | 'error' // Status de erro
  | 'FAILED'; // Status de falha do backend

export interface CreatePaymentData {
  planType: 'monthly' | 'annual';
  paymentMethod: 'pix' | 'credit_card';
  cardData?: CreditCardData;
}

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: PaymentStatus;
  pixCode?: string;
  pixQrCode?: string;
  amount: number;
  dueDate: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  paidAt?: string;
}

export interface PaymentPlan {
  type: 'monthly' | 'annual';
  name: string;
  price: number;
  description: string;
  features: string[];
}

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export interface Subscription {
  id: string;
  userId: string;
  planType: 'monthly' | 'annual';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
}

// ============================================================================
// STATISTICS (Admin)
// ============================================================================

export interface Statistics {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  gamesPlayed: number;
  averageSessionTime: number;
}

// ============================================================================
// ADMIN
// ============================================================================

export interface AdminUser extends User {
  lastLoginAt?: string;
  subscription?: Subscription;
  payments: Payment[];
}

// ============================================================================
// APP STATE
// ============================================================================

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  hasActiveSubscription: boolean;
}

// ============================================================================
// DOWNLOAD MANAGER
// ============================================================================

export interface DownloadQueueItem {
  gameId: string;
  gameTitle: string;
  zipUrl: string;
  zipSize: number;
  priority: number;
  addedAt: Date;
}

export interface DownloadManagerState {
  queue: DownloadQueueItem[];
  currentDownload: DownloadQueueItem | null;
  downloads: GameDownloadState;
  isPaused: boolean;
}

// ============================================================================
// NETWORK
// ============================================================================

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

// ============================================================================
// DEVICE INFO
// ============================================================================

export interface DeviceInfo {
  platform: 'android' | 'ios' | 'web';
  model: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
}

// ============================================================================
// STORAGE INFO
// ============================================================================

export interface StorageInfo {
  totalSpace: number;
  freeSpace: number;
  usedByGames: number;
}

// ============================================================================
// ERRORS
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class DownloadError extends Error {
  constructor(message: string, public gameId: string) {
    super(message);
    this.name = 'DownloadError';
  }
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

// ============================================================================
// USER UPDATE DATA
// ============================================================================

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  email?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'patient' | 'psychologist';
}

// UserStorageData é apenas um alias para User
// Ambos representam os mesmos dados
export type UserStorageData = User;

// ============================================================================
// GAME RESPONSES
// ============================================================================

export interface GameResponse {
  game: Game;
}

export interface GamesListResponse {
  games: Game[];
  total?: number;
}

export interface GameDownloadResponse {
  download_url: string;
  file_size: number;
  checksum?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
