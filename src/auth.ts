import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

const ADMIN_EMAIL = 'qtabm769@gmail.com';
const JAIB_WALLET_NUMBER = '779676636';
const WHATSAPP_NUMBER_INTL = '967779676636';
const MONTHLY_PRICE_YER = 500;
const YEARLY_PRICE_YER = 5000;
const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day free trial (24 hours)

export type WalletProvider = 'jaib' | 'onecash' | 'mobilemoney' | 'jawali';

interface WalletMeta {
  id: WalletProvider;
  nameAr: string;
  nameEn: string;
  fullName: string;
  logo: string;
  account: string;
  activeCardClass: string;
  badgeClass: string;
  accentTextClass: string;
}

const WALLETS: WalletMeta[] = [
  {
    id: 'jaib',
    nameAr: 'جيب',
    nameEn: 'Jaib',
    fullName: 'محفظة جيب (Jaib)',
    logo: '/logos/wallets/jaib.png',
    account: JAIB_WALLET_NUMBER,
    activeCardClass: 'bg-rose-500/15 border-rose-400 shadow-lg shadow-rose-500/20',
    badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    accentTextClass: 'text-rose-300',
  },
  {
    id: 'onecash',
    nameAr: 'ون كاش',
    nameEn: 'ONE Cash',
    fullName: 'محفظة ون كاش (ONE Cash)',
    logo: '/logos/wallets/onecash.png',
    account: JAIB_WALLET_NUMBER,
    activeCardClass: 'bg-orange-500/15 border-orange-400 shadow-lg shadow-orange-500/20',
    badgeClass: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
    accentTextClass: 'text-orange-300',
  },
  {
    id: 'mobilemoney',
    nameAr: 'موبايل موني',
    nameEn: 'Mobile Money',
    fullName: 'محفظة موبايل موني (Mobile Money)',
    logo: '/logos/wallets/mobilemoney.png',
    account: JAIB_WALLET_NUMBER,
    activeCardClass: 'bg-sky-500/15 border-sky-400 shadow-lg shadow-sky-500/20',
    badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    accentTextClass: 'text-sky-300',
  },
  {
    id: 'jawali',
    nameAr: 'جوالي',
    nameEn: 'Jawali',
    fullName: 'محفظة جوالي (Jawali)',
    logo: '/logos/wallets/jawali.png',
    account: JAIB_WALLET_NUMBER,
    activeCardClass: 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    accentTextClass: 'text-amber-300',
  },
];

function getWalletMeta(id?: string | null): WalletMeta {
  return WALLETS.find((w) => w.id === id) || WALLETS[0];
}

// Operation Types for Structured Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on startup
async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        return;
      } catch (retryError) {
        const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
        if (retryMsg.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    }
  }
}
if (typeof window !== 'undefined' && document.readyState !== 'complete') {
  window.addEventListener('load', () => {
    setTimeout(() => { void testConnection(); }, 1200);
  }, { once: true });
} else {
  setTimeout(() => { void testConnection(); }, 250);
}

export type SubscriptionStatus = 'none' | 'active' | 'expired';
export type SubscriptionPlan = 'trial' | 'monthly' | 'yearly';

export interface UserTicketProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  ticketNumber: number;
  formattedTicket: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  trialStartedAt?: any;
  subscriptionExpiresAt?: any;
  activatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  // Normalized millisecond fields for cache & fast calculation
  trialStartedMs?: number | null;
  subscriptionExpiresMs?: number | null;
  createdAtMs?: number | null;
}

export interface PaymentRequestRecord {
  requestId: string;
  uid: string;
  displayName: string;
  userEmail: string;
  formattedTicket: string;
  plan: 'monthly' | 'yearly';
  amount: 500 | 5000;
  currency: 'YER';
  walletNumber: '779676636';
  walletProvider?: WalletProvider;
  senderPhone: string;
  transactionRef: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string | null;
  reviewedBy?: string | null;
  aiVerified?: boolean;
  aiConfidence?: number;
  aiReason?: string;
  aiDetectedAmount?: number;
  aiDetectedReceiver?: string;
  aiDetectedRef?: string;
  aiReceiptHash?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AiActivationPass {
  uid: string;
  active: boolean;
  plan: 'monthly' | 'yearly';
  amountYER: number;
  transactionRef: string;
  expiresAtMs: number;
}

export interface AiAnalysisPreview {
  verified: boolean;
  activated: boolean;
  error?: string | null;
  reasonAr?: string;
  amountYER?: number;
  receiverNumber?: string;
  receiverMatchesTarget?: boolean;
  senderPhone?: string;
  transactionRef?: string;
  confidence?: number;
  isPaymentReceipt?: boolean;
  isSuccessful?: boolean;
}

export interface AccessState {
  allowed: boolean;
  reason: 'not_signed_in' | 'admin' | 'paid' | 'trial' | 'expired';
  isAdmin: boolean;
  plan: SubscriptionPlan | null;
  expiresAtMs: number | null;
  remainingMs: number;
  label: string;
}

declare global {
  interface Window {
    TadhkiraAuth: {
      signInWithGoogle: () => Promise<void>;
      logOut: () => Promise<void>;
      openTicketModal: (isNew?: boolean) => void;
      closeTicketModal: () => void;
      openAuthGateModal: (itemTitle?: string) => void;
      closeAuthGateModal: () => void;
      openSubscriptionModal: (itemTitle?: string) => void;
      closeSubscriptionModal: () => void;
      selectPlan: (plan: 'monthly' | 'yearly') => void;
      selectWallet: (wallet: WalletProvider) => void;
      copyWalletNumber: () => void;
      copyJaibWallet: () => void;
      handleReceiptFileSelect: (event: Event) => Promise<void>;
      clearSelectedReceipt: () => void;
      analyzeAndVerifyReceipt: () => Promise<void>;
      submitJaibPayment: (event?: Event) => Promise<void>;
      openAdminPanelModal: () => void;
      closeAdminPanelModal: () => void;
      switchAdminTab: (tab: 'requests' | 'users') => void;
      setAdminRequestFilter: (filter: 'pending' | 'all' | 'approved' | 'rejected') => void;
      filterAdminUsers: (term: string) => void;
      approvePaymentRequest: (requestId: string) => Promise<void>;
      rejectPaymentRequest: (requestId: string) => Promise<void>;
      adminSetUserSubscription: (targetUid: string, action: 'monthly' | 'yearly' | 'revoke') => Promise<void>;
      renderAdminUsersPageSection: () => void;
      filterAdminPageUsers: (term: string) => void;
      requestDeleteAdminUser: (targetUid: string) => void;
      cancelDeleteAdminUser: () => void;
      confirmAndDeleteAdminUser: (targetUid: string) => Promise<void>;
      refreshAdminUsersList: () => Promise<void>;
      copyUserEmail: (email: string) => void;
      showDomainGuideModal: () => void;
      closeDomainGuideModal: () => void;
      showEnableProviderModal: () => void;
      closeEnableProviderModal: () => void;
      shareTicket: () => Promise<void>;
      getCurrentUser: () => FirebaseUser | null;
      getCurrentTicket: () => UserTicketProfile | null;
      getAccessState: () => AccessState;
      hasActiveAccess: () => boolean;
      isAdminUser: () => boolean;
      requirePlaybackAccess: (item: any, onAllowed: () => void) => void;
    };
  }
}

let currentUserProfile: UserTicketProfile | null = null;
let serverAiActivation: AiActivationPass | null = null;
let userPaymentRequests: PaymentRequestRecord[] = [];
let adminAllRequests: PaymentRequestRecord[] = [];
let adminAllUsers: UserTicketProfile[] = [];
let activeTicketPromise: Promise<UserTicketProfile> | null = null;
let activeTicketUid: string | null = null;

let userProfileUnsub: Unsubscribe | null = null;
let userPaymentsUnsub: Unsubscribe | null = null;
let adminPaymentsUnsub: Unsubscribe | null = null;
let adminUsersUnsub: Unsubscribe | null = null;
let liveCountdownTimer: number | null = null;

let selectedPlanChoice: 'monthly' | 'yearly' = 'monthly';
let selectedWalletChoice: WalletProvider = 'jaib';
let draftSenderPhone = '';
let draftTransactionRef = '';
let draftPaymentNote = '';
let pendingPlaybackCallback: (() => void) | null = null;
let pendingPlaybackTitle: string = '';
let activeAdminTab: 'requests' | 'users' = 'requests';
let activeAdminRequestFilter: 'pending' | 'all' | 'approved' | 'rejected' = 'pending';
let adminUserSearchTerm = '';
let confirmDeleteUserUid: string | null = null;
let deletingUserUid: string | null = null;
let isAdminUsersLoading = false;
let isSubmittingPayment = false;
let isAnalyzingReceipt = false;
let isAuthenticating = false;
let selectedReceiptPreviewDataUrl: string = '';
let selectedReceiptBase64: string = '';
let selectedReceiptMimeType: string = 'image/jpeg';
let selectedReceiptFileName: string = '';
let lastAiAnalysisResult: AiAnalysisPreview | null = null;
let tokenEmail: string | null = null;
let tokenEmailVerified = false;
let activeListenersUid: string | null = null;
let activeListenersWasAdmin = false;
let adminUsersErrorMsg: string | null = null;
let syncedProfileUid: string | null = null;
let activeProfileSyncPromise: Promise<void> | null = null;

function toast(msg: string) {
  if (typeof (window as any).showToast === 'function') {
    (window as any).showToast(msg);
  }
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseTimestampMs(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') {
    return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1e6);
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeProfile(raw: any): UserTicketProfile {
  const trialStartedMs = parseTimestampMs(raw?.trialStartedAt) ?? raw?.trialStartedMs ?? null;
  const subscriptionExpiresMs = parseTimestampMs(raw?.subscriptionExpiresAt) ?? raw?.subscriptionExpiresMs ?? null;
  const createdAtMs = parseTimestampMs(raw?.createdAt) ?? raw?.createdAtMs ?? null;

  return {
    uid: String(raw?.uid || ''),
    displayName: String(raw?.displayName || 'مشترك VIP'),
    email: String(raw?.email || ''),
    photoURL: String(raw?.photoURL || ''),
    ticketNumber: Number(raw?.ticketNumber) || 0,
    formattedTicket: String(raw?.formattedTicket || '#VIP'),
    subscriptionStatus: (raw?.subscriptionStatus as SubscriptionStatus) || 'none',
    subscriptionPlan: (raw?.subscriptionPlan as SubscriptionPlan) || 'trial',
    trialStartedAt: raw?.trialStartedAt || null,
    subscriptionExpiresAt: raw?.subscriptionExpiresAt || null,
    activatedBy: raw?.activatedBy || null,
    createdAt: raw?.createdAt || null,
    updatedAt: raw?.updatedAt || null,
    trialStartedMs,
    subscriptionExpiresMs,
    createdAtMs,
  };
}

function saveProfileCache(userUid: string, profile: UserTicketProfile) {
  try {
    const serializable = {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      ticketNumber: profile.ticketNumber,
      formattedTicket: profile.formattedTicket,
      subscriptionStatus: profile.subscriptionStatus,
      subscriptionPlan: profile.subscriptionPlan,
      activatedBy: profile.activatedBy || null,
      trialStartedMs: profile.trialStartedMs ?? parseTimestampMs(profile.trialStartedAt),
      subscriptionExpiresMs: profile.subscriptionExpiresMs ?? parseTimestampMs(profile.subscriptionExpiresAt),
      createdAtMs: profile.createdAtMs ?? parseTimestampMs(profile.createdAt),
    };
    localStorage.setItem(`vip_ticket_profile_${userUid}`, JSON.stringify(serializable));
  } catch (_) {}
}

function getEffectiveUserEmail(
  user: FirebaseUser | null = auth.currentUser,
  profile: UserTicketProfile | null = currentUserProfile
): string {
  const candidates: Array<string | null | undefined> = [
    user?.email,
    ...(user?.providerData?.map((p) => p?.email) || []),
    tokenEmail,
    profile && (!user || profile.uid === user.uid) ? profile.email : '',
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().toLowerCase();
    }
  }
  return '';
}

function isAdminEmailMatch(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

async function syncTokenClaims(user: FirebaseUser | null): Promise<void> {
  if (!user) {
    tokenEmail = null;
    tokenEmailVerified = false;
    return;
  }
  try {
    let tokenResult = await user.getIdTokenResult();
    const claimEmail = typeof tokenResult?.claims?.email === 'string' ? tokenResult.claims.email.trim().toLowerCase() : null;
    const claimVerified = Boolean(tokenResult?.claims?.email_verified);
    tokenEmail = claimEmail;
    tokenEmailVerified = claimVerified;

    const effective = getEffectiveUserEmail(user, currentUserProfile);
    if (effective === ADMIN_EMAIL.toLowerCase() && (!user.emailVerified || !claimVerified)) {
      await user.reload().catch(() => {});
      tokenResult = await user.getIdTokenResult(true);
      tokenEmail = typeof tokenResult?.claims?.email === 'string' ? tokenResult.claims.email.trim().toLowerCase() : tokenEmail;
      tokenEmailVerified = Boolean(tokenResult?.claims?.email_verified);
    }
  } catch (_) {}
}

function isAdminUser(user: FirebaseUser | null = auth.currentUser): boolean {
  if (!user) return false;
  const email = getEffectiveUserEmail(user, currentUserProfile);
  if (email !== ADMIN_EMAIL.toLowerCase()) return false;
  const hasGoogleProvider = Boolean(
    user.providerData?.some((p) => p?.providerId === 'google.com')
  );
  return Boolean(user.emailVerified || tokenEmailVerified || hasGoogleProvider);
}

function formatRemainingDuration(ms: number): string {
  if (ms <= 0) return 'منتهي';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  if (days >= 1) {
    return `${days} يوم${hours > 0 ? ` و${hours} س` : ''}`;
  }
  if (hours >= 1) {
    return `${hours} ساعة${mins > 0 ? ` و${mins} د` : ''}`;
  }
  return `${Math.max(1, mins)} دقيقة`;
}

function formatArabicDate(ms: number | null | undefined): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return '—';
  }
}

function getAccessState(): AccessState {
  const user = auth.currentUser;
  if (!user) {
    return {
      allowed: false,
      reason: 'not_signed_in',
      isAdmin: false,
      plan: null,
      expiresAtMs: null,
      remainingMs: 0,
      label: 'غير مسجل',
    };
  }

  if (isAdminUser(user)) {
    return {
      allowed: true,
      reason: 'admin',
      isAdmin: true,
      plan: 'yearly',
      expiresAtMs: null,
      remainingMs: Number.MAX_SAFE_INTEGER,
      label: 'إدارة المنصة 👑',
    };
  }

  const now = Date.now();
  const p = currentUserProfile;

  // 1. Check active paid subscription (Firestore profile OR server-verified AI receipt pass)
  if (p && p.subscriptionStatus === 'active') {
    const expMs = p.subscriptionExpiresMs ?? parseTimestampMs(p.subscriptionExpiresAt);
    if (expMs && expMs > now) {
      const rem = expMs - now;
      return {
        allowed: true,
        reason: 'paid',
        isAdmin: false,
        plan: p.subscriptionPlan === 'yearly' ? 'yearly' : 'monthly',
        expiresAtMs: expMs,
        remainingMs: rem,
        label: `مشترك (${formatRemainingDuration(rem)})`,
      };
    }
  }

  if (serverAiActivation && serverAiActivation.uid === user.uid && serverAiActivation.active && serverAiActivation.expiresAtMs > now) {
    const rem = serverAiActivation.expiresAtMs - now;
    return {
      allowed: true,
      reason: 'paid',
      isAdmin: false,
      plan: serverAiActivation.plan,
      expiresAtMs: serverAiActivation.expiresAtMs,
      remainingMs: rem,
      label: `مشترك AI (${formatRemainingDuration(rem)})`,
    };
  }

  // 2. Check 1-day (24h) free trial anchored to immutable server timestamp
  if (p) {
    const trialStartMs = p.trialStartedMs ?? parseTimestampMs(p.trialStartedAt);
    if (trialStartMs) {
      const trialEndMs = trialStartMs + TRIAL_DURATION_MS;
      if (trialEndMs > now) {
        const rem = trialEndMs - now;
        return {
          allowed: true,
          reason: 'trial',
          isAdmin: false,
          plan: 'trial',
          expiresAtMs: trialEndMs,
          remainingMs: rem,
          label: `يوم مجاني (${formatRemainingDuration(rem)})`,
        };
      }
    }
  }

  return {
    allowed: false,
    reason: 'expired',
    isAdmin: false,
    plan: p?.subscriptionPlan || null,
    expiresAtMs: null,
    remainingMs: 0,
    label: 'انتهت الفترة المجانية',
  };
}

function hasActiveAccess(): boolean {
  return getAccessState().allowed;
}

function buildWhatsAppConfirmUrl(req: {
  displayName: string;
  userEmail: string;
  formattedTicket: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  walletProvider?: WalletProvider;
  senderPhone: string;
  transactionRef: string;
}): string {
  const planName = req.plan === 'yearly' ? 'الباقة السنوية (5,000 ريال)' : 'الباقة الشهرية (500 ريال)';
  const walletMeta = getWalletMeta(req.walletProvider);
  const msg = [
    'السلام عليكم، أرجو تأكيد اشتراكي في منصة تذكرة دخول VIP:',
    `• الاسم: ${req.displayName}`,
    `• التذكرة: ${req.formattedTicket}`,
    `• الإيميل: ${req.userEmail}`,
    `• الباقة: ${planName}`,
    `• المحفظة: ${walletMeta.fullName}`,
    `• الرقم المحوّل إليه: ${JAIB_WALLET_NUMBER}`,
    `• رقم المحوّل منه: ${req.senderPhone}`,
    `• رقم العملية: ${req.transactionRef}`,
  ].join('\n');
  return `https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent(msg)}`;
}

// Cleanup Firestore listeners on logout or user change
function clearRealtimeListeners() {
  if (userProfileUnsub) {
    userProfileUnsub();
    userProfileUnsub = null;
  }
  if (userPaymentsUnsub) {
    userPaymentsUnsub();
    userPaymentsUnsub = null;
  }
  if (adminPaymentsUnsub) {
    adminPaymentsUnsub();
    adminPaymentsUnsub = null;
  }
  if (adminUsersUnsub) {
    adminUsersUnsub();
    adminUsersUnsub = null;
  }
  userPaymentRequests = [];
  adminAllRequests = [];
  adminAllUsers = [];
  confirmDeleteUserUid = null;
  deletingUserUid = null;
  isAdminUsersLoading = false;
  activeListenersUid = null;
  activeListenersWasAdmin = false;
  adminUsersErrorMsg = null;
}

function updateAdminUsersBadgeCount() {
  document.querySelectorAll('.admin-users-count-badge').forEach((el) => {
    el.textContent = String(adminAllUsers.length);
  });
}

function startRealtimeListeners(user: FirebaseUser) {
  const isAdmNow = isAdminUser(user);
  if (
    activeListenersUid === user.uid &&
    activeListenersWasAdmin === isAdmNow &&
    userProfileUnsub &&
    (!isAdmNow || adminUsersUnsub)
  ) {
    return;
  }
  clearRealtimeListeners();
  activeListenersUid = user.uid;
  activeListenersWasAdmin = isAdmNow;

  // 1. Real-time listener on the user's own profile (for instant unlock when Admin approves)
  const userPath = `users/${user.uid}`;
  userProfileUnsub = onSnapshot(
    doc(db, 'users', user.uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        if (!isAdminUser(user)) {
          try {
            localStorage.removeItem(`vip_ticket_profile_${user.uid}`);
          } catch (_) {}
          currentUserProfile = null;
          renderAuthUI(user, null);
        }
        return;
      }
      const prevAccess = getAccessState();
      const updated = normalizeProfile(snapshot.data());
      currentUserProfile = updated;
      saveProfileCache(user.uid, updated);
      renderAuthUI(user, updated);

      const newAccess = getAccessState();
      if (!prevAccess.allowed && newAccess.allowed && newAccess.reason === 'paid') {
        toast('🎉 مبروك! تم تأكيد دفعك وتفعيل اشتراك VIP بنجاح — استمتع بالمشاهدة!');
        closeSubscriptionModal();
        if (pendingPlaybackCallback) {
          const cb = pendingPlaybackCallback;
          pendingPlaybackCallback = null;
          pendingPlaybackTitle = '';
          setTimeout(() => cb(), 150);
        }
      } else if (prevAccess.allowed && !newAccess.allowed) {
        // Subscription expired or revoked while open
        if (typeof (window as any).closePlayerModal === 'function') {
          const modal = document.getElementById('playerModal');
          if (modal && !modal.classList.contains('hidden')) {
            (window as any).closePlayerModal();
            openSubscriptionModal();
          }
        }
      }

      // Refresh subscription modal if open
      const subModal = document.getElementById('subscriptionModal');
      if (subModal && !subModal.classList.contains('hidden')) {
        renderSubscriptionModalContent();
      }
      const ticketModal = document.getElementById('vipTicketModal');
      if (ticketModal && !ticketModal.classList.contains('opacity-0')) {
        openTicketModal(false);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, userPath);
      } catch (_) {}
    }
  );

  // 2. Real-time listener on user's own payment requests
  const reqQuery = query(
    collection(db, 'paymentRequests'),
    where('uid', '==', user.uid),
    limit(10)
  );
  userPaymentsUnsub = onSnapshot(
    reqQuery,
    (snapshot) => {
      const list: PaymentRequestRecord[] = [];
      snapshot.forEach((d) => list.push(d.data() as PaymentRequestRecord));
      list.sort((a, b) => (parseTimestampMs(b.createdAt) || 0) - (parseTimestampMs(a.createdAt) || 0));
      userPaymentRequests = list;
      const subModal = document.getElementById('subscriptionModal');
      if (subModal && !subModal.classList.contains('hidden')) {
        renderSubscriptionModalContent();
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'paymentRequests');
      } catch (_) {}
    }
  );

  // 3. Admin-only real-time listener on ALL payment requests & registered Google users
  if (isAdminUser(user)) {
    const adminReqQuery = query(
      collection(db, 'paymentRequests'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    adminPaymentsUnsub = onSnapshot(
      adminReqQuery,
      (snapshot) => {
        const list: PaymentRequestRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as PaymentRequestRecord));
        adminAllRequests = list;
        renderAuthUI(user, currentUserProfile);
        const adminModal = document.getElementById('adminPanelModal');
        if (adminModal && !adminModal.classList.contains('hidden')) {
          renderAdminPanelContent();
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'paymentRequests');
        } catch (_) {}
      }
    );

    isAdminUsersLoading = true;
    adminUsersErrorMsg = null;
    const adminUsersQuery = query(collection(db, 'users'), limit(500));
    adminUsersUnsub = onSnapshot(
      adminUsersQuery,
      (snapshot) => {
        const list: UserTicketProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push(normalizeProfile({ ...data, uid: data?.uid || d.id }));
        });
        list.sort((a, b) => (b.ticketNumber || 0) - (a.ticketNumber || 0));
        adminAllUsers = list;
        isAdminUsersLoading = false;
        adminUsersErrorMsg = null;
        updateAdminUsersBadgeCount();
        const adminModal = document.getElementById('adminPanelModal');
        if (adminModal && !adminModal.classList.contains('hidden')) {
          renderAdminPanelContent();
        }
        if (document.getElementById('adminUsersPageRoot')) {
          renderAdminUsersPageListOnly();
        }
      },
      (error: any) => {
        isAdminUsersLoading = false;
        adminUsersErrorMsg = String(error?.code || error?.message || 'permission-denied');
        if (document.getElementById('adminUsersPageRoot')) {
          renderAdminUsersPageListOnly();
        }
        try {
          handleFirestoreError(error, OperationType.LIST, 'users');
        } catch (_) {}
      }
    );
  }
}

async function syncServerAiSubscription(user: FirebaseUser) {
  try {
    const cacheKey = `vip_ai_pass_${user.uid}`;
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw) as AiActivationPass;
        if (parsed && parsed.uid === user.uid && parsed.expiresAtMs > Date.now()) {
          serverAiActivation = parsed;
          renderAuthUI(user, currentUserProfile);
        }
      }
    } catch (_) {}

    const idToken = await user.getIdToken();
    const resp = await fetch('/api/subscription-status', {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const ct = resp.headers.get('content-type') || '';
    if (!resp.ok || !ct.includes('application/json')) return;
    const data = await resp.json();
    if (data?.ok && data.active && data.expiresAtMs > Date.now()) {
      const pass: AiActivationPass = {
        uid: user.uid,
        active: true,
        plan: data.plan === 'yearly' ? 'yearly' : 'monthly',
        amountYER: Number(data.amountYER) || (data.plan === 'yearly' ? YEARLY_PRICE_YER : MONTHLY_PRICE_YER),
        transactionRef: String(data.transactionRef || ''),
        expiresAtMs: Number(data.expiresAtMs),
      };
      serverAiActivation = pass;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(pass));
      } catch (_) {}
      renderAuthUI(user, currentUserProfile);
    }
  } catch (_) {}
}

// Get or create sequential VIP ticket + immutable 1-day trial
async function getOrCreateTicket(user: FirebaseUser, forceServer = false): Promise<UserTicketProfile> {
  if (activeTicketPromise && activeTicketUid === user.uid) {
    return activeTicketPromise;
  }

  activeTicketUid = user.uid;
  activeTicketPromise = (async () => {
    const userDocRef = doc(db, 'users', user.uid);
    const counterDocRef = doc(db, 'counters', 'tickets');
    const providerProfile = user.providerData?.[0];
    const resolvedEmail = getEffectiveUserEmail(user, null);
    const safeDisplayName = (
      user.displayName ||
      providerProfile?.displayName ||
      (resolvedEmail || '').split('@')[0] ||
      'مشترك VIP'
    ).slice(0, 120);
    const safeEmail = (resolvedEmail || user.email || providerProfile?.email || '').slice(0, 160);
    const safePhoto = (user.photoURL || providerProfile?.photoURL || '').slice(0, 500);

    const buildLocalFallback = (): UserTicketProfile => {
      const createdGuess = user.metadata?.creationTime ? Date.parse(user.metadata.creationTime) : Date.now();
      const trialAnchor = Number.isFinite(createdGuess) ? createdGuess : Date.now();
      const fallback: UserTicketProfile = {
        uid: user.uid,
        displayName: safeDisplayName,
        email: safeEmail,
        photoURL: safePhoto,
        ticketNumber: 1,
        formattedTicket: '#VIP',
        subscriptionStatus: 'none',
        subscriptionPlan: 'trial',
        trialStartedMs: trialAnchor,
        subscriptionExpiresMs: null,
        activatedBy: null,
        createdAtMs: trialAnchor,
      };
      currentUserProfile = fallback;
      saveProfileCache(user.uid, fallback);
      return fallback;
    };

    // 1. Check if user already has a profile in Firestore (server-first when verifying membership)
    let existingSnap;
    try {
      if (forceServer) {
        try {
          existingSnap = await getDocFromServer(userDocRef);
        } catch (serverErr: any) {
          const msg = String(serverErr?.code || serverErr?.message || '');
          if (msg.includes('not-found') || msg.includes('offline') || msg.includes('unavailable')) {
            existingSnap = await getDoc(userDocRef);
          } else {
            throw serverErr;
          }
        }
      } else {
        existingSnap = await getDoc(userDocRef);
      }
    } catch (err: any) {
      console.warn('Firestore profile lookup warning:', err?.code || err?.message);
      if (String(err?.code || '').includes('unavailable') || String(err?.message || '').includes('offline')) {
        return buildLocalFallback();
      }
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }

    if (existingSnap && existingSnap.exists()) {
      const rawData = existingSnap.data();

      // One-time legacy migration: if profile existed before subscription update and lacks trialStartedAt
      if (!rawData?.trialStartedAt) {
        try {
          await updateDoc(userDocRef, {
            displayName: (rawData?.displayName || safeDisplayName).slice(0, 120),
            email: (rawData?.email || safeEmail).slice(0, 160),
            photoURL: rawData?.photoURL ? String(rawData.photoURL).slice(0, 500) : safePhoto,
            trialStartedAt: serverTimestamp(),
            subscriptionStatus: 'none',
            subscriptionPlan: 'trial',
            subscriptionExpiresAt: null,
            activatedBy: null,
            updatedAt: serverTimestamp(),
          });
          const refreshed = await getDoc(userDocRef);
          if (refreshed.exists()) {
            const normalized = normalizeProfile(refreshed.data());
            currentUserProfile = normalized;
            saveProfileCache(user.uid, normalized);
            return normalized;
          }
        } catch (migErr: any) {
          console.warn('Legacy migration fallback triggered:', migErr?.code || migErr?.message);
          try {
            handleFirestoreError(migErr, OperationType.UPDATE, `users/${user.uid}`);
          } catch (_) {}
          const merged = normalizeProfile({
            ...rawData,
            uid: user.uid,
            displayName: safeDisplayName,
            email: safeEmail,
            photoURL: safePhoto,
            trialStartedMs: Date.now(),
          });
          currentUserProfile = merged;
          saveProfileCache(user.uid, merged);
          return merged;
        }
      }

      const normalized = normalizeProfile(rawData);
      currentUserProfile = normalized;
      syncedProfileUid = user.uid;
      saveProfileCache(user.uid, normalized);
      return normalized;
    }

    // 2. New User: Atomically assign sequential ticket + initialize server-anchored 1-day trial
    try {
      await runTransaction(db, async (transaction) => {
        const userSnapInTx = await transaction.get(userDocRef);
        if (userSnapInTx.exists()) {
          return;
        }

        const counterSnap = await transaction.get(counterDocRef);
        let nextTicket = 1;
        if (counterSnap.exists()) {
          const cData = counterSnap.data();
          nextTicket = Math.max(1, (Number(cData?.currentTicket) || 0) + 1);
        }

        const formatted = '#' + String(nextTicket).padStart(4, '0');

        transaction.set(
          counterDocRef,
          {
            currentTicket: nextTicket,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(userDocRef, {
          uid: user.uid,
          displayName: safeDisplayName,
          email: safeEmail,
          photoURL: safePhoto,
          ticketNumber: nextTicket,
          formattedTicket: formatted,
          subscriptionStatus: 'none',
          subscriptionPlan: 'trial',
          trialStartedAt: serverTimestamp(),
          subscriptionExpiresAt: null,
          activatedBy: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      const createdSnap = await getDoc(userDocRef);
      const createdProfile = normalizeProfile(
        createdSnap.exists()
          ? createdSnap.data()
          : {
              uid: user.uid,
              displayName: safeDisplayName,
              email: safeEmail,
              photoURL: safePhoto,
              ticketNumber: 1,
              formattedTicket: '#0001',
              subscriptionStatus: 'none',
              subscriptionPlan: 'trial',
              trialStartedMs: Date.now(),
            }
      );

      currentUserProfile = createdProfile;
      syncedProfileUid = user.uid;
      saveProfileCache(user.uid, createdProfile);
      return createdProfile;
    } catch (err: any) {
      // Retry reading in case a parallel tab created the doc mid-transaction
      try {
        const retrySnap = await getDoc(userDocRef);
        if (retrySnap.exists()) {
          const normalized = normalizeProfile(retrySnap.data());
          currentUserProfile = normalized;
          saveProfileCache(user.uid, normalized);
          return normalized;
        }
      } catch (_) {}

      const errMsg = String(err?.code || err?.message || '');
      if (errMsg.includes('unavailable') || errMsg.includes('offline')) {
        return buildLocalFallback();
      }
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  })().finally(() => {
    activeTicketPromise = null;
    activeTicketUid = null;
  });

  return activeTicketPromise;
}

// Playback Access Gate — Free browsing, gated playback!
async function requirePlaybackAccess(item: any, onAllowed: () => void) {
  const itemTitle = item?.title || 'هذا العمل';

  // Ensure Firebase Auth has finished restoring session before treating user as guest
  if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
    try {
      await Promise.race([
        (auth as any).authStateReady(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch (_) {}
  }

  const user = auth.currentUser;

  // 1. Guest -> Require Google Sign-In first (unlocks 1-day free trial immediately!)
  if (!user) {
    pendingPlaybackCallback = onAllowed;
    pendingPlaybackTitle = itemTitle;
    openAuthGateModal(itemTitle);
    return;
  }

  // 2. Admin -> Instant unlimited access
  if (isAdminUser(user)) {
    onAllowed();
    return;
  }

  // 3. Wait for any in-flight login/auth-restore sync, or verify fresh from server before denying
  if (activeProfileSyncPromise) {
    try {
      await activeProfileSyncPromise;
    } catch (_) {}
  }

  let access = getAccessState();
  if (!access.allowed || syncedProfileUid !== user.uid) {
    toast('<i class="fa-solid fa-circle-notch fa-spin text-brand mr-1"></i> جاري التحقق من صلاحية الاشتراك...');
    try {
      await Promise.allSettled([
        getOrCreateTicket(user, true),
        syncServerAiSubscription(user),
      ]);
    } catch (_) {}
    renderAuthUI(user, currentUserProfile);
    access = getAccessState();
  }

  if (access.allowed) {
    onAllowed();
    return;
  }

  // 4. Trial expired & no active paid subscription -> Open Jaib Subscription Modal
  pendingPlaybackCallback = onAllowed;
  pendingPlaybackTitle = itemTitle;
  openSubscriptionModal(itemTitle);
}

// Auth Gate Modal (Shown to guests when clicking Play)
function openAuthGateModal(itemTitle = '') {
  closeSubscriptionModal();
  let modal = document.getElementById('authGateModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'authGateModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-all duration-200';
    modal.onclick = (e) => {
      if (e.target === modal) closeAuthGateModal();
    };
    document.body.appendChild(modal);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.innerHTML = `
    <div class="relative w-full max-w-md bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950 border border-amber-400/50 rounded-3xl shadow-[0_25px_70px_rgba(245,158,11,0.25)] overflow-hidden text-right">
      <button onclick="window.TadhkiraAuth.closeAuthGateModal()" class="absolute top-3.5 left-3.5 z-20 w-8 h-8 rounded-full bg-dark-800/90 hover:bg-dark-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer">
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>

      <div class="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-5 text-dark-950 text-center">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-dark-950/15 flex items-center justify-center text-2xl mb-2">
          🎁
        </div>
        <h3 class="text-lg sm:text-xl font-black leading-tight">يوم كامل مجاني فور تسجيل الدخول!</h3>
        <p class="text-xs font-bold text-amber-950/85 mt-1">
          ${itemTitle ? `لمشاهدة «${escapeHtml(itemTitle)}» وبقية المنصة` : 'لفتح جميع الأفلام والمسلسلات بجودة 1080p FHD'}
        </p>
      </div>

      <div class="p-5 space-y-4">
        <div class="p-3.5 rounded-2xl bg-dark-950/90 border border-emerald-500/30 space-y-2 text-xs">
          <div class="flex items-center gap-2 text-emerald-400 font-black">
            <i class="fa-solid fa-circle-check"></i>
            <span>ماذا تحصل بمجرد الدخول بحساب Google؟</span>
          </div>
          <ul class="space-y-1.5 text-slate-300 text-[11.5px] pr-1">
            <li class="flex items-center gap-2"><span class="text-amber-400">★</span> <span><b>24 ساعة مشاهدة مجانية</b> مفتوحة لكل الأفلام والمسلسلات.</span></li>
            <li class="flex items-center gap-2"><span class="text-amber-400">★</span> <span><b>تذكرة دخول VIP رقمية</b> باسمك ورقمك التسلسلي الخاص.</span></li>
            <li class="flex items-center gap-2"><span class="text-amber-400">★</span> <span>وبعد التجربة: <b>500 ريال/شهر</b> أو <b>5,000 ريال/سنة</b> عبر محافظ (جيب، ون كاش، موبايل موني، جوالي).</span></li>
          </ul>
        </div>

        <button onclick="window.TadhkiraAuth.signInWithGoogle()" class="google-signin-btn w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand via-sky-400 to-amber-400 hover:brightness-110 text-dark-950 font-black text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-brand/20 active:scale-95">
          <div class="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <span class="signin-btn-text">دخول بـ Google وبدء الـ 24 ساعة المجانية</span>
        </button>

        <button onclick="window.TadhkiraAuth.closeAuthGateModal()" class="w-full py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
          متابعة التصفح فقط
        </button>
      </div>
    </div>
  `;
}

function closeAuthGateModal() {
  const modal = document.getElementById('authGateModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Jaib Subscription & Payment Modal
function openSubscriptionModal(itemTitle = '') {
  if (!auth.currentUser) {
    openAuthGateModal(itemTitle);
    return;
  }
  closeAuthGateModal();
  if (itemTitle) pendingPlaybackTitle = itemTitle;

  let modal = document.getElementById('subscriptionModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'subscriptionModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto';
    modal.onclick = (e) => {
      if (e.target === modal) closeSubscriptionModal();
    };
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  renderSubscriptionModalContent();
}

function closeSubscriptionModal() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function capturePaymentDraftInputs() {
  const phoneEl = document.getElementById('jaibSenderPhone') as HTMLInputElement | null;
  const refEl = document.getElementById('jaibTransactionRef') as HTMLInputElement | null;
  const noteEl = document.getElementById('jaibPaymentNote') as HTMLInputElement | null;
  if (phoneEl) draftSenderPhone = phoneEl.value;
  if (refEl) draftTransactionRef = refEl.value;
  if (noteEl) draftPaymentNote = noteEl.value;
}

function selectPlan(plan: 'monthly' | 'yearly') {
  capturePaymentDraftInputs();
  selectedPlanChoice = plan;
  renderSubscriptionModalContent();
}

function selectWallet(wallet: WalletProvider) {
  capturePaymentDraftInputs();
  selectedWalletChoice = getWalletMeta(wallet).id;
  renderSubscriptionModalContent();
}

function copyWalletNumber() {
  const walletMeta = getWalletMeta(selectedWalletChoice);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(JAIB_WALLET_NUMBER).catch(() => {});
  }
  toast(`📋 تم نسخ رقم حساب ${escapeHtml(walletMeta.nameAr)}: <span class="text-amber-400 font-mono font-black">${JAIB_WALLET_NUMBER}</span>`);
}

function copyJaibWallet() {
  copyWalletNumber();
}

function compressReceiptImageFile(file: File): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => {
        // Fallback: use raw image if browser fails canvas decode
        const comma = rawDataUrl.indexOf(',');
        resolve({
          dataUrl: rawDataUrl,
          base64: comma !== -1 ? rawDataUrl.slice(comma + 1) : rawDataUrl,
          mimeType: file.type || 'image/jpeg',
        });
      };
      img.onload = () => {
        const maxDim = 1280;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const comma = rawDataUrl.indexOf(',');
          resolve({
            dataUrl: rawDataUrl,
            base64: comma !== -1 ? rawDataUrl.slice(comma + 1) : rawDataUrl,
            mimeType: file.type || 'image/jpeg',
          });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const jpegUrl = canvas.toDataURL('image/jpeg', 0.85);
        const comma = jpegUrl.indexOf(',');
        resolve({
          dataUrl: jpegUrl,
          base64: comma !== -1 ? jpegUrl.slice(comma + 1) : jpegUrl,
          mimeType: 'image/jpeg',
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function handleReceiptFileSelect(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('⚠️ يرجى اختيار ملف صورة فقط (PNG أو JPG أو WEBP)');
    return;
  }
  try {
    const compressed = await compressReceiptImageFile(file);
    selectedReceiptPreviewDataUrl = compressed.dataUrl;
    selectedReceiptBase64 = compressed.base64;
    selectedReceiptMimeType = compressed.mimeType;
    selectedReceiptFileName = file.name || 'receipt.jpg';
    lastAiAnalysisResult = null;
    renderSubscriptionModalContent();
    toast('📸 تم تجهيز صورة الإشعار — اضغط «تحليل الإشعار بالذكاء الاصطناعي» لتفعيل الاشتراك');
  } catch (err: any) {
    toast('⚠️ ' + (err?.message || 'تعذر تجهيز الصورة'));
  }
}

function clearSelectedReceipt() {
  selectedReceiptPreviewDataUrl = '';
  selectedReceiptBase64 = '';
  selectedReceiptFileName = '';
  lastAiAnalysisResult = null;
  renderSubscriptionModalContent();
}

async function analyzeAndVerifyReceipt() {
  if (isAnalyzingReceipt || isSubmittingPayment) return;
  const user = auth.currentUser;
  if (!user) {
    openAuthGateModal();
    return;
  }
  const activeWallet = getWalletMeta(selectedWalletChoice);
  if (!selectedReceiptBase64) {
    toast(`📸 يرجى اختيار صورة إشعار التحويل من محفظة ${activeWallet.nameAr} أولاً`);
    return;
  }

  capturePaymentDraftInputs();
  const phoneInput = document.getElementById('jaibSenderPhone') as HTMLInputElement | null;
  const refInput = document.getElementById('jaibTransactionRef') as HTMLInputElement | null;
  const noteInput = document.getElementById('jaibPaymentNote') as HTMLInputElement | null;

  const senderPhoneManual = (phoneInput?.value || draftSenderPhone || '').trim();
  const transactionRefManual = (refInput?.value || draftTransactionRef || '').trim();
  const noteManual = (noteInput?.value || draftPaymentNote || '').trim().slice(0, 250);

  isAnalyzingReceipt = true;
  lastAiAnalysisResult = null;
  renderSubscriptionModalContent();

  try {
    const idToken = await user.getIdToken();
    const resp = await fetch('/api/verify-jaib-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        imageBase64: selectedReceiptBase64,
        mimeType: selectedReceiptMimeType,
        plan: selectedPlanChoice,
        walletProvider: selectedWalletChoice,
        senderPhone: senderPhoneManual,
        transactionRef: transactionRefManual,
      }),
    });

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('SERVER_UNAVAILABLE');
    }

    const result = await resp.json();
    const analysis = result?.analysis || {};
    const verifiedWalletMeta = getWalletMeta(
      result?.activation?.walletProvider || analysis?.walletProvider || selectedWalletChoice
    );

    lastAiAnalysisResult = {
      verified: Boolean(result?.verified),
      activated: Boolean(result?.activated),
      error: result?.error || null,
      reasonAr: analysis.reasonAr || result?.error || '',
      amountYER: analysis.amountYER,
      receiverNumber: analysis.receiverNumber,
      receiverMatchesTarget: analysis.receiverMatchesTarget,
      senderPhone: analysis.senderPhone,
      transactionRef: result?.activation?.transactionRef || analysis.transactionRef,
      confidence: analysis.confidence,
      isPaymentReceipt: analysis.isPaymentReceipt,
      isSuccessful: analysis.isSuccessful,
    };

    if (result?.verified && result?.activated && result?.activation) {
      const act = result.activation;
      const pass: AiActivationPass = {
        uid: user.uid,
        active: true,
        plan: act.plan === 'yearly' ? 'yearly' : 'monthly',
        amountYER: Number(act.amountYER) || (act.plan === 'yearly' ? YEARLY_PRICE_YER : MONTHLY_PRICE_YER),
        transactionRef: String(act.transactionRef || transactionRefManual || 'AI_VERIFIED'),
        expiresAtMs: Number(act.expiresAtMs),
      };
      serverAiActivation = pass;
      try {
        localStorage.setItem(`vip_ai_pass_${user.uid}`, JSON.stringify(pass));
      } catch (_) {}

      // Also save audited PaymentRequest in Firestore so Admin panel shows the AI-verified receipt record
      try {
        const profile = currentUserProfile || (await getOrCreateTicket(user));
        const requestId = `req_${user.uid.slice(0, 12)}_${Date.now()}`;
        const reqDocRef = doc(db, 'paymentRequests', requestId);
        const finalPhoneRaw = String(act.senderPhone || senderPhoneManual || '770000000').replace(/[^0-9+\s\-]/g, '');
        const validPhone = finalPhoneRaw.length >= 7 ? finalPhoneRaw.slice(0, 20) : '770000000';
        const finalRef = String(pass.transactionRef || 'AI_RECEIPT').slice(0, 80);

        await runTransaction(db, async (tx) => {
          tx.set(reqDocRef, {
            requestId,
            uid: user.uid,
            displayName: (profile.displayName || user.displayName || 'مشترك VIP').slice(0, 120),
            userEmail: (profile.email || user.email || '').slice(0, 160),
            formattedTicket: (profile.formattedTicket || '#VIP').slice(0, 20),
            plan: pass.plan,
            amount: pass.plan === 'yearly' ? 5000 : 500,
            currency: 'YER',
            walletNumber: JAIB_WALLET_NUMBER,
            walletProvider: verifiedWalletMeta.id,
            senderPhone: validPhone,
            transactionRef: finalRef.length >= 3 ? finalRef : `AI_${Date.now()}`,
            note: noteManual || `تم التحقق بالذكاء الاصطناعي من إشعار ${verifiedWalletMeta.fullName}`,
            status: 'pending',
            adminNote: null,
            reviewedBy: null,
            aiVerified: true,
            aiConfidence: Math.min(100, Math.max(0, Math.round(Number(analysis.confidence) || 95))),
            aiReason: String(analysis.reasonAr || 'تم تأكيد التحويل عبر الذكاء الاصطناعي').slice(0, 300),
            aiDetectedAmount: Math.round(Number(analysis.amountYER) || pass.amountYER),
            aiDetectedReceiver: String(analysis.receiverNumber || JAIB_WALLET_NUMBER).slice(0, 40),
            aiDetectedRef: finalRef,
            aiReceiptHash: String(analysis.imageHash || '').slice(0, 128),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      } catch (fsAuditErr) {
        console.warn('Firestore AI audit record skipped:', fsAuditErr);
      }

      renderAuthUI(user, currentUserProfile);
      toast(`🎉 تم التحقق من إشعار ${verifiedWalletMeta.nameAr} بالذكاء الاصطناعي وفتح اشتراكك (${act.plan === 'yearly' ? '365 يوم' : '30 يوم'}) فوراً!`);

      if (pendingPlaybackCallback) {
        const cb = pendingPlaybackCallback;
        pendingPlaybackCallback = null;
        pendingPlaybackTitle = '';
        setTimeout(() => {
          closeSubscriptionModal();
          cb();
        }, 700);
      }
    } else {
      toast('⚠️ ' + (result?.error || 'لم يتم تأكيد الإشعار، تحقق من التفاصيل الظاهرة.'));
    }
  } catch (err: any) {
    if (err?.message === 'SERVER_UNAVAILABLE') {
      lastAiAnalysisResult = {
        verified: false,
        activated: false,
        reasonAr:
          'خدمة الفحص التلقائي بالذكاء الاصطناعي غير متوفرة على هذا الرابط الثابت حالياً. يمكنك إرسال رقم العملية في الأسفل أو عبر واتساب للتفعيل الفوري.',
      };
      toast('ℹ️ الفحص التلقائي بالذكاء الاصطناعي يعمل عبر سيرفر التطبيق الكامل — يمكنك الإرسال اليدوي الآن.');
    } else {
      lastAiAnalysisResult = {
        verified: false,
        activated: false,
        reasonAr: err?.message || 'تعذر تحليل الصورة حالياً، يرجى التأكد من وضوح الصورة والمحاولة مجدداً.',
      };
      toast('⚠️ ' + (err?.message || 'تعذر تحليل الإشعار'));
    }
  } finally {
    isAnalyzingReceipt = false;
    renderSubscriptionModalContent();
  }
}

function renderSubscriptionModalContent() {
  const modal = document.getElementById('subscriptionModal');
  if (!modal) return;
  const user = auth.currentUser;
  const profile = currentUserProfile;
  const access = getAccessState();
  const latestPending = userPaymentRequests.find((r) => r.status === 'pending');
  const latestReq = userPaymentRequests[0];

  const isMonthly = selectedPlanChoice === 'monthly';
  const amount = isMonthly ? MONTHLY_PRICE_YER : YEARLY_PRICE_YER;
  const activeWallet = getWalletMeta(selectedWalletChoice);

  let statusBanner = '';
  if (access.reason === 'paid') {
    statusBanner = `
      <div class="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2 text-emerald-300 font-bold">
          <i class="fa-solid fa-crown text-amber-400"></i>
          <span>اشتراكك نشط (${access.plan === 'yearly' ? 'السنوي' : 'الشهري'}) • متبقي ${formatRemainingDuration(access.remainingMs)}</span>
        </div>
        <span class="text-[10px] text-emerald-400 font-mono">ينتهي: ${formatArabicDate(access.expiresAtMs)}</span>
      </div>
    `;
  } else if (access.reason === 'trial') {
    statusBanner = `
      <div class="p-3 rounded-2xl bg-sky-500/15 border border-sky-400/40 text-xs flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2 text-sky-300 font-bold">
          <span>🎁</span>
          <span>فترتك المجانية نشطة — متبقي ${formatRemainingDuration(access.remainingMs)}</span>
        </div>
        <span class="text-[10px] text-amber-300 font-bold">اشترك الآن قبل الانتهاء</span>
      </div>
    `;
  } else {
    statusBanner = `
      <div class="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 text-xs flex items-center gap-2.5 text-amber-200 font-bold">
        <i class="fa-solid fa-lock text-amber-400 text-sm shrink-0"></i>
        <span>انتهت فترة التجربة المجانية (24 ساعة). اشترك الآن عبر إحدى المحافظ اليمنية لفتح جميع الأفلام والمسلسلات${pendingPlaybackTitle ? ` ومتابعة «${escapeHtml(pendingPlaybackTitle)}»` : ''}.</span>
      </div>
    `;
  }

  let latestReqHtml = '';
  if (latestReq) {
    const reqWallet = getWalletMeta(latestReq.walletProvider);
    const statusBadge =
      latestReq.status === 'approved' || latestReq.aiVerified
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✅ تم التأكيد والتفعيل</span>'
        : latestReq.status === 'pending'
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">⏳ قيد المراجعة والتأكيد</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">❌ مرفوض</span>';

    const waLink = buildWhatsAppConfirmUrl({
      displayName: latestReq.displayName,
      userEmail: latestReq.userEmail,
      formattedTicket: latestReq.formattedTicket,
      plan: latestReq.plan,
      amount: latestReq.amount,
      walletProvider: reqWallet.id,
      senderPhone: latestReq.senderPhone,
      transactionRef: latestReq.transactionRef,
    });

    latestReqHtml = `
      <div class="p-3.5 rounded-2xl bg-dark-950 border ${latestReq.status === 'pending' && !latestReq.aiVerified ? 'border-amber-400/50' : 'border-dark-border'} space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <img src="${reqWallet.logo}" alt="${escapeHtml(reqWallet.nameAr)}" class="w-5 h-5 rounded-md object-cover border border-white/15 shrink-0" />
            <span class="font-black text-white">آخر عملية اشتراك مسجلة (${escapeHtml(reqWallet.nameAr)}):</span>
          </div>
          ${statusBadge}
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div>الباقة: <strong class="text-amber-300">${latestReq.plan === 'yearly' ? 'سنوي (5,000 ريال)' : 'شهري (500 ريال)'}</strong></div>
          <div>رقم العملية: <strong class="font-mono text-brand">${escapeHtml(latestReq.transactionRef)}</strong></div>
          <div>رقم المرسل: <strong class="font-mono">${escapeHtml(latestReq.senderPhone)}</strong></div>
          <div>التاريخ: <span>${formatArabicDate(parseTimestampMs(latestReq.createdAt))}</span></div>
        </div>
        ${latestReq.aiReason ? `<p class="text-[11px] text-emerald-300 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30">🤖 الذكاء الاصطناعي: ${escapeHtml(latestReq.aiReason)}</p>` : ''}
        ${latestReq.adminNote ? `<p class="text-[11px] text-rose-300 bg-rose-500/10 p-2 rounded-xl border border-rose-500/30">ملاحظة الإدارة: ${escapeHtml(latestReq.adminNote)}</p>` : ''}
        ${
          latestReq.status === 'pending' && !latestReq.aiVerified
            ? `
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs flex items-center justify-center gap-2 no-underline shadow-lg shadow-emerald-600/20">
            <i class="fa-brands fa-whatsapp text-base"></i>
            <span>إرسال إشعار فوري للإدارة عبر واتساب لتسريع التفعيل</span>
          </a>
        `
            : ''
        }
      </div>
    `;
  }

  let aiResultHtml = '';
  if (lastAiAnalysisResult) {
    const r = lastAiAnalysisResult;
    const okBox = r.verified && r.activated;
    aiResultHtml = `
      <div class="p-3.5 rounded-2xl border ${okBox ? 'bg-emerald-500/15 border-emerald-400/50' : 'bg-rose-500/15 border-rose-400/50'} space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2">
          <span class="font-black ${okBox ? 'text-emerald-300' : 'text-rose-300'}">
            ${okBox ? '✅ تم تأكيد الدفع وتفعيل الاشتراك فوراً!' : '⚠️ نتيجة فحص الذكاء الاصطناعي للإشعار:'}
          </span>
          ${typeof r.confidence === 'number' ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-dark-900 text-slate-200 border border-dark-border">ثقة ${r.confidence}%</span>` : ''}
        </div>
        ${r.reasonAr ? `<p class="text-[11.5px] text-slate-100 leading-relaxed">${escapeHtml(r.reasonAr)}</p>` : ''}
        ${
          r.amountYER || r.receiverNumber || r.transactionRef
            ? `
          <div class="grid grid-cols-3 gap-2 pt-1 text-[10.5px] bg-dark-950/70 p-2 rounded-xl border border-dark-border/60">
            <div>المبلغ: <strong class="text-amber-300">${r.amountYER || 0} ريال</strong></div>
            <div>المستلم: <strong class="font-mono text-white">${escapeHtml(r.receiverNumber || '—')}</strong></div>
            <div>المرجع: <strong class="font-mono text-brand">${escapeHtml(r.transactionRef || '—')}</strong></div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  const walletCardsHtml = WALLETS.map((w) => {
    const isSelected = w.id === activeWallet.id;
    return `
      <button
        type="button"
        data-wallet-choice="${w.id}"
        onclick="window.TadhkiraAuth.selectWallet('${w.id}')"
        class="relative p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group ${
          isSelected ? w.activeCardClass : 'bg-dark-950/85 border-dark-border hover:border-slate-500'
        }"
      >
        ${
          isSelected
            ? '<span class="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-emerald-400 text-dark-950 flex items-center justify-center text-[9px] font-black shadow"><i class="fa-solid fa-check"></i></span>'
            : ''
        }
        <img
          src="${w.logo}"
          alt="${escapeHtml(w.fullName)}"
          class="w-12 h-12 rounded-xl object-cover shadow-md border border-white/15 group-hover:scale-105 transition-transform"
        />
        <div class="leading-tight">
          <span class="block text-xs font-black text-white">${escapeHtml(w.nameAr)}</span>
          <span class="block text-[9.5px] font-mono text-slate-400">${escapeHtml(w.nameEn)}</span>
        </div>
      </button>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="relative w-full max-w-xl bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950 border border-amber-400/40 rounded-3xl shadow-2xl overflow-hidden my-auto text-right">
      <button onclick="window.TadhkiraAuth.closeSubscriptionModal()" class="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer">
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>

      <!-- Header -->
      <div class="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-5 py-4 text-dark-950">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-dark-950/15 flex items-center justify-center text-xl font-black shrink-0">
            <i class="fa-solid fa-crown"></i>
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-black leading-tight">اشتراك تذكرة دخول VIP — المحافظ اليمنية + الذكاء الاصطناعي</h2>
            <p class="text-[11px] font-bold text-amber-950/80">
              ${profile ? `${escapeHtml(profile.displayName)} • تذكرة ${escapeHtml(profile.formattedTicket)}` : escapeHtml(user?.email || '')}
            </p>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-5 space-y-4 max-h-[84vh] overflow-y-auto custom-scrollbar">
        ${statusBanner}
        ${latestReqHtml}

        <!-- Plan Selector -->
        <div class="space-y-2">
          <label class="text-xs font-black text-white block">1. اختر باقة الاشتراك:</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button type="button" onclick="window.TadhkiraAuth.selectPlan('monthly')" class="p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${isMonthly ? 'bg-brand/15 border-brand shadow-lg shadow-brand/15' : 'bg-dark-950/80 border-dark-border hover:border-slate-600'}">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-black text-white">الباقة الشهرية</span>
                <span class="px-2 py-0.5 rounded-full text-[9.5px] font-black ${isMonthly ? 'bg-brand text-dark-950' : 'bg-dark-800 text-slate-300'}">30 يوم</span>
              </div>
              <div class="text-xl font-black text-brand">500 <span class="text-xs font-bold text-slate-300">ريال / شهر</span></div>
              <p class="text-[10.5px] text-slate-400 mt-1">فتح جميع الأفلام والمسلسلات لمدة شهر كامل</p>
            </button>

            <button type="button" onclick="window.TadhkiraAuth.selectPlan('yearly')" class="relative p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${!isMonthly ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-dark-950/80 border-dark-border hover:border-slate-600'}">
              <span class="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 text-dark-950 shadow">وفر 1,000 ريال ⭐</span>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-black text-white">الباقة السنوية</span>
                <span class="px-2 py-0.5 rounded-full text-[9.5px] font-black ${!isMonthly ? 'bg-amber-400 text-dark-950' : 'bg-dark-800 text-slate-300'}">365 يوم</span>
              </div>
              <div class="text-xl font-black text-amber-400">5,000 <span class="text-xs font-bold text-slate-300">ريال / سنة</span></div>
              <p class="text-[10.5px] text-slate-400 mt-1">وصول كامل طوال السنة بدون انقطاع وبأفضل قيمة</p>
            </button>
          </div>
        </div>

        <!-- Step 2: Multi-Wallet Selector with Official Logos -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/35 via-dark-950 to-dark-900 border border-emerald-500/40 space-y-3">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h4 class="text-xs font-black text-white">2. اختر المحفظة (طريقة الدفع) وحوّل المبلغ:</h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">نفس الرقم لجميع المحافظ</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${walletCardsHtml}
          </div>

          <!-- Selected Wallet Active Card -->
          <div id="selectedWalletDetailsCard" class="p-3 rounded-xl bg-dark-900/95 border border-dark-border space-y-2.5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2.5">
                <img src="${activeWallet.logo}" alt="${escapeHtml(activeWallet.fullName)}" class="w-11 h-11 rounded-xl object-cover border border-white/15 shadow-md shrink-0" />
                <div>
                  <h5 class="text-xs font-black text-white">حوّل عبر ${escapeHtml(activeWallet.fullName)}</h5>
                  <p class="text-[10.5px] text-emerald-300">المبلغ المطلوب: <strong class="font-black text-sm">${amount.toLocaleString('en-US')} ريال يمني</strong></p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-black border ${activeWallet.badgeClass}">${escapeHtml(activeWallet.nameAr)}</span>
            </div>

            <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-dark-950 border border-dark-border">
              <div>
                <span class="text-[10px] text-slate-400 block">رقم حساب ${escapeHtml(activeWallet.nameAr)} المستلم:</span>
                <span class="text-lg sm:text-xl font-black font-mono text-amber-300 tracking-wider select-all">${activeWallet.account}</span>
              </div>
              <button type="button" onclick="window.TadhkiraAuth.copyWalletNumber()" class="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow active:scale-95">
                <i class="fa-regular fa-copy"></i>
                <span>نسخ الرقم</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3A: Instant AI Receipt Image Verification -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-brand/10 via-dark-950 to-dark-900 border border-brand/40 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand shrink-0">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div>
                <h4 class="text-xs font-black text-white">3. ارفع صورة إشعار ${escapeHtml(activeWallet.nameAr)} (تفعيل فوري بالذكاء الاصطناعي)</h4>
                <p class="text-[10.5px] text-slate-300">يفحص الذكاء الاصطناعي الإشعار ويتأكد من التحويل لـ ${JAIB_WALLET_NUMBER} ويفعّل باقتك فوراً</p>
              </div>
            </div>
            <img src="${activeWallet.logo}" alt="${escapeHtml(activeWallet.nameAr)}" class="w-7 h-7 rounded-lg object-cover border border-white/15 shrink-0 hidden sm:block" />
          </div>

          <input id="jaibReceiptFileInput" type="file" accept="image/*" class="hidden" onchange="window.TadhkiraAuth.handleReceiptFileSelect(event)" />

          ${
            selectedReceiptPreviewDataUrl
              ? `
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-dark-900 border border-brand/40">
              <img src="${selectedReceiptPreviewDataUrl}" alt="صورة إشعار التحويل" class="w-16 h-16 rounded-xl object-cover border border-brand/40 shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-white truncate">${escapeHtml(selectedReceiptFileName)}</p>
                <p class="text-[10px] text-emerald-400 mt-0.5">جاهز للتحليل والتأكيد لمحفظة ${escapeHtml(activeWallet.nameAr)}</p>
              </div>
              <button type="button" onclick="window.TadhkiraAuth.clearSelectedReceipt()" class="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-[11px] font-bold cursor-pointer">
                تغيير
              </button>
            </div>
          `
              : `
            <button type="button" onclick="document.getElementById('jaibReceiptFileInput')?.click()" class="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-brand/50 hover:border-amber-400 bg-dark-900/70 hover:bg-dark-900 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group">
              <i class="fa-solid fa-cloud-arrow-up text-2xl text-brand group-hover:text-amber-400 transition-colors"></i>
              <span class="text-xs font-black text-white">اضغط هنا لرفع صورة إشعار التحويل من ${escapeHtml(activeWallet.nameAr)}</span>
              <span class="text-[10px] text-slate-400">يدعم لقطات الشاشة من جيب / ون كاش / موبايل موني / جوالي (PNG / JPG / WEBP)</span>
            </button>
          `
          }

          ${aiResultHtml}

          <button type="button" onclick="window.TadhkiraAuth.analyzeAndVerifyReceipt()" ${isAnalyzingReceipt || !selectedReceiptBase64 ? 'disabled' : ''} class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand via-sky-400 to-emerald-400 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-dark-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/20 active:scale-95">
            <i class="fa-solid ${isAnalyzingReceipt ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'}"></i>
            <span>${isAnalyzingReceipt ? `جاري فحص إشعار ${escapeHtml(activeWallet.nameAr)} بالذكاء الاصطناعي...` : `تحليل إشعار ${escapeHtml(activeWallet.nameAr)} وتفعيل (${amount.toLocaleString('en-US')} ريال) فوراً`}</span>
          </button>
        </div>

        <!-- Step 3B: Manual Backup Confirmation Form -->
        <form onsubmit="window.TadhkiraAuth.submitJaibPayment(event)" class="space-y-3 p-4 rounded-2xl bg-dark-950/90 border border-dark-border">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-bold text-slate-300">أو أرسل رقم العملية يدوياً للمراجعة (${escapeHtml(activeWallet.nameAr)}):</h4>
            <img src="${activeWallet.logo}" alt="${escapeHtml(activeWallet.nameAr)}" class="w-5 h-5 rounded-md object-cover border border-white/15 shrink-0" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label for="jaibSenderPhone" class="block text-[11px] font-bold text-slate-300 mb-1">رقمك الذي حوّلت منه *</label>
              <input id="jaibSenderPhone" type="tel" required minlength="7" maxlength="20" value="${escapeHtml(draftSenderPhone)}" oninput="window.TadhkiraAuth && void 0" placeholder="مثال: 771234567" class="w-full bg-dark-900 border border-dark-border focus:border-brand rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none" />
            </div>
            <div>
              <label for="jaibTransactionRef" class="block text-[11px] font-bold text-slate-300 mb-1">رقم العملية / الحوالة في ${escapeHtml(activeWallet.nameAr)} *</label>
              <input id="jaibTransactionRef" type="text" required minlength="3" maxlength="80" value="${escapeHtml(draftTransactionRef)}" placeholder="رقم المرجع من إشعار ${escapeHtml(activeWallet.nameAr)}" class="w-full bg-dark-900 border border-dark-border focus:border-brand rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label for="jaibPaymentNote" class="block text-[11px] font-bold text-slate-300 mb-1">ملاحظة إضافية (اختياري)</label>
            <input id="jaibPaymentNote" type="text" maxlength="200" value="${escapeHtml(draftPaymentNote)}" placeholder="اسم المرسل أو وقت التحويل..." class="w-full bg-dark-900 border border-dark-border focus:border-brand rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none" />
          </div>

          <button id="submitJaibPaymentBtn" type="submit" ${isSubmittingPayment ? 'disabled' : ''} class="w-full py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-amber-400 hover:text-dark-950 text-amber-300 border border-amber-400/40 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
            <i class="fa-solid ${isSubmittingPayment ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}"></i>
            <span>${latestPending ? `إرسال رقم عملية جديد عبر ${escapeHtml(activeWallet.nameAr)}` : `إرسال تأكيد يدوي (${escapeHtml(activeWallet.nameAr)} • ${amount.toLocaleString('en-US')} ريال)`}</span>
          </button>
        </form>
      </div>
    </div>
  `;
}

async function submitJaibPayment(event?: Event) {
  if (event) event.preventDefault();
  if (isSubmittingPayment) return;

  const user = auth.currentUser;
  if (!user) {
    openAuthGateModal();
    return;
  }

  capturePaymentDraftInputs();
  const phoneInput = document.getElementById('jaibSenderPhone') as HTMLInputElement | null;
  const refInput = document.getElementById('jaibTransactionRef') as HTMLInputElement | null;
  const noteInput = document.getElementById('jaibPaymentNote') as HTMLInputElement | null;

  const senderPhone = (phoneInput?.value || draftSenderPhone || '').trim();
  const transactionRef = (refInput?.value || draftTransactionRef || '').trim();
  const note = (noteInput?.value || draftPaymentNote || '').trim().slice(0, 250);
  const activeWallet = getWalletMeta(selectedWalletChoice);

  if (!/^[0-9+\s\-]{7,20}$/.test(senderPhone)) {
    toast('⚠️ يرجى إدخال رقم هاتف صحيح (7 أرقام على الأقل)');
    phoneInput?.focus();
    return;
  }
  if (transactionRef.length < 3 || transactionRef.length > 80) {
    toast(`⚠️ يرجى إدخال رقم العملية / الحوالة من ${activeWallet.nameAr} (3 أحرف على الأقل)`);
    refInput?.focus();
    return;
  }

  isSubmittingPayment = true;
  renderSubscriptionModalContent();

  try {
    const profile = currentUserProfile || (await getOrCreateTicket(user));
    const plan = selectedPlanChoice;
    const amount: 500 | 5000 = plan === 'yearly' ? 5000 : 500;
    const requestId = `req_${user.uid.slice(0, 12)}_${Date.now()}`;
    const reqDocRef = doc(db, 'paymentRequests', requestId);

    const payload: Record<string, any> = {
      requestId,
      uid: user.uid,
      displayName: (profile.displayName || user.displayName || 'مشترك VIP').slice(0, 120),
      userEmail: (profile.email || user.email || '').slice(0, 160),
      formattedTicket: (profile.formattedTicket || '#VIP').slice(0, 20),
      plan,
      amount,
      currency: 'YER',
      walletNumber: JAIB_WALLET_NUMBER,
      walletProvider: activeWallet.id,
      senderPhone,
      transactionRef,
      status: 'pending',
      adminNote: null,
      reviewedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (note) {
      payload.note = note;
    }

    try {
      await runTransaction(db, async (tx) => {
        tx.set(reqDocRef, payload);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `paymentRequests/${requestId}`);
    }

    draftSenderPhone = '';
    draftTransactionRef = '';
    draftPaymentNote = '';
    toast(`✅ تم إرسال تأكيد الدفع عبر ${activeWallet.nameAr} بنجاح! سيتم التفعيل فور مراجعة الحوالة.`);
  } catch (err: any) {
    toast('⚠️ تعذر إرسال الطلب: تأكد من الاتصال بالإنترنت وحاول مجدداً.');
  } finally {
    isSubmittingPayment = false;
    renderSubscriptionModalContent();
  }
}

// =========================================================================
// ADMIN DASHBOARD (qtabm769@gmail.com only)
// =========================================================================
async function openAdminPanelModal() {
  if (!isAdminUser()) {
    toast('⛔ هذه اللوحة مخصصة لإدارة المنصة فقط');
    return;
  }

  let modal = document.getElementById('adminPanelModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminPanelModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto';
    modal.onclick = (e) => {
      if (e.target === modal) closeAdminPanelModal();
    };
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
  renderAdminPanelContent();

  // Also load users list when opening admin panel
  loadAdminUsersList();
}

function closeAdminPanelModal() {
  const modal = document.getElementById('adminPanelModal');
  if (modal) modal.classList.add('hidden');
}

function switchAdminTab(tab: 'requests' | 'users') {
  activeAdminTab = tab;
  if (tab === 'users' && adminAllUsers.length === 0) {
    loadAdminUsersList();
  }
  renderAdminPanelContent();
}

function setAdminRequestFilter(filter: 'pending' | 'all' | 'approved' | 'rejected') {
  activeAdminRequestFilter = filter;
  renderAdminPanelContent();
}

function filterAdminUsers(term: string) {
  adminUserSearchTerm = term || '';
  renderAdminPanelContent();
}

function filterAdminPageUsers(term: string) {
  adminUserSearchTerm = term || '';
  renderAdminUsersPageListOnly();
}

function copyUserEmail(email: string) {
  if (!email) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(email).catch(() => {});
  }
  toast(`📋 تم نسخ البريد: <span class="font-mono text-brand">${escapeHtml(email)}</span>`);
}

function requestDeleteAdminUser(targetUid: string) {
  if (!isAdminUser()) return;
  if (targetUid === auth.currentUser?.uid) {
    toast('⚠️ لا يمكن إلغاء حساب الإدارة الحالي');
    return;
  }
  confirmDeleteUserUid = targetUid;
  renderAdminUsersPageListOnly();
  const adminModal = document.getElementById('adminPanelModal');
  if (adminModal && !adminModal.classList.contains('hidden')) {
    renderAdminPanelContent();
  }
}

function cancelDeleteAdminUser() {
  confirmDeleteUserUid = null;
  renderAdminUsersPageListOnly();
  const adminModal = document.getElementById('adminPanelModal');
  if (adminModal && !adminModal.classList.contains('hidden')) {
    renderAdminPanelContent();
  }
}

async function confirmAndDeleteAdminUser(targetUid: string) {
  if (!isAdminUser()) return;
  if (!targetUid || targetUid === auth.currentUser?.uid) {
    toast('⚠️ لا يمكن إلغاء حساب الإدارة الحالي');
    return;
  }

  const targetUser = adminAllUsers.find((u) => u.uid === targetUid);
  const label = targetUser ? `${targetUser.displayName} (${targetUser.formattedTicket})` : targetUid;
  deletingUserUid = targetUid;
  renderAdminUsersPageListOnly();

  try {
    await deleteDoc(doc(db, 'users', targetUid));
    confirmDeleteUserUid = null;
    deletingUserUid = null;
    adminAllUsers = adminAllUsers.filter((u) => u.uid !== targetUid);
    updateAdminUsersBadgeCount();
    renderAdminUsersPageListOnly();
    const adminModal = document.getElementById('adminPanelModal');
    if (adminModal && !adminModal.classList.contains('hidden')) {
      renderAdminPanelContent();
    }
    toast(`🗑️ تم إلغاء وحذف المستخدم ${escapeHtml(label)} بنجاح`);
  } catch (err) {
    deletingUserUid = null;
    renderAdminUsersPageListOnly();
    try {
      handleFirestoreError(err, OperationType.DELETE, `users/${targetUid}`);
    } catch (_) {}
    toast('⚠️ تعذر إلغاء المستخدم — تأكد من تحديث صلاحيات قاعدة البيانات وحاول مجدداً');
  }
}

async function refreshAdminUsersList() {
  await loadAdminUsersList();
  toast(`🔄 تم تحديث قائمة المسجلين (${adminAllUsers.length} مستخدم)`);
}

async function loadAdminUsersList() {
  if (!isAdminUser()) return;
  isAdminUsersLoading = true;
  adminUsersErrorMsg = null;
  if (document.getElementById('adminUsersPageRoot')) {
    renderAdminUsersPageListOnly();
  }
  try {
    const qUsers = query(collection(db, 'users'), limit(500));
    const snap = await getDocs(qUsers);
    const list: UserTicketProfile[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push(normalizeProfile({ ...data, uid: data?.uid || d.id }));
    });
    list.sort((a, b) => (b.ticketNumber || 0) - (a.ticketNumber || 0));
    adminAllUsers = list;
    isAdminUsersLoading = false;
    adminUsersErrorMsg = null;
    updateAdminUsersBadgeCount();
    renderAdminPanelContent();
    if (document.getElementById('adminUsersPageRoot')) {
      renderAdminUsersPageListOnly();
    }
  } catch (err: any) {
    isAdminUsersLoading = false;
    adminUsersErrorMsg = String(err?.code || err?.message || 'error');
    if (document.getElementById('adminUsersPageRoot')) {
      renderAdminUsersPageListOnly();
    }
    try {
      handleFirestoreError(err, OperationType.LIST, 'users');
    } catch (_) {}
  }
}

async function approvePaymentRequest(requestId: string) {
  if (!isAdminUser()) return;
  const req = adminAllRequests.find((r) => r.requestId === requestId);
  if (!req) return;

  const days = req.plan === 'yearly' ? 365 : 30;
  const targetUserRef = doc(db, 'users', req.uid);
  const reqRef = doc(db, 'paymentRequests', req.requestId);

  try {
    // Check if user already has remaining active time to extend from, otherwise start from now
    let baseMs = Date.now();
    try {
      const userSnap = await getDoc(targetUserRef);
      if (userSnap.exists()) {
        const u = normalizeProfile(userSnap.data());
        const curExp = u.subscriptionExpiresMs ?? parseTimestampMs(u.subscriptionExpiresAt);
        if (u.subscriptionStatus === 'active' && curExp && curExp > baseMs) {
          baseMs = curExp;
        }
      }
    } catch (_) {}

    const newExpiresAt = Timestamp.fromMillis(baseMs + days * 24 * 60 * 60 * 1000);
    const batch = writeBatch(db);

    batch.update(reqRef, {
      status: 'approved',
      reviewedBy: auth.currentUser?.email || ADMIN_EMAIL,
      adminNote: `تم تأكيد التحويل وتفعيل ${days} يوم`,
      updatedAt: serverTimestamp(),
    });

    batch.update(targetUserRef, {
      subscriptionStatus: 'active',
      subscriptionPlan: req.plan,
      subscriptionExpiresAt: newExpiresAt,
      activatedBy: auth.currentUser?.email || ADMIN_EMAIL,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    toast(`✅ تم تفعيل اشتراك ${escapeHtml(req.displayName)} (${days} يوم) بنجاح!`);
    loadAdminUsersList();
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, `paymentRequests/${requestId}`);
    } catch (_) {}
    toast('⚠️ حدث خطأ أثناء التفعيل');
  }
}

async function rejectPaymentRequest(requestId: string) {
  if (!isAdminUser()) return;
  const reqRef = doc(db, 'paymentRequests', requestId);
  const noteEl = document.getElementById(`rejectNote_${requestId}`) as HTMLInputElement | null;
  const noteVal = (noteEl?.value || 'لم يتم العثور على حوالة مطابقة لرقم العملية').trim().slice(0, 250);

  try {
    await updateDoc(reqRef, {
      status: 'rejected',
      reviewedBy: auth.currentUser?.email || ADMIN_EMAIL,
      adminNote: noteVal,
      updatedAt: serverTimestamp(),
    });
    toast('❌ تم رفض الطلب وتسجيل السبب للمستخدم');
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, `paymentRequests/${requestId}`);
    } catch (_) {}
    toast('⚠️ تعذر تحديث حالة الطلب');
  }
}

async function adminSetUserSubscription(targetUid: string, action: 'monthly' | 'yearly' | 'revoke') {
  if (!isAdminUser()) return;
  const userRef = doc(db, 'users', targetUid);

  try {
    if (action === 'revoke') {
      await updateDoc(userRef, {
        subscriptionStatus: 'expired',
        subscriptionExpiresAt: null,
        activatedBy: auth.currentUser?.email || ADMIN_EMAIL,
        updatedAt: serverTimestamp(),
      });
      toast('🔒 تم إيقاف اشتراك المستخدم');
    } else {
      const days = action === 'yearly' ? 365 : 30;
      const exp = Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionPlan: action,
        subscriptionExpiresAt: exp,
        activatedBy: auth.currentUser?.email || ADMIN_EMAIL,
        updatedAt: serverTimestamp(),
      });
      toast(`✅ تم تفعيل ${action === 'yearly' ? 'باقة سنة (365 يوم)' : 'باقة شهر (30 يوم)'} للمستخدم!`);
    }
    loadAdminUsersList();
    if (document.getElementById('adminUsersPageRoot')) {
      renderAdminUsersPageListOnly();
    }
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
    } catch (_) {}
    toast('⚠️ تعذر تعديل اشتراك المستخدم');
  }
}

function getUserRowStatusInfo(u: UserTicketProfile) {
  const now = Date.now();
  const isRowAdmin = isAdminEmailMatch(u.email);
  const expMs = u.subscriptionExpiresMs ?? parseTimestampMs(u.subscriptionExpiresAt);
  const trialStart = u.trialStartedMs ?? parseTimestampMs(u.trialStartedAt);
  const isPaidActive = Boolean(u.subscriptionStatus === 'active' && expMs && expMs > now);
  const trialEndMs = trialStart ? trialStart + TRIAL_DURATION_MS : null;
  const isTrialActive = Boolean(!isPaidActive && trialEndMs && trialEndMs > now);

  if (isRowAdmin) {
    return {
      kind: 'admin' as const,
      badgeHtml: `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-dark-950">👑 إدارة المنصة</span>`,
      subText: 'صلاحيات كاملة غير محدودة',
      expMs: null,
      trialEndMs,
    };
  }
  if (isPaidActive && expMs) {
    const planText = u.subscriptionPlan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري';
    return {
      kind: 'paid' as const,
      badgeHtml: `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">💎 ${planText} • متبقي ${escapeHtml(formatRemainingDuration(expMs - now))}</span>`,
      subText: `ينتهي في: ${formatArabicDate(expMs)}`,
      expMs,
      trialEndMs,
    };
  }
  if (isTrialActive && trialEndMs) {
    return {
      kind: 'trial' as const,
      badgeHtml: `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/35">🎁 يوم مجاني • متبقي ${escapeHtml(formatRemainingDuration(trialEndMs - now))}</span>`,
      subText: `تنتهي التجربة: ${formatArabicDate(trialEndMs)}`,
      expMs: null,
      trialEndMs,
    };
  }
  return {
    kind: 'expired' as const,
    badgeHtml: `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">🔒 منتهي / غير مشترك</span>`,
    subText: expMs ? `انتهى في: ${formatArabicDate(expMs)}` : trialEndMs ? `انتهت التجربة: ${formatArabicDate(trialEndMs)}` : 'بانتظار التفعيل',
    expMs,
    trialEndMs,
  };
}

function renderAdminUsersPageListOnly() {
  const statsBar = document.getElementById('adminUsersStatsBar');
  const listBody = document.getElementById('adminUsersListBody');
  if (!listBody) return;

  const now = Date.now();
  let paidCount = 0;
  let trialCount = 0;
  let expiredCount = 0;

  adminAllUsers.forEach((u) => {
    const info = getUserRowStatusInfo(u);
    if (info.kind === 'paid' || info.kind === 'admin') paidCount++;
    else if (info.kind === 'trial') trialCount++;
    else expiredCount++;
  });

  if (statsBar) {
    statsBar.innerHTML = `
      <div class="p-3 rounded-2xl bg-dark-950/90 border border-amber-400/30">
        <span class="block text-[10px] text-slate-400 font-bold">إجمالي المسجلين بـ Google</span>
        <span class="text-lg sm:text-xl font-black text-amber-300 font-mono">${adminAllUsers.length}</span>
      </div>
      <div class="p-3 rounded-2xl bg-dark-950/90 border border-emerald-500/30">
        <span class="block text-[10px] text-slate-400 font-bold">مشتركين فعّالين (VIP)</span>
        <span class="text-lg sm:text-xl font-black text-emerald-400 font-mono">${paidCount}</span>
      </div>
      <div class="p-3 rounded-2xl bg-dark-950/90 border border-sky-500/30">
        <span class="block text-[10px] text-slate-400 font-bold">فترة مجانية (24 ساعة)</span>
        <span class="text-lg sm:text-xl font-black text-sky-400 font-mono">${trialCount}</span>
      </div>
      <div class="p-3 rounded-2xl bg-dark-950/90 border border-rose-500/30">
        <span class="block text-[10px] text-slate-400 font-bold">منتهي / بانتظار التفعيل</span>
        <span class="text-lg sm:text-xl font-black text-rose-400 font-mono">${expiredCount}</span>
      </div>
    `;
  }

  const term = adminUserSearchTerm.trim().toLowerCase();
  const filteredUsers = term
    ? adminAllUsers.filter(
        (u) =>
          u.displayName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.formattedTicket.toLowerCase().includes(term) ||
          u.uid.toLowerCase().includes(term)
      )
    : adminAllUsers;

  if (isAdminUsersLoading && adminAllUsers.length === 0) {
    listBody.innerHTML = `
      <div class="py-16 text-center text-xs text-slate-400 space-y-2 bg-dark-900/70 rounded-2xl border border-dark-border">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-amber-400"></i>
        <p class="font-bold text-white">جاري تحميل قائمة المسجلين بحسابات Google...</p>
      </div>
    `;
    return;
  }

  if (adminUsersErrorMsg && filteredUsers.length === 0) {
    listBody.innerHTML = `
      <div class="py-12 px-4 text-center text-xs text-rose-200 bg-rose-950/30 rounded-2xl border border-rose-500/40 space-y-3">
        <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-400"></i>
        <p class="font-bold">تعذر جلب قائمة المسجلين من قاعدة البيانات (${escapeHtml(adminUsersErrorMsg)})</p>
        <button onclick="window.TadhkiraAuth.refreshAdminUsersList()" class="px-4 py-2 rounded-xl bg-amber-400 text-dark-950 font-black text-xs cursor-pointer">
          إعادة المحاولة
        </button>
      </div>
    `;
    return;
  }

  if (filteredUsers.length === 0) {
    listBody.innerHTML = `
      <div class="py-14 text-center text-xs text-slate-400 bg-dark-900/70 rounded-2xl border border-dark-border space-y-2">
        <i class="fa-solid fa-users-slash text-2xl text-slate-500"></i>
        <p class="font-bold text-slate-300">${term ? 'لا يوجد مستخدمون مطابقون لبحثك.' : 'لا يوجد مسجلون بحسابات Google حتى الآن.'}</p>
      </div>
    `;
    return;
  }

  listBody.innerHTML = filteredUsers
    .map((u, idx) => {
      const info = getUserRowStatusInfo(u);
      const createdMs = u.createdAtMs ?? parseTimestampMs(u.createdAt) ?? u.trialStartedMs ?? parseTimestampMs(u.trialStartedAt);
      const isSelfAdmin = u.uid === auth.currentUser?.uid || isAdminEmailMatch(u.email);
      const isConfirmingDelete = confirmDeleteUserUid === u.uid;
      const isDeletingThis = deletingUserUid === u.uid;
      const safeUid = escapeHtml(u.uid);
      const rowBorder =
        info.kind === 'admin'
          ? 'border-amber-400/60 bg-gradient-to-l from-amber-500/10 via-dark-900 to-dark-950'
          : info.kind === 'paid'
          ? 'border-emerald-500/40 bg-dark-900/95'
          : info.kind === 'trial'
          ? 'border-sky-500/35 bg-dark-900/90'
          : 'border-dark-border bg-dark-950/90';

      return `
        <div class="p-3.5 sm:p-4 rounded-2xl border ${rowBorder} shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <!-- User Google Identity, Ticket & Full Details -->
          <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div class="relative shrink-0">
              <img src="${u.photoURL || '/icon.svg'}" alt="${escapeHtml(u.displayName)}" class="w-12 h-12 rounded-2xl border-2 ${info.kind === 'paid' || info.kind === 'admin' ? 'border-amber-400' : 'border-dark-border'} object-cover shadow" onerror="this.src='/icon.svg'" />
              <span class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-dark-950 border border-dark-border text-[9px] font-mono font-bold text-slate-300">#${idx + 1}</span>
            </div>

            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded-lg bg-amber-400 text-dark-950 font-black text-xs font-mono shadow-sm">${escapeHtml(u.formattedTicket)}</span>
                <h3 class="text-sm sm:text-base font-black text-white truncate">${escapeHtml(u.displayName)}</h3>
                ${info.badgeHtml}
              </div>

              <div class="flex items-center gap-2 flex-wrap text-xs">
                <span class="inline-flex items-center gap-1.5 text-brand font-mono font-semibold break-all select-all">
                  <i class="fa-brands fa-google text-[11px] text-amber-300"></i>
                  <span>${escapeHtml(u.email || 'بدون بريد')}</span>
                </span>
                ${
                  u.email
                    ? `<button onclick="window.TadhkiraAuth.copyUserEmail('${escapeHtml(u.email)}')" class="px-1.5 py-0.5 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 text-[10px] cursor-pointer" title="نسخ البريد الإلكتروني"><i class="fa-regular fa-copy"></i></button>`
                    : ''
                }
              </div>

              <div class="flex items-center gap-x-4 gap-y-1 flex-wrap text-[11px] text-slate-400 pt-0.5">
                <span><i class="fa-regular fa-calendar-plus text-slate-500 ml-1"></i>تاريخ التسجيل: <strong class="text-slate-200">${formatArabicDate(createdMs)}</strong></span>
                <span><i class="fa-regular fa-clock text-slate-500 ml-1"></i>الحالة: <strong class="text-slate-200">${escapeHtml(info.subText)}</strong></span>
                ${
                  u.activatedBy
                    ? `<span><i class="fa-solid fa-user-shield text-amber-400 ml-1"></i>التفعيل بواسطة: <strong class="text-amber-300">${escapeHtml(u.activatedBy)}</strong></span>`
                    : ''
                }
              </div>
            </div>
          </div>

          <!-- Side-by-side Action Buttons: تفعيل شهر | تفعيل سنة | إلغاء المستخدم -->
          <div class="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            ${
              isConfirmingDelete
                ? `
              <div class="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 flex flex-wrap items-center gap-2 text-xs">
                <span class="font-bold text-rose-200">تأكيد إلغاء وحذف ${escapeHtml(u.formattedTicket)}؟</span>
                <button
                  onclick="window.TadhkiraAuth.confirmAndDeleteAdminUser('${safeUid}')"
                  ${isDeletingThis ? 'disabled' : ''}
                  class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow disabled:opacity-60"
                >
                  <i class="fa-solid ${isDeletingThis ? 'fa-spinner fa-spin' : 'fa-trash-can'}"></i>
                  <span>${isDeletingThis ? 'جاري الحذف...' : 'نعم، إلغاء المستخدم'}</span>
                </button>
                <button
                  onclick="window.TadhkiraAuth.cancelDeleteAdminUser()"
                  ${isDeletingThis ? 'disabled' : ''}
                  class="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 font-bold text-xs cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            `
                : `
              <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onclick="window.TadhkiraAuth.adminSetUserSubscription('${safeUid}', 'monthly')"
                  class="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-brand hover:brightness-110 text-dark-950 font-black text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <i class="fa-solid fa-calendar-check"></i>
                  <span>تفعيل شهر</span>
                </button>
                <button
                  onclick="window.TadhkiraAuth.adminSetUserSubscription('${safeUid}', 'yearly')"
                  class="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-black text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <i class="fa-solid fa-crown"></i>
                  <span>تفعيل سنة</span>
                </button>
                ${
                  isSelfAdmin
                    ? `<span class="px-3 py-2 rounded-xl bg-dark-800 border border-amber-400/30 text-amber-300 text-[11px] font-bold whitespace-nowrap">حساب الإدارة</span>`
                    : `<button
                        onclick="window.TadhkiraAuth.requestDeleteAdminUser('${safeUid}')"
                        class="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                      >
                        <i class="fa-solid fa-user-xmark"></i>
                        <span>إلغاء المستخدم</span>
                      </button>`
                }
              </div>
            `
            }
          </div>
        </div>
      `;
    })
    .join('');
}

function renderAdminUsersPageSection() {
  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;

  if (!isAdminUser()) {
    if (typeof (window as any).switchNavTab === 'function') {
      (window as any).switchNavTab('all');
    }
    return;
  }

  const pendingReqCount = adminAllRequests.filter((r) => r.status === 'pending').length;

  container.innerHTML = `
    <section id="adminUsersPageRoot" class="w-full space-y-5">
      <!-- Top Admin Header Card -->
      <div class="rounded-3xl bg-gradient-to-br from-amber-500/20 via-dark-900 to-brand/15 border border-amber-400/50 p-4 sm:p-6 shadow-2xl space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-dark-950 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25 shrink-0">
              👑
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg sm:text-xl font-black text-white">المسجلين بحسابات Google وإدارة التذاكر VIP</h2>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">${ADMIN_EMAIL}</span>
              </div>
              <p class="text-xs sm:text-[13px] text-slate-300">
                قائمة مباشرة بجميع الحسابات المسجلة بـ Google مرتبة واحداً تلو الآخر مع رقم التذكرة وتفاصيل الاشتراك وأزرار التفعيل الفوري أو إلغاء المستخدم.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap shrink-0">
            <button onclick="window.TadhkiraAuth.refreshAdminUsersList()" class="px-3.5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-brand border border-brand/40 text-xs font-black flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-rotate"></i>
              <span>تحديث القائمة</span>
            </button>
            <button onclick="window.TadhkiraAuth.openAdminPanelModal()" class="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow">
              <i class="fa-solid fa-wallet"></i>
              <span>طلبات جيب ${pendingReqCount > 0 ? `(${pendingReqCount})` : ''}</span>
            </button>
            <button onclick="switchNavTab('all')" class="px-3.5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-border text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-arrow-right"></i>
              <span>العودة للموقع</span>
            </button>
          </div>
        </div>

        <!-- Summary Stats -->
        <div id="adminUsersStatsBar" class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs"></div>

        <!-- Search Filter -->
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            id="adminPageUserSearchInput"
            type="text"
            value="${escapeHtml(adminUserSearchTerm)}"
            oninput="window.TadhkiraAuth.filterAdminPageUsers(this.value)"
            placeholder="ابحث بالاسم، البريد الإلكتروني (Gmail)، أو رقم التذكرة (#0001)..."
            class="w-full bg-dark-950 border border-dark-border focus:border-amber-400 rounded-2xl pr-10 pl-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none shadow-inner"
          />
        </div>
      </div>

      <!-- Vertical Stacked Users List (One under Another) -->
      <div id="adminUsersListBody" class="flex flex-col gap-3"></div>
    </section>
  `;

  renderAdminUsersPageListOnly();
  if (adminAllUsers.length === 0) {
    loadAdminUsersList();
  }
}

function renderAdminPanelContent() {
  const modal = document.getElementById('adminPanelModal');
  if (!modal) return;

  const pendingCount = adminAllRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = adminAllRequests.filter((r) => r.status === 'approved').length;

  const filteredRequests =
    activeAdminRequestFilter === 'all'
      ? adminAllRequests
      : adminAllRequests.filter((r) => r.status === activeAdminRequestFilter);

  const term = adminUserSearchTerm.trim().toLowerCase();
  const filteredUsers = term
    ? adminAllUsers.filter(
        (u) =>
          u.displayName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.formattedTicket.toLowerCase().includes(term)
      )
    : adminAllUsers;

  modal.innerHTML = `
    <div class="relative w-full max-w-3xl bg-dark-900 border border-amber-400/50 rounded-3xl shadow-2xl overflow-hidden my-auto text-right">
      <div class="px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-dark-950 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-dark-950/15 flex items-center justify-center text-lg font-black">👑</div>
          <div>
            <h2 class="text-base sm:text-lg font-black">لوحة إدارة الاشتراكات وطلبات المحافظ اليمنية</h2>
            <p class="text-[11px] font-bold text-amber-950/80">حساب الاستلام الموحد: ${JAIB_WALLET_NUMBER} • معلق: ${pendingCount} | مفعّل: ${approvedCount}</p>
          </div>
        </div>
        <button onclick="window.TadhkiraAuth.closeAdminPanelModal()" class="w-8 h-8 rounded-full bg-dark-950/20 hover:bg-dark-950/35 text-dark-950 flex items-center justify-center cursor-pointer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div class="px-5 pt-3 bg-dark-950 border-b border-dark-border flex items-center gap-2">
        <button onclick="window.TadhkiraAuth.switchAdminTab('requests')" class="px-4 py-2 rounded-t-xl text-xs font-black transition-all cursor-pointer ${activeAdminTab === 'requests' ? 'bg-dark-900 text-amber-400 border-t border-x border-amber-400/40' : 'text-slate-400 hover:text-white'}">
          💳 طلبات الدفع (المحافظ) ${pendingCount > 0 ? `<span class="mr-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">${pendingCount}</span>` : ''}
        </button>
        <button onclick="window.TadhkiraAuth.switchAdminTab('users')" class="px-4 py-2 rounded-t-xl text-xs font-black transition-all cursor-pointer ${activeAdminTab === 'users' ? 'bg-dark-900 text-brand border-t border-x border-brand/40' : 'text-slate-400 hover:text-white'}">
          👥 إدارة المشتركين (${adminAllUsers.length})
        </button>
      </div>

      <div class="p-4 sm:p-5 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-3">
        ${
          activeAdminTab === 'requests'
            ? `
          <div class="flex items-center gap-1.5 flex-wrap pb-2">
            ${(['pending', 'approved', 'rejected', 'all'] as const)
              .map((f) => {
                const labels = { pending: `معلق (${pendingCount})`, approved: 'مفعّل', rejected: 'مرفوض', all: 'الكل' };
                const active = activeAdminRequestFilter === f;
                return `<button onclick="window.TadhkiraAuth.setAdminRequestFilter('${f}')" class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${active ? 'bg-amber-400 text-dark-950 font-black' : 'bg-dark-800 text-slate-300 hover:bg-dark-700'}">${labels[f]}</button>`;
              })
              .join('')}
          </div>

          ${
            filteredRequests.length === 0
              ? '<div class="py-12 text-center text-xs text-slate-400">لا توجد طلبات دفع في هذا القسم حالياً.</div>'
              : filteredRequests
                  .map((r) => {
                    const isPending = r.status === 'pending';
                    const reqWallet = getWalletMeta(r.walletProvider);
                    const statusTag = isPending
                      ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300">⏳ قيد المراجعة</span>'
                      : r.status === 'approved'
                      ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300">✅ مفعّل</span>'
                      : '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300">❌ مرفوض</span>';

                    return `
                <div class="p-3.5 rounded-2xl bg-dark-950 border ${isPending ? 'border-amber-400/50' : 'border-dark-border'} space-y-2.5 text-xs">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded bg-amber-400 text-dark-950 font-black text-[10px]">${escapeHtml(r.formattedTicket)}</span>
                      <span class="font-black text-white">${escapeHtml(r.displayName)}</span>
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${reqWallet.badgeClass}">
                        <img src="${reqWallet.logo}" alt="${escapeHtml(reqWallet.nameAr)}" class="w-3.5 h-3.5 rounded-sm object-cover" />
                        <span>${escapeHtml(reqWallet.nameAr)}</span>
                      </span>
                      <span class="text-[11px] text-slate-400">${escapeHtml(r.userEmail)}</span>
                    </div>
                    ${statusTag}
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-dark-900 p-2.5 rounded-xl border border-dark-border/60">
                    <div>الباقة: <strong class="text-amber-300">${r.plan === 'yearly' ? 'سنة (5,000)' : 'شهر (500)'}</strong></div>
                    <div>هاتف المرسل: <strong class="font-mono text-white">${escapeHtml(r.senderPhone)}</strong></div>
                    <div>رقم العملية: <strong class="font-mono text-brand select-all">${escapeHtml(r.transactionRef)}</strong></div>
                    <div>الوقت: <span class="text-slate-400">${formatArabicDate(parseTimestampMs(r.createdAt))}</span></div>
                  </div>
                  ${r.aiVerified ? `<div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between gap-2 flex-wrap"><span>🤖 <strong>موثّق بالذكاء الاصطناعي</strong> (${r.aiConfidence || 90}%): ${escapeHtml(r.aiReason || 'تم تأكيد التحويل إلى 779676636')}</span><span class="font-mono text-[10px]">المبلغ: ${r.aiDetectedAmount || r.amount} ريال</span></div>` : ''}
                  ${r.note ? `<p class="text-[11px] text-slate-300">ملاحظة المرسل: ${escapeHtml(r.note)}</p>` : ''}
                  ${
                    isPending
                      ? `
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button onclick="window.TadhkiraAuth.approvePaymentRequest('${escapeHtml(r.requestId)}')" class="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs cursor-pointer flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>تأكيد الدفع وتفعيل الاشتراك (${r.plan === 'yearly' ? '365 يوم' : '30 يوم'})</span>
                      </button>
                      <div class="flex items-center gap-1.5">
                        <input id="rejectNote_${escapeHtml(r.requestId)}" type="text" placeholder="سبب الرفض (اختياري)" class="bg-dark-900 border border-dark-border rounded-xl px-2.5 py-2 text-[11px] text-white w-40" />
                        <button onclick="window.TadhkiraAuth.rejectPaymentRequest('${escapeHtml(r.requestId)}')" class="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 font-bold text-xs cursor-pointer">
                          رفض
                        </button>
                      </div>
                    </div>
                  `
                      : r.adminNote
                      ? `<p class="text-[10.5px] text-slate-400">ملاحظة المراجعة: ${escapeHtml(r.adminNote)}</p>`
                      : ''
                  }
                </div>
              `;
                  })
                  .join('')
          }
        `
            : `
          <div class="flex items-center gap-2 pb-2">
            <input type="text" value="${escapeHtml(adminUserSearchTerm)}" oninput="window.TadhkiraAuth.filterAdminUsers(this.value)" placeholder="ابحث بالاسم أو الإيميل أو رقم التذكرة (#0001)..." class="flex-1 bg-dark-950 border border-dark-border focus:border-brand rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none" />
          </div>
          ${
            filteredUsers.length === 0
              ? '<div class="py-10 text-center text-xs text-slate-400">لا يوجد مستخدمون مطابقون للبحث.</div>'
              : filteredUsers
                  .map((u) => {
                    const now = Date.now();
                    const expMs = u.subscriptionExpiresMs;
                    const trialStart = u.trialStartedMs;
                    const isPaidActive = u.subscriptionStatus === 'active' && expMs && expMs > now;
                    const isTrialActive = !isPaidActive && trialStart && trialStart + TRIAL_DURATION_MS > now;
                    const badge = isPaidActive
                      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300">💎 مشترك (${formatRemainingDuration(expMs! - now)})</span>`
                      : isTrialActive
                      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300">🎁 يوم مجاني (${formatRemainingDuration(trialStart! + TRIAL_DURATION_MS - now)})</span>`
                      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-700 text-slate-300">🔒 منتهي</span>`;

                    const isSelfAdmin = u.uid === auth.currentUser?.uid || isAdminEmailMatch(u.email);
                    const isConfirming = confirmDeleteUserUid === u.uid;

                    return `
                <div class="p-3 rounded-2xl bg-dark-950 border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 font-black text-[10px]">${escapeHtml(u.formattedTicket)}</span>
                      <span class="font-bold text-white truncate">${escapeHtml(u.displayName)}</span>
                      ${badge}
                    </div>
                    <div class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(u.email)}</div>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button onclick="window.TadhkiraAuth.adminSetUserSubscription('${escapeHtml(u.uid)}', 'monthly')" class="px-2.5 py-1.5 rounded-xl bg-brand/20 hover:bg-brand/35 text-brand border border-brand/40 text-[11px] font-bold cursor-pointer">تفعيل شهر</button>
                    <button onclick="window.TadhkiraAuth.adminSetUserSubscription('${escapeHtml(u.uid)}', 'yearly')" class="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/35 text-amber-300 border border-amber-400/40 text-[11px] font-bold cursor-pointer">تفعيل سنة</button>
                    ${
                      isSelfAdmin
                        ? ''
                        : isConfirming
                        ? `<button onclick="window.TadhkiraAuth.confirmAndDeleteAdminUser('${escapeHtml(u.uid)}')" class="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-black cursor-pointer">تأكيد الحذف</button><button onclick="window.TadhkiraAuth.cancelDeleteAdminUser()" class="px-2 py-1.5 rounded-xl bg-dark-800 text-slate-300 text-[11px] font-bold cursor-pointer">تراجع</button>`
                        : `<button onclick="window.TadhkiraAuth.requestDeleteAdminUser('${escapeHtml(u.uid)}')" class="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold cursor-pointer">إلغاء المستخدم</button>`
                    }
                  </div>
                </div>
              `;
                  })
                  .join('')
          }
        `
        }
      </div>
    </div>
  `;
}

// Show Domain Guide Modal
function showDomainGuideModal() {
  let modal = document.getElementById('domainGuideModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'domainGuideModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-dark-950/85 backdrop-blur-md transition-all duration-300';
    document.body.appendChild(modal);
  }

  const currentHost = window.location.hostname || 'ticket-vib.netlify.app';
  const consoleLink = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  modal.innerHTML = `
    <div class="relative w-full max-w-lg bg-dark-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-right">
      <button onclick="window.TadhkiraAuth.closeDomainGuideModal()" class="absolute top-4 left-4 w-8 h-8 rounded-full bg-dark-800 text-slate-300 hover:text-white flex items-center justify-center">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg border border-amber-400/40">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-black text-white">خطوة واحدة متبقية لتفعيل الدخول بـ Google</h3>
          <span class="text-xs text-amber-300">إضافة النطاق المعتمد (Authorized Domain)</span>
        </div>
      </div>

      <p class="text-xs text-slate-300 leading-relaxed mb-4">
        تفرض شركة Google لأسباب أمنية إضافة نطاق موقعك في قائمة <b>النطاقات المعتمدة (Authorized Domains)</b> داخل مشروع Firebase ليسمح للمستخدمين بتسجيل الدخول بأمان.
      </p>

      <div class="bg-dark-950 p-3.5 rounded-2xl border border-dark-border mb-4 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-slate-400">النطاق المطلوب إضافته:</span>
          <button onclick="navigator.clipboard.writeText('${currentHost}'); if (typeof showToast === 'function') showToast('تم نسخ النطاق!');" class="text-brand hover:underline font-bold text-[11px] flex items-center gap-1">
            <i class="fa-regular fa-copy"></i> نسخ
          </button>
        </div>
        <div class="p-2 bg-dark-800 rounded-xl font-mono text-amber-300 text-center text-xs select-all">
          ${currentHost}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a href="${consoleLink}" target="_blank" rel="noopener noreferrer" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-center">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <span>فتح إعدادات Firebase Console</span>
        </a>
        <button onclick="window.TadhkiraAuth.closeDomainGuideModal()" class="py-2.5 px-4 rounded-xl bg-dark-800 text-slate-300 text-xs font-bold hover:bg-dark-700">
          إغلاق
        </button>
      </div>
    </div>
  `;
}

function closeDomainGuideModal() {
  const modal = document.getElementById('domainGuideModal');
  if (modal) modal.remove();
}

function showEnableProviderModal() {
  let modal = document.getElementById('enableProviderModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'enableProviderModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-dark-950/85 backdrop-blur-md transition-all duration-300';
    document.body.appendChild(modal);
  }

  const providersLink = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  modal.innerHTML = `
    <div class="relative w-full max-w-lg bg-dark-900 border border-brand/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-right">
      <button onclick="window.TadhkiraAuth.closeEnableProviderModal()" class="absolute top-4 left-4 w-8 h-8 rounded-full bg-dark-800 text-slate-300 hover:text-white flex items-center justify-center">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-brand/20 text-brand flex items-center justify-center text-lg border border-brand/40">
          <i class="fa-brands fa-google"></i>
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-black text-white">تفعيل تسجيل الدخول بحساب Google</h3>
          <span class="text-xs text-brand">خطوة سريعة لمرة واحدة فقط في لوحة تحكم Firebase</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a href="${providersLink}" target="_blank" rel="noopener noreferrer" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand to-cyan-500 text-dark-950 font-black text-xs flex items-center justify-center gap-2 text-center">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <span>فتح صفحة موفري الخدمة في Firebase</span>
        </a>
        <button onclick="window.TadhkiraAuth.closeEnableProviderModal()" class="py-2.5 px-4 rounded-xl bg-dark-800 text-slate-300 text-xs font-bold hover:bg-dark-700">
          إغلاق
        </button>
      </div>
    </div>
  `;
}

function closeEnableProviderModal() {
  const modal = document.getElementById('enableProviderModal');
  if (modal) modal.remove();
}

function setButtonLoading(loading: boolean) {
  const btns = document.querySelectorAll('.google-signin-btn');
  btns.forEach((btn) => {
    const b = btn as HTMLButtonElement;
    if (loading) {
      b.disabled = true;
      b.classList.add('opacity-75', 'cursor-wait');
    } else {
      b.disabled = false;
      b.classList.remove('opacity-75', 'cursor-wait');
    }
  });
}

// Google Sign-In with Popup & Redirect fallback
async function signInWithGoogle() {
  if (isAuthenticating) return;
  isAuthenticating = true;
  setButtonLoading(true);

  toast('<i class="fa-brands fa-google text-brand mr-1.5"></i> جاري تسجيل الدخول بـ Google...');

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    if (result && result.user) {
      closeAuthGateModal();
      await syncTokenClaims(result.user);

      let ticket: UserTicketProfile;
      try {
        const [ticketRes] = await Promise.all([
          getOrCreateTicket(result.user, true),
          syncServerAiSubscription(result.user),
        ]);
        ticket = ticketRes;
      } catch (ticketErr) {
        if (isAdminUser(result.user)) {
          ticket = {
            uid: result.user.uid,
            displayName: result.user.displayName || 'إدارة المنصة 👑',
            email: getEffectiveUserEmail(result.user, null) || ADMIN_EMAIL,
            photoURL: result.user.photoURL || '',
            ticketNumber: 1,
            formattedTicket: '#0001',
            subscriptionStatus: 'active',
            subscriptionPlan: 'yearly',
            trialStartedMs: Date.now(),
          };
          currentUserProfile = ticket;
          syncedProfileUid = result.user.uid;
        } else {
          throw ticketErr;
        }
      }

      startRealtimeListeners(result.user);
      renderAuthUI(result.user, ticket);

      const access = getAccessState();
      if (access.allowed) {
        if (access.reason === 'admin') {
          toast(`👑 أهلاً بك يا مدير المنصة! صلاحياتك الكاملة مفعّلة (${ticket.formattedTicket})`);
        } else if (access.reason === 'trial') {
          toast(`🎉 أهلاً بك! تم تفعيل تذكرتك ${ticket.formattedTicket} + يوم كامل مجاني (24 ساعة)`);
        } else {
          toast(`🎉 أهلاً بك مجدداً! اشتراكك VIP نشط (${ticket.formattedTicket})`);
        }
        if (pendingPlaybackCallback) {
          const cb = pendingPlaybackCallback;
          pendingPlaybackCallback = null;
          pendingPlaybackTitle = '';
          setTimeout(() => cb(), 150);
        } else {
          // Always display the 24h Trial / VIP welcome interface after signing in
          setTimeout(() => openTicketModal(true), 200);
        }
      } else {
        toast(`أهلاً بك! انتهت فترتك المجانية سابقاً — اشترك الآن لمواصلة المشاهدة`);
        if (pendingPlaybackCallback) {
          openSubscriptionModal(pendingPlaybackTitle);
        } else {
          setTimeout(() => openSubscriptionModal(), 200);
        }
      }
    }
  } catch (err: any) {
    console.warn('Google Sign-In response code:', err?.code, err?.message);

    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      toast('تم إغلاق نافذة تسجيل الدخول. يمكنك المحاولة مجدداً في أي وقت.');
      return;
    }

    if (err?.code === 'auth/unauthorized-domain') {
      showDomainGuideModal();
      return;
    }

    if (err?.code === 'auth/operation-not-allowed') {
      showEnableProviderModal();
      return;
    }

    if (err?.code === 'auth/network-request-failed') {
      toast('⚠️ تعذر الاتصال بخوادم Google. تأكد من الإنترنت وحاول مجدداً.');
      return;
    }

    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/web-storage-unsupported') {
      const inIframe = (() => {
        try {
          return window.self !== window.top;
        } catch (_) {
          return true;
        }
      })();
      if (inIframe) {
        toast('⚠️ المتصفح حظر النافذة المنبثقة داخل المعاينة — اسمح بالنوافذ المنبثقة أو افتح الموقع في تبويب مستقل.');
        return;
      }
      toast('⚠️ المتصفح حظر النافذة المنبثقة، جاري التحويل لتسجيل الدخول المباشر...');
      try {
        sessionStorage.setItem('tadhkira_welcome_pending', '1');
      } catch (_) {}
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (redirectErr: any) {
        if (redirectErr?.code === 'auth/unauthorized-domain') {
          showDomainGuideModal();
          return;
        }
        if (redirectErr?.code === 'auth/operation-not-allowed') {
          showEnableProviderModal();
          return;
        }
      }
    }

    // Never expose raw internal JSON in toast if a Firestore rule error occurred
    const rawMsg = String(err?.message || '');
    const friendlyMsg = rawMsg.startsWith('{')
      ? 'حدث خطأ مؤقت في تهيئة بيانات العضوية، يرجى المحاولة مجدداً أو تحديث الصفحة.'
      : rawMsg || 'حاول مجدداً';
    toast('⚠️ تعذر إكمال تسجيل الدخول: ' + friendlyMsg);
  } finally {
    isAuthenticating = false;
    setButtonLoading(false);
  }
}

async function logOut() {
  try {
    const prevUid = currentUserProfile?.uid || auth.currentUser?.uid;
    if (prevUid) {
      try {
        localStorage.removeItem(`vip_ticket_profile_${prevUid}`);
        localStorage.removeItem(`vip_ai_pass_${prevUid}`);
      } catch (_) {}
    }
    clearRealtimeListeners();
    tokenEmail = null;
    tokenEmailVerified = false;
    syncedProfileUid = null;
    activeProfileSyncPromise = null;
    serverAiActivation = null;
    pendingPlaybackCallback = null;
    pendingPlaybackTitle = '';
    await signOut(auth);
    currentUserProfile = null;
    closeTicketModal();
    closeSubscriptionModal();
    closeAdminPanelModal();
    renderAuthUI(null, null);
    toast('<i class="fa-solid fa-right-from-bracket mr-1.5"></i> تم تسجيل الخروج بنجاح');
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// Render dynamic UI in header, homepage VIP banner, & sidebar
function renderAuthUI(user: FirebaseUser | null, profile: UserTicketProfile | null) {
  const container = document.getElementById('authHeaderContainer');
  const mobileContainer = document.getElementById('authMobileContainer');
  const bannerSection = document.getElementById('vipStatusBannerSection');
  const access = getAccessState();
  const pendingAdminCount = adminAllRequests.filter((r) => r.status === 'pending').length;

  // Toggle exclusive admin tab next to "إعلانات وعروضات" (qtabm769@gmail.com only)
  const isAdm = Boolean(user && access.isAdmin);
  const desktopAdminTab = document.getElementById('nav-tab-adminUsers');
  const mobileAdminTab = document.getElementById('mobile-nav-tab-adminUsers');
  if (desktopAdminTab) {
    if (isAdm) {
      desktopAdminTab.classList.remove('hidden');
      desktopAdminTab.classList.add('flex');
    } else {
      desktopAdminTab.classList.add('hidden');
      desktopAdminTab.classList.remove('flex');
    }
  }
  if (mobileAdminTab) {
    if (isAdm) {
      mobileAdminTab.classList.remove('hidden');
    } else {
      mobileAdminTab.classList.add('hidden');
    }
  }
  updateAdminUsersBadgeCount();

  if (document.getElementById('adminUsersPageRoot')) {
    if (!isAdm && typeof (window as any).switchNavTab === 'function') {
      (window as any).switchNavTab('all');
    } else if (isAdm) {
      renderAdminUsersPageListOnly();
    }
  }

  let effectiveProfile = profile;
  if (user && !effectiveProfile) {
    effectiveProfile = {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'مشترك VIP',
      email: user.email || '',
      photoURL: user.photoURL || '',
      ticketNumber: 0,
      formattedTicket: '#VIP',
      subscriptionStatus: 'none',
      subscriptionPlan: 'trial',
      trialStartedMs: Date.now(),
    };
  }

  let statusChipHtml = '';
  if (user && effectiveProfile) {
    if (access.reason === 'admin') {
      statusChipHtml = `<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-dark-950">👑 إدارة</span>`;
    } else if (access.reason === 'paid') {
      statusChipHtml = `<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">💎 ${escapeHtml(formatRemainingDuration(access.remainingMs))}</span>`;
    } else if (access.reason === 'trial') {
      statusChipHtml = `<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 border border-sky-400/40">🎁 ${escapeHtml(formatRemainingDuration(access.remainingMs))}</span>`;
    } else {
      statusChipHtml = `<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">🔒 اشترك الآن</span>`;
    }
  }

  // Homepage live 24h Trial / VIP status bar
  if (bannerSection) {
    if (user && effectiveProfile) {
      bannerSection.classList.remove('hidden');
      const statusText =
        access.reason === 'admin'
          ? 'صلاحيات الإدارة الكاملة مفعّلة — وصول غير محدود لجميع الأفلام والمسلسلات'
          : access.reason === 'paid'
          ? `اشتراكك VIP نشط (${access.plan === 'yearly' ? 'سنوي' : 'شهري'}) • متبقي ${formatRemainingDuration(access.remainingMs)} — جميع الأعمال مفتوحة`
          : access.reason === 'trial'
          ? `فترتك المجانية (24 ساعة) مفعّلة الآن — متبقي ${formatRemainingDuration(access.remainingMs)}! اضغط على أي فيلم أو مسلسل للمشاهدة فوراً`
          : 'انتهت فترة الـ 24 ساعة المجانية — اشترك عبر محفظة جيب (500/شهر أو 5000/سنة) وأرسل صورة الإشعار للتفعيل الفوري';

      const bannerBorder =
        access.reason === 'expired'
          ? 'border-rose-500/50 from-rose-950/40 via-dark-900 to-amber-950/30'
          : access.reason === 'paid'
          ? 'border-emerald-400/50 from-emerald-950/40 via-dark-900 to-dark-900'
          : 'border-brand/40 from-brand/15 via-dark-900 to-amber-500/15';

      bannerSection.innerHTML = `
        <div class="w-full rounded-2xl bg-gradient-to-r ${bannerBorder} border px-3.5 py-2.5 sm:px-5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-lg">
          <div class="flex items-center gap-2.5 min-w-0">
            <img src="${effectiveProfile.photoURL || '/icon.svg'}" alt="${escapeHtml(effectiveProfile.displayName)}" class="w-9 h-9 rounded-xl border border-amber-400 object-cover shrink-0" onerror="this.src='/icon.svg'" />
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 font-black text-[10px]">${escapeHtml(effectiveProfile.formattedTicket)}</span>
                <span class="text-xs sm:text-sm font-black text-white truncate">${escapeHtml(effectiveProfile.displayName)}</span>
                ${statusChipHtml}
              </div>
              <p class="text-[11px] text-slate-300 mt-0.5 leading-snug">${escapeHtml(statusText)}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <button onclick="window.TadhkiraAuth.openTicketModal()" class="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-black text-[11px] cursor-pointer flex items-center gap-1.5">
              <i class="fa-solid fa-ticket"></i>
              <span>تذكرتي</span>
            </button>
            ${
              access.isAdmin
                ? `<button onclick="window.TadhkiraAuth.openAdminPanelModal()" class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-black text-[11px] cursor-pointer flex items-center gap-1.5"><i class="fa-solid fa-crown"></i><span>لوحة الإدارة (${pendingAdminCount})</span></button>`
                : `<button onclick="window.TadhkiraAuth.openSubscriptionModal()" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 text-dark-950 font-black text-[11px] cursor-pointer flex items-center gap-1.5"><i class="fa-solid fa-robot"></i><span>${access.reason === 'paid' ? 'تجديد VIP' : 'تفعيل VIP بالذكاء الاصطناعي'}</span></button>`
            }
          </div>
        </div>
      `;
    } else {
      bannerSection.classList.add('hidden');
      bannerSection.innerHTML = '';
    }
  }

  const adminHeaderBtn =
    user && access.isAdmin
      ? `
    <button onclick="window.TadhkiraAuth.openAdminPanelModal()" class="relative cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-black text-[11px] shadow-md transition-all ml-1.5 shrink-0 whitespace-nowrap">
      <i class="fa-solid fa-crown text-xs"></i>
      <span>الإدارة</span>
      ${pendingAdminCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none">${pendingAdminCount}</span>` : ''}
    </button>
  `
      : '';

  const subscribeHeaderBtn =
    user && effectiveProfile && !access.isAdmin && access.reason !== 'paid'
      ? `
    <button onclick="window.TadhkiraAuth.openSubscriptionModal()" class="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 text-dark-950 font-black text-[11px] shadow-md transition-all ml-1.5 shrink-0 whitespace-nowrap">
      <i class="fa-solid fa-gem text-[10px]"></i>
      <span>اشترك VIP</span>
    </button>
  `
      : '';

  const contentLoggedIn = effectiveProfile
    ? `
    <div class="flex items-center shrink-0">
      ${adminHeaderBtn}
      ${subscribeHeaderBtn}
      <div onclick="window.TadhkiraAuth.openTicketModal()" class="cursor-pointer flex items-center gap-2 bg-gradient-to-r from-amber-500/15 via-dark-900 to-amber-500/10 hover:from-amber-500/25 border border-amber-400/50 hover:border-amber-300 rounded-xl px-2.5 py-1.5 transition-all shadow-md shadow-amber-500/10 group shrink-0">
        <div class="relative shrink-0">
          <img src="${effectiveProfile.photoURL || '/icon.svg'}" alt="${escapeHtml(effectiveProfile.displayName)}" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-amber-400 object-cover shadow" onerror="this.src='/icon.svg'" />
          <span class="absolute -bottom-1 -right-1 bg-amber-400 text-dark-950 text-[8px] font-black px-1 rounded-full leading-tight uppercase shadow">VIP</span>
        </div>
        <div class="text-right flex flex-col justify-center min-w-0">
          <div class="flex items-center gap-1 whitespace-nowrap">
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 tracking-wider leading-none">${escapeHtml(effectiveProfile.formattedTicket)}</span>
            ${statusChipHtml}
          </div>
          <span class="text-[11px] font-bold text-white max-w-[85px] sm:max-w-[110px] truncate leading-tight group-hover:text-amber-300 transition-colors">${escapeHtml(effectiveProfile.displayName)}</span>
        </div>
        <i class="fa-solid fa-chevron-left text-[10px] text-amber-400 group-hover:-translate-x-0.5 transition-transform mr-0.5 shrink-0"></i>
      </div>
    </div>
  `
    : '';

  const contentLoggedOut = `
    <button onclick="window.TadhkiraAuth.signInWithGoogle()" class="google-signin-btn cursor-pointer flex items-center gap-2 bg-gradient-to-r from-brand/20 via-dark-900 to-amber-400/20 hover:from-brand/30 hover:to-amber-400/30 border border-brand/60 hover:border-amber-400 rounded-xl px-2.5 sm:px-3.5 py-1.5 transition-all shadow-lg shadow-brand/10 group shrink-0">
      <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white flex items-center justify-center shadow shrink-0">
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      </div>
      <div class="text-right flex flex-col justify-center">
        <span class="text-[8px] font-black text-amber-400 tracking-tighter">🎁 يوم مجاني</span>
        <span class="signin-btn-text text-[11px] font-bold text-white group-hover:text-brand transition-colors whitespace-nowrap">دخول بـ Google</span>
      </div>
      <i class="signin-btn-icon fa-solid fa-ticket text-amber-400 text-xs rotate-[-30deg] group-hover:rotate-0 transition-transform"></i>
    </button>
  `;

  if (container) {
    container.innerHTML = user && effectiveProfile ? contentLoggedIn : contentLoggedOut;
  }

  if (mobileContainer) {
    mobileContainer.innerHTML =
      user && effectiveProfile
        ? `
      <div class="flex items-center gap-1">
        ${
          access.isAdmin
            ? `<button onclick="window.TadhkiraAuth.openAdminPanelModal()" class="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-400 text-dark-950 text-[10px] font-black shrink-0">👑${pendingAdminCount > 0 ? ` ${pendingAdminCount}` : ''}</button>`
            : access.reason !== 'paid'
            ? `<button onclick="window.TadhkiraAuth.openSubscriptionModal()" class="px-2 py-1 rounded-xl bg-emerald-500 text-dark-950 text-[10px] font-black shrink-0">اشترك</button>`
            : ''
        }
        <button onclick="window.TadhkiraAuth.openTicketModal()" class="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-400/50 text-[10px] font-bold text-amber-300 shrink-0">
          <img src="${effectiveProfile.photoURL || '/icon.svg'}" class="w-4 h-4 rounded-full border border-amber-400 object-cover" />
          <span>${escapeHtml(effectiveProfile.formattedTicket)}</span>
        </button>
      </div>
    `
        : `
      <button onclick="window.TadhkiraAuth.signInWithGoogle()" class="google-signin-btn cursor-pointer flex items-center gap-1 px-2 py-1.5 rounded-xl bg-brand/15 border border-brand/50 text-[10px] font-bold text-brand shrink-0 whitespace-nowrap">
        <i class="signin-btn-icon fa-solid fa-ticket text-[10px]"></i>
        <span class="signin-btn-text">دخول مجاني</span>
      </button>
    `;
  }

  const sidebarContainer = document.getElementById('sidebarAuthContainer');
  if (sidebarContainer) {
    if (user && effectiveProfile) {
      sidebarContainer.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-dark-850 to-dark-900 border border-amber-400/40 shadow-lg space-y-3">
          <div class="flex items-center gap-3">
            <div class="relative shrink-0">
              <img src="${effectiveProfile.photoURL || '/icon.svg'}" alt="${escapeHtml(effectiveProfile.displayName)}" class="w-12 h-12 rounded-2xl border-2 border-amber-400 object-cover shadow-md" onerror="this.src='/icon.svg'" />
              <span class="absolute -bottom-1 -right-1 bg-amber-400 text-dark-950 text-[9px] font-black px-1.5 rounded-full leading-tight uppercase shadow">VIP</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-400 text-dark-950">تذكرة ${escapeHtml(effectiveProfile.formattedTicket)}</span>
                ${statusChipHtml}
              </div>
              <h4 class="text-xs sm:text-sm font-bold text-white truncate mt-1">${escapeHtml(effectiveProfile.displayName)}</h4>
              <p class="text-[10px] text-slate-400 truncate">${escapeHtml(effectiveProfile.email || '')}</p>
            </div>
          </div>

          <div class="flex flex-col gap-2 pt-1 border-t border-dark-border/60">
            ${
              access.isAdmin
                ? `
              <button onclick="window.TadhkiraAuth.openAdminPanelModal(); if(typeof closeAppSidebar==='function') closeAppSidebar();" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-dark-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                <i class="fa-solid fa-crown"></i>
                <span>لوحة الإدارة وتأكيد حوالات جيب ${pendingAdminCount > 0 ? `(${pendingAdminCount} معلق)` : ''}</span>
              </button>
            `
                : `
              <button onclick="window.TadhkiraAuth.openSubscriptionModal(); if(typeof closeAppSidebar==='function') closeAppSidebar();" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 text-dark-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                <i class="fa-solid fa-gem"></i>
                <span>${access.reason === 'paid' ? 'تفاصيل / تجديد اشتراك VIP (جيب)' : 'اشترك الآن عبر محفظة جيب (500/شهر)'}</span>
              </button>
            `
            }
            <div class="flex items-center gap-2">
              <button onclick="window.TadhkiraAuth.openTicketModal(); if(typeof closeAppSidebar==='function') closeAppSidebar();" class="flex-1 py-2 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-ticket"></i>
                <span>تذكرتي</span>
              </button>
              <button onclick="window.TadhkiraAuth.logOut()" class="py-2 px-3 rounded-xl bg-dark-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-dark-border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer" title="تسجيل الخروج">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      sidebarContainer.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-gradient-to-br from-brand/10 via-dark-850 to-amber-500/10 border border-brand/30 shadow-md space-y-2.5">
          <div class="flex items-start gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <i class="fa-solid fa-crown text-sm"></i>
            </div>
            <div>
              <h4 class="text-xs font-black text-white">تسجيل الدخول + يوم كامل مجاني 🎁</h4>
              <p class="text-[10.5px] text-slate-400 leading-snug">سجّل دخولك بحساب Google واحصل على 24 ساعة مجانية، وبعدها 500 ريال/شهر أو 5,000 ريال/سنة عبر محفظة جيب.</p>
            </div>
          </div>
          <button onclick="window.TadhkiraAuth.signInWithGoogle()" class="google-signin-btn w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand via-sky-400 to-amber-400 hover:brightness-110 text-dark-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95">
            <div class="w-5 h-5 rounded-md bg-white flex items-center justify-center shadow-xs">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <span class="signin-btn-text">الدخول بحساب Google</span>
          </button>
        </div>
      `;
    }
  }
}

// VIP Ticket Modal
function openTicketModal(isNewRegistration = false) {
  let modal = document.getElementById('vipTicketModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'vipTicketModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-dark-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    modal.onclick = (e) => {
      if (e.target === modal) closeTicketModal();
    };
    document.body.appendChild(modal);
  }

  const authUser = auth.currentUser;
  if (!authUser) {
    toast('يرجى تسجيل الدخول أولاً لعرض تذكرتك VIP');
    return;
  }

  const p: UserTicketProfile = currentUserProfile || {
    uid: authUser.uid,
    displayName: authUser.displayName || authUser.email?.split('@')[0] || 'مشترك VIP',
    email: authUser.email || '',
    photoURL: authUser.photoURL || '',
    ticketNumber: 1,
    formattedTicket: '#VIP',
    subscriptionStatus: 'none',
    subscriptionPlan: 'trial',
    trialStartedMs: Date.now(),
  };
  const access = getAccessState();
  const isFirst = p.ticketNumber === 1;
  const createdMs = p.createdAtMs ?? parseTimestampMs(p.createdAt) ?? Date.now();
  const dateFormatted = new Date(createdMs).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const planBadgeLabel =
    access.reason === 'admin'
      ? 'إدارة المنصة 👑'
      : access.reason === 'paid'
      ? `${access.plan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'} (${formatRemainingDuration(access.remainingMs)})`
      : access.reason === 'trial'
      ? `فترة مجانية (${formatRemainingDuration(access.remainingMs)})`
      : 'منتهي — يتطلب اشتراك';

  modal.innerHTML = `
    <div class="relative w-full max-w-lg bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950 border border-amber-400/50 rounded-3xl shadow-[0_25px_70px_rgba(245,158,11,0.25)] overflow-hidden scale-95 transition-transform duration-300 transform" id="ticketModalContent">
      <button onclick="window.TadhkiraAuth.closeTicketModal()" class="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-dark-800/80 hover:bg-dark-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>

      <div class="relative bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 p-4 sm:p-5 text-dark-950 text-center overflow-hidden">
        <div class="relative z-10 flex flex-col items-center">
          <div class="inline-flex items-center gap-2 bg-dark-950/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1.5">
            <i class="fa-solid fa-crown text-amber-900"></i>
            <span>تذكرة دخول سينمائية VIP</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-black tracking-tight leading-none">بطاقة العضوية الرسمية</h2>
          <p class="text-xs font-semibold text-amber-950/80 mt-1">
            ${isFirst ? '⭐ أول مشترك في منصة تذكرة دخول VIP ⭐' : isNewRegistration ? '🎉 مبروك! تم إصدار تذكرتك وتفعيل يومك المجاني (24 ساعة)' : 'بطاقة عضويتك واشتراكك في المنصة'}
          </p>
        </div>
      </div>

      <div class="p-4 sm:p-6 space-y-4">
        <div class="relative bg-gradient-to-br from-dark-850 to-dark-900 border-2 border-amber-400/60 rounded-2xl p-4 sm:p-5 shadow-inner overflow-hidden">
          <div class="ticket-foil-shimmer"></div>

          <div class="flex items-center justify-between gap-3 border-b border-dashed border-amber-400/30 pb-4">
            <div class="flex items-center gap-3 min-w-0">
              <img src="${p.photoURL || '/icon.svg'}" alt="${escapeHtml(p.displayName)}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-amber-400 object-cover shadow-lg shrink-0" onerror="this.src='/icon.svg'" />
              <div class="min-w-0">
                <h3 class="font-black text-base sm:text-lg text-white leading-tight truncate">${escapeHtml(p.displayName)}</h3>
                <span class="text-xs text-slate-400 block truncate">${escapeHtml(p.email)}</span>
                <span class="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <i class="fa-solid fa-circle-check text-[9px] mr-1"></i> موثق بحساب Google
                </span>
              </div>
            </div>

            <div class="text-center bg-gradient-to-b from-amber-400/20 to-amber-500/10 border border-amber-400/60 rounded-xl px-3 py-2 shrink-0">
              <span class="block text-[10px] font-black text-amber-400 uppercase tracking-wider">رقم التذكرة</span>
              <span class="block text-2xl sm:text-3xl font-black text-amber-300 tracking-tight font-mono">${escapeHtml(p.formattedTicket)}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 py-3 text-xs">
            <div class="bg-dark-950/60 rounded-xl p-2.5 border border-dark-border/60">
              <span class="text-[10px] text-slate-400 block mb-0.5">حالة الاشتراك</span>
              <span class="font-bold ${access.allowed ? 'text-emerald-400' : 'text-rose-400'}">${escapeHtml(planBadgeLabel)}</span>
            </div>
            <div class="bg-dark-950/60 rounded-xl p-2.5 border border-dark-border/60">
              <span class="text-[10px] text-slate-400 block mb-0.5">تاريخ التسجيل</span>
              <span class="font-bold text-slate-200">${dateFormatted}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          ${
            access.allowed
              ? `
            <button onclick="window.TadhkiraAuth.closeTicketModal()" class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand via-sky-400 to-cyan-400 hover:brightness-110 text-dark-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg">
              <i class="fa-solid fa-play"></i>
              <span>ابدأ المشاهدة الآن (مفتوح لك)</span>
            </button>
          `
              : ''
          }
          ${
            access.isAdmin
              ? `
            <button onclick="window.TadhkiraAuth.closeTicketModal(); window.TadhkiraAuth.openAdminPanelModal();" class="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-crown"></i>
              <span>فتح لوحة الإدارة</span>
            </button>
          `
              : `
            <button onclick="window.TadhkiraAuth.closeTicketModal(); window.TadhkiraAuth.openSubscriptionModal();" class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 text-dark-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-robot"></i>
              <span>${access.reason === 'paid' ? 'تجديد VIP (جيب + AI)' : 'اشترك VIP (جيب + AI)'}</span>
            </button>
          `
          }
          <button onclick="window.TadhkiraAuth.shareTicket()" class="py-2.5 px-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-amber-300 border border-amber-400/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-share-nodes"></i>
            <span>مشاركة</span>
          </button>
          <button onclick="window.TadhkiraAuth.logOut()" class="py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-rose-500/20 hover:text-rose-400 border border-dark-border text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('opacity-0', 'pointer-events-none');
  const content = document.getElementById('ticketModalContent');
  if (content) {
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
  }
}

function closeTicketModal() {
  const modal = document.getElementById('vipTicketModal');
  if (modal) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    const content = document.getElementById('ticketModalContent');
    if (content) {
      content.classList.remove('scale-100');
      content.classList.add('scale-95');
    }
  }
}

async function shareTicket() {
  if (!currentUserProfile) return;
  const p = currentUserProfile;
  const siteOrigin = window.location.origin || 'https://ticket-vib.netlify.app';
  const text = `🎉 أنا مشترك في منصة "تذكرة دخول VIP" وأحمل التذكرة رقم ${p.formattedTicket}!\nسجّل دخولك الآن واحصل على يوم مجاني كامل: ${siteOrigin}/`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `تذكرة دخول VIP - ${p.formattedTicket}`,
        text,
        url: siteOrigin,
      });
      return;
    } catch (_) {}
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    toast('<i class="fa-solid fa-copy mr-1.5 text-amber-400"></i> تم نسخ تفاصيل تذكرتك لمشاركتها!');
  }
}

// Global exposure
window.TadhkiraAuth = {
  signInWithGoogle,
  logOut,
  openTicketModal: (isNew = false) => openTicketModal(isNew),
  closeTicketModal,
  openAuthGateModal,
  closeAuthGateModal,
  openSubscriptionModal,
  closeSubscriptionModal,
  selectPlan,
  selectWallet,
  copyWalletNumber,
  copyJaibWallet,
  handleReceiptFileSelect,
  clearSelectedReceipt,
  analyzeAndVerifyReceipt,
  submitJaibPayment,
  openAdminPanelModal,
  closeAdminPanelModal,
  switchAdminTab,
  setAdminRequestFilter,
  filterAdminUsers,
  approvePaymentRequest,
  rejectPaymentRequest,
  adminSetUserSubscription,
  renderAdminUsersPageSection,
  filterAdminPageUsers,
  requestDeleteAdminUser,
  cancelDeleteAdminUser,
  confirmAndDeleteAdminUser,
  refreshAdminUsersList,
  copyUserEmail,
  showDomainGuideModal,
  closeDomainGuideModal,
  showEnableProviderModal,
  closeEnableProviderModal,
  shareTicket,
  getCurrentUser: () => auth.currentUser,
  getCurrentTicket: () => currentUserProfile,
  getAccessState,
  hasActiveAccess,
  isAdminUser: () => isAdminUser(),
  requirePlaybackAccess,
};

// Check redirect result on startup (fallback when popup was blocked)
getRedirectResult(auth)
  .then(async (result) => {
    if (result && result.user) {
      try {
        sessionStorage.removeItem('tadhkira_welcome_pending');
      } catch (_) {}
      await syncTokenClaims(result.user);
      let ticket: UserTicketProfile | null = null;
      try {
        ticket = await getOrCreateTicket(result.user);
      } catch (_) {}
      startRealtimeListeners(result.user);
      syncServerAiSubscription(result.user);
      renderAuthUI(result.user, ticket || currentUserProfile);
      const access = getAccessState();
      if (access.isAdmin) {
        toast(`👑 أهلاً بك يا مدير المنصة! صلاحياتك الكاملة مفعّلة (${(ticket || currentUserProfile)?.formattedTicket || '#0001'})`);
      } else {
        toast(`🎉 مرحباً بك! تم تفعيل تذكرتك ${ticket?.formattedTicket || '#VIP'} وفترتك المجانية لمدة 24 ساعة`);
      }
      setTimeout(() => openTicketModal(true), 250);
    }
  })
  .catch((err: any) => {
    if (err?.code === 'auth/unauthorized-domain') {
      showDomainGuideModal();
    } else if (err?.code === 'auth/operation-not-allowed') {
      showEnableProviderModal();
    }
  });

// Listen to auth state changes
onAuthStateChanged(auth, async (user) => {
  if (liveCountdownTimer) {
    window.clearInterval(liveCountdownTimer);
    liveCountdownTimer = null;
  }

  if (user) {
    const cacheKey = `vip_ticket_profile_${user.uid}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        currentUserProfile = normalizeProfile(JSON.parse(cached));
      }
    } catch (_) {}

    renderAuthUI(user, currentUserProfile);

    const syncWork = (async () => {
      await syncTokenClaims(user);
      renderAuthUI(user, currentUserProfile);

      await Promise.allSettled([
        getOrCreateTicket(user, true),
        syncServerAiSubscription(user),
      ]);

      startRealtimeListeners(user);
      renderAuthUI(user, currentUserProfile);

      const postSyncAccess = getAccessState();
      if (postSyncAccess.allowed) {
        closeAuthGateModal();
        const subModal = document.getElementById('subscriptionModal');
        if (subModal && !subModal.classList.contains('hidden')) {
          closeSubscriptionModal();
        }
        if (pendingPlaybackCallback) {
          const cb = pendingPlaybackCallback;
          pendingPlaybackCallback = null;
          pendingPlaybackTitle = '';
          setTimeout(() => cb(), 120);
        }
      }
    })();

    activeProfileSyncPromise = syncWork;
    try {
      await syncWork;
    } finally {
      if (activeProfileSyncPromise === syncWork) {
        activeProfileSyncPromise = null;
      }
    }

    // Refresh countdown labels every 30s
    liveCountdownTimer = window.setInterval(() => {
      if (auth.currentUser) {
        renderAuthUI(auth.currentUser, currentUserProfile);
      }
    }, 30000);

    try {
      if (sessionStorage.getItem('tadhkira_welcome_pending') === '1') {
        sessionStorage.removeItem('tadhkira_welcome_pending');
        setTimeout(() => openTicketModal(true), 250);
      }
    } catch (_) {}
  } else {
    clearRealtimeListeners();
    tokenEmail = null;
    tokenEmailVerified = false;
    syncedProfileUid = null;
    activeProfileSyncPromise = null;
    serverAiActivation = null;
    currentUserProfile = null;
    renderAuthUI(null, null);
  }
});

// Initial render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderAuthUI(auth.currentUser, currentUserProfile);
  });
} else {
  renderAuthUI(auth.currentUser, currentUserProfile);
}
