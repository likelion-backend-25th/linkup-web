import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

const CUSTOMER_KEY_LENGTH = 30;
const CUSTOMER_KEY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const PENDING_STORAGE_KEY = 'linkup-billing-pending';
export const BILLING_FAIL_PARAM = 'billingFail';
export const BILLING_SUCCESS_PARAM = 'billingSuccess';

export interface PendingBilling {
  creatorId: number;
  customerKey: string;
}

export interface BillingCustomer {
  email: string;
  nickname: string;
}

export function generateCustomerKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CUSTOMER_KEY_LENGTH));
  return Array.from(bytes, (byte) => CUSTOMER_KEY_CHARS[byte % CUSTOMER_KEY_CHARS.length]).join('');
}

export function readPendingBilling(): PendingBilling | null {
  try {
    const raw = sessionStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'creatorId' in parsed &&
      'customerKey' in parsed &&
      typeof parsed.creatorId === 'number' &&
      typeof parsed.customerKey === 'string'
    ) {
      return { creatorId: parsed.creatorId, customerKey: parsed.customerKey };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingBilling(): void {
  sessionStorage.removeItem(PENDING_STORAGE_KEY);
}

export function isTossUserCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'USER_CANCEL'
  );
}

// 카드 등록창을 띄운다. 성공 시 토스가 successUrl 로 리다이렉트하며 authKey/customerKey 를 붙여준다.
// 리다이렉트 후에도 어떤 크리에이터 구독인지 알아야 하므로 sessionStorage 에 남겨 둔다.
export async function requestCardBillingAuth(
  creatorId: number,
  customer: BillingCustomer,
): Promise<void> {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error('토스페이먼츠 클라이언트 키(VITE_TOSS_CLIENT_KEY)가 설정되지 않았습니다.');
  }

  const customerKey = generateCustomerKey();
  const pending: PendingBilling = { creatorId, customerKey };
  sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));

  const tossPayments = await loadTossPayments(clientKey);
  const payment = tossPayments.payment({ customerKey });
  await payment.requestBillingAuth({
    method: 'CARD',
    // 성공/실패 모두 크리에이터 프로필로 돌아와 팝업으로 보여준다.
    // 성공은 authKey, customerKey / 실패는 code, message 를 토스가 쿼리로 붙여준다.
    successUrl: `${window.location.origin}/members/${creatorId}?${BILLING_SUCCESS_PARAM}=1`,
    failUrl: `${window.location.origin}/members/${creatorId}?${BILLING_FAIL_PARAM}=1`,
    customerEmail: customer.email,
    customerName: customer.nickname,
  });
}
