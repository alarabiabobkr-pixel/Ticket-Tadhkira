# Security Specification — Ticket VIP Paid Subscription & Jaib Wallet Gate

## 1. Data Invariants
1. **Tamper-Proof 1-Day Free Trial**: Every user gets exactly ONE 24-hour free trial anchored to `trialStartedAt == request.time` upon initial account creation (or one-time legacy profile migration). `trialStartedAt` and `createdAt` are strictly immutable thereafter.
2. **Zero Self-Activation / Privilege Escalation**: Regular authenticated users can NEVER set `subscriptionStatus: 'active'`, `subscriptionPlan: 'monthly' | 'yearly'`, `subscriptionExpiresAt`, or `activatedBy` on `/users/{uid}` — neither on `create` nor on `update`. Only a verified Admin (`qtabm769@gmail.com` with `email_verified == true` or `/admins/{uid}`) may modify subscription state fields.
3. **PII Isolation**: `/users/{uid}` and `/paymentRequests/{requestId}` contain PII (`email`, `userEmail`, `senderPhone`, `transactionRef`). Blanket reads (`allow read: if isSignedIn()`) are forbidden. Only `owner` (`uid == request.auth.uid`) or `Admin` can read individual documents or list their own payment requests.
4. **Payment Integrity**: Every `PaymentRequest` must be created with `status == 'pending'`, `uid == request.auth.uid`, an existing `/users/{uid}` parent doc, valid plan/amount pairing (`monthly` -> `500`, `yearly` -> `5000`), `currency == 'YER'`, `walletNumber == '779676636'`, and server timestamps (`request.time`). Regular users cannot approve, reject, or mutate payment amounts after creation.
5. **Verified Admin Only & Google Provider Isolation**: Admin privileges require BOTH `request.auth.token.email == 'qtabm769@gmail.com'` AND `request.auth.token.email_verified == true` (or trusted `/admins/{uid}` document), blocking unverified email spoofing. Regular owner-scoped document access accepts either `email_verified == true` or non-anonymous federated Google sign-in (`firebase.sign_in_provider != 'anonymous'`), never anonymous sessions.
6. **Server-Side AI Receipt Verification**: Receipt image analysis via Gemini Vision (`gemini-4-hydrogen`) runs strictly on the server (`/api/verify-jaib-receipt`) after verifying the caller's Firebase ID token, deduplicates `transactionRef` + image SHA-256 hash, and issues a server-signed HMAC activation pass (plus optional Admin SDK Firestore activation when service account credentials exist). Client-supplied `aiVerified` audit fields cannot bypass Firestore's `status == 'pending'` gate.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Self-Activated Subscription on Registration**: Client creates `/users/{uid}` with `{ subscriptionStatus: 'active', subscriptionPlan: 'yearly', ... }` -> DENIED (`subscriptionStatus` must equal `'none'` on create).
2. **Backdated / Future-Dated Trial Extension on Create**: Client creates `/users/{uid}` with `{ trialStartedAt: '2099-01-01T00:00:00Z' }` -> DENIED (`trialStartedAt == request.time` enforced).
3. **Self-Upgrade via Update**: Client updates `/users/{uid}` with `{ subscriptionStatus: 'active' }` -> DENIED (`affectedKeys` excludes subscription fields for non-admins).
4. **Trial Reset Attack via Update**: Client updates `/users/{uid}` with `{ trialStartedAt: request.time }` after trial expires -> DENIED (`trialStartedAt == existing().trialStartedAt` enforced).
5. **Shadow / Ghost Field Injection**: Client creates `/users/{uid}` or `/paymentRequests/{id}` with `{ isAdmin: true, isVipForever: true }` -> DENIED (`keys().hasOnly(...)` blocks unknown fields).
6. **Spoofed Unverified Admin Email**: Attacker signs in with `email: 'qtabm769@gmail.com'` and `email_verified: false` -> DENIED (`email_verified == true` mandated).
7. **Cross-User Payment Forgery**: User A creates `/paymentRequests/{id}` with `{ uid: 'userB' }` -> DENIED (`incoming().uid == request.auth.uid` enforced).
8. **Auto-Approved Payment Request**: User creates `/paymentRequests/{id}` with `{ status: 'approved' }` -> DENIED (`incoming().status == 'pending'` enforced).
9. **Amount Tampering**: User submits `{ plan: 'yearly', amount: 1 }` -> DENIED (enforces `yearly == 5000` and `monthly == 500`).
10. **Other User PII Scrape (Get & List)**: User A attempts `get(/users/userB)` or `list(/paymentRequests)` without `where('uid', '==', auth.uid)` -> DENIED.
11. **Counter Manipulation / Jump**: User attempts to update `/counters/tickets` to `currentTicket: 99999` instead of `existing().currentTicket + 1` -> DENIED.
12. **ID Poisoning**: User attempts to write document ID `../../admin` or 1,500-character junk string -> DENIED (`isValidId()` regex + length guard).
