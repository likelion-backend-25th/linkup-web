import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toErrorMessage } from '@/api/http.ts';
import { createSubscription } from '@/api/subscriptions.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { CreateSubscriptionResponse } from '@/types/subscription.ts';
import {
  BILLING_FAIL_PARAM,
  BILLING_SUCCESS_PARAM,
  clearPendingBilling,
  readPendingBilling,
} from '@/utils/tossBilling.ts';

export interface BillingDialog {
  title: string;
  message: string;
  detail: string | null;
  pending: boolean;
  succeeded: boolean;
}

interface RequestResult {
  authKey: string;
  error: string | null;
}

// authKey 는 1회용이라 StrictMode 이중 effect 에서도 POST 가 한 번만 나가도록 authKey 단위로 공유한다.
const inflight = new Map<string, Promise<CreateSubscriptionResponse>>();

// 토스 successUrl/failUrl 리다이렉트 쿼리를 읽어 구독 등록 API 를 호출하고, 결과를 팝업 모델로 돌려준다.
export function useBillingResult(memberId: number | null) {
  const [searchParams, setSearchParams] = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [result, setResult] = useState<RequestResult | null>(null);
  const [pending] = useState(readPendingBilling);

  const isSuccessRedirect = searchParams.has(BILLING_SUCCESS_PARAM);
  const authKey = searchParams.get('authKey');
  const customerKey = searchParams.get('customerKey');
  const validSuccess =
    isSuccessRedirect &&
    Boolean(authKey) &&
    pending !== null &&
    pending.customerKey === customerKey &&
    pending.creatorId === memberId;

  useEffect(() => {
    if (!validSuccess || !authKey || !customerKey || !pending || !accessToken) {
      return;
    }

    let cancelled = false;
    let request = inflight.get(authKey);
    if (!request) {
      request = createSubscription({ creatorId: pending.creatorId, customerKey, authKey }, accessToken);
      inflight.set(authKey, request);
    }
    request
      .then(() => {
        if (!cancelled) {
          setResult({ authKey, error: null });
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setResult({ authKey, error: toErrorMessage(caught) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, authKey, customerKey, pending, validSuccess]);

  let dialog: BillingDialog | null = null;
  if (sdkError) {
    dialog = failure(sdkError, null);
  } else if (searchParams.has(BILLING_FAIL_PARAM)) {
    dialog = failure(
      searchParams.get('message') ?? '카드 등록이 취소되었거나 실패했습니다.',
      searchParams.get('code'),
    );
  } else if (isSuccessRedirect) {
    if (!validSuccess) {
      dialog = failure('카드 등록 정보가 올바르지 않습니다. 다시 시도해 주세요.', null);
    } else if (!accessToken) {
      dialog = failure('로그인이 필요합니다. 다시 로그인 후 시도해 주세요.', null);
    } else if (result?.authKey !== authKey) {
      dialog = {
        title: '구독을 등록하는 중',
        message: '잠시만 기다려 주세요.',
        detail: null,
        pending: true,
        succeeded: false,
      };
    } else if (result.error) {
      dialog = {
        title: '구독 등록에 실패했어요',
        message: result.error,
        detail: null,
        pending: false,
        succeeded: false,
      };
    } else {
      dialog = {
        title: '구독이 완료되었어요',
        message: '카드가 등록되어 매월 자동으로 결제됩니다.',
        detail: null,
        pending: false,
        succeeded: true,
      };
    }
  }

  function close() {
    setSdkError(null);
    setResult(null);
    clearPendingBilling();
    if (searchParams.has(BILLING_FAIL_PARAM) || isSuccessRedirect) {
      setSearchParams({}, { replace: true });
    }
  }

  return { dialog, reportSdkError: setSdkError, close };
}

function failure(message: string, code: string | null): BillingDialog {
  return { title: '카드 등록에 실패했어요', message, detail: code, pending: false, succeeded: false };
}
