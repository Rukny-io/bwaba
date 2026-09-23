'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Banknote,
  Check,
  CreditCard,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { EmptyCheckoutState } from '@/components/checkout/empty-checkout-state';
import { InvoiceSummary } from '@/components/checkout/invoice-summary';
import { OtpCodeInput } from '@/components/checkout/otp-code-input';
import { TicketShell } from '@/components/checkout/ticket-shell';
import {
  FieldHint,
  FormAlert,
  SoftPanel,
  TextLink,
  checkoutCtaClass,
  checkoutSecondaryCtaClass,
} from '@/components/checkout/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  DEFAULT_GOVERNORATE,
  governorateDisplayName,
  governorateLabel,
  IRAQI_GOVERNORATES,
} from '@/data/iraq-governorates';
import {
  CheckoutApiError,
  createAddress,
  createCheckoutOrder,
  getCheckoutPaymentOptions,
  getDeveloperCheckoutSession,
  getMailCheckoutSession,
  getStoreBySlug,
  listAddresses,
  payDeveloperCheckoutSession,
  payMailCheckoutSession,
  requestCheckoutOtp,
  resendCheckoutOtp,
  verifyCheckoutOtp,
  type CheckoutAddress,
  type CheckoutPaymentOptions,
} from '@/lib/api';
import { useLocale } from '@/lib/i18n/locale';
import {
  clearCheckoutCart,
  getCheckoutCart,
  getCheckoutSession,
  maskPhone,
  saveCheckoutCart,
  saveCheckoutSession,
  toE164Iraq,
  toLocalIraqPhone,
  updateCheckoutSession,
  type CheckoutCartItem,
  type CheckoutCartState,
} from '@/lib/session';
import { cn } from '@/lib/utils';

const RESEND_SECONDS = 30;

type PhonePhase = 'input' | 'otp' | 'verified';
type StorePaymentMethod = 'QASEH_CARD' | 'CASH';

export function CheckoutFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLocale();

  // —— Phone / OTP ——
  const [phonePhase, setPhonePhase] = useState<PhonePhase>('input');
  const [phone, setPhone] = useState('07');
  const [email, setEmail] = useState('');
  const [preferEmail, setPreferEmail] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // —— Address ——
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [landmarkWarning, setLandmarkWarning] = useState(false);

  const [label, setLabel] = useState('');
  const [fullName, setFullName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [city, setCity] = useState(DEFAULT_GOVERNORATE.ar);
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [buildingNo, setBuildingNo] = useState('');
  const [floor, setFloor] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [landmark, setLandmark] = useState('');

  // —— Order / pay ——
  const [cart, setCart] = useState<CheckoutCartState | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mailExpired, setMailExpired] = useState(false);
  const [developerExpired, setDeveloperExpired] = useState(false);
  const [mailExpiresAt, setMailExpiresAt] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<StorePaymentMethod>('QASEH_CARD');
  const [paymentOptions, setPaymentOptions] =
    useState<CheckoutPaymentOptions | null>(null);
  const [multiStoreNotice, setMultiStoreNotice] = useState(false);

  const itemCount = useMemo(() => {
    if (cart?.mail || cart?.developer) return 1;
    return cart?.items?.length || 0;
  }, [cart]);
  const isMailCheckout = Boolean(cart?.mail);
  const isDeveloperCheckout = Boolean(cart?.developer);
  const isDigitalCheckout = isMailCheckout || isDeveloperCheckout;
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedId) || null,
    [addresses, selectedId],
  );
  const orderSectionReady =
    phonePhase === 'verified' &&
    (isDigitalCheckout || Boolean(selectedId));
  const canPay =
    orderSectionReady && itemCount > 0 && !paying;
  const showCodOption = Boolean(paymentOptions?.cashOnDelivery);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const product = searchParams.get('product');
      const mailSessionId = searchParams.get('session');

      if (product === 'mail' && mailSessionId) {
        // Never trust plan/seats/amount from the URL — server session is source of truth.
        setMailExpired(false);
        setDeveloperExpired(false);
        try {
          const preview = await getMailCheckoutSession(mailSessionId);
          if (cancelled) return;
          const expiresAt = preview.expiresAt
            ? Date.parse(preview.expiresAt)
            : Date.now() + (preview.expiresIn || 15 * 60) * 1000;
          if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
            clearCheckoutCart();
            setCart(null);
            setMailExpired(true);
            setMailExpiresAt(null);
            setPayError(null);
            return;
          }
          const nextCart: CheckoutCartState = {
            items: [],
            mail: {
              product: 'mail',
              sessionId: preview.sessionId,
              plan: preview.plan,
              planName: preview.planName,
              mailboxCount: preview.mailboxCount,
              amount: preview.amount,
              taxIqd: preview.taxIqd ?? 400,
              totalAmount:
                preview.totalAmount ??
                preview.amount + (preview.taxIqd ?? 400),
              currency: preview.currency,
              appId: preview.appId,
              appName: preview.appName,
              returnUrl: preview.returnUrl,
              expiresAt,
              kind: preview.kind === 'outbound_pack' ? 'outbound_pack' : 'subscription',
              outboundPackThousands: preview.outboundPackThousands ?? null,
              outboundPackEmails: preview.outboundPackEmails ?? null,
            },
          };
          saveCheckoutCart(nextCart);
          setCart(nextCart);
          setMailExpiresAt(expiresAt);
          setPayError(null);
        } catch (err) {
          if (!cancelled) {
            clearCheckoutCart();
            setCart(null);
            setMailExpiresAt(null);
            const code =
              err instanceof CheckoutApiError ? err.code : undefined;
            const expired =
              code === 'MAIL_CHECKOUT_EXPIRED' ||
              (err instanceof CheckoutApiError && err.status === 410);
            setMailExpired(expired);
            setPayError(
              expired
                ? null
                : err instanceof CheckoutApiError
                  ? err.message
                  : t('mailSessionLoadError'),
            );
          }
        }
      } else if (product === 'developer' && mailSessionId) {
        setMailExpired(false);
        setDeveloperExpired(false);
        try {
          const preview = await getDeveloperCheckoutSession(mailSessionId);
          if (cancelled) return;
          const expiresAt = preview.expiresAt
            ? Date.parse(preview.expiresAt)
            : Date.now() + (preview.expiresIn || 15 * 60) * 1000;
          if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
            clearCheckoutCart();
            setCart(null);
            setDeveloperExpired(true);
            setMailExpiresAt(null);
            setPayError(null);
            return;
          }
          const nextCart: CheckoutCartState = {
            items: [],
            developer: {
              product: 'developer',
              sessionId: preview.sessionId,
              kind: preview.kind,
              title: preview.title,
              amount: preview.amount,
              currency: preview.currency,
              billingCycle: preview.billingCycle,
              appId: preview.appId,
              returnUrl: preview.returnUrl,
              expiresAt,
            },
          };
          saveCheckoutCart(nextCart);
          setCart(nextCart);
          setMailExpiresAt(expiresAt);
          setPayError(null);
        } catch (err) {
          if (!cancelled) {
            clearCheckoutCart();
            setCart(null);
            setMailExpiresAt(null);
            const code =
              err instanceof CheckoutApiError ? err.code : undefined;
            const expired =
              code === 'DEVELOPER_CHECKOUT_EXPIRED' ||
              (err instanceof CheckoutApiError && err.status === 410);
            setDeveloperExpired(expired);
            setPayError(
              expired
                ? null
                : err instanceof CheckoutApiError
                  ? err.message
                  : t('developerSessionLoadError'),
            );
          }
        }
      } else {
        const store = searchParams.get('store') || undefined;
        const coupon = searchParams.get('coupon') || undefined;
        const itemsRaw = searchParams.get('items');
        let items: CheckoutCartItem[] = [];

        if (itemsRaw) {
          try {
            const parsed = JSON.parse(itemsRaw) as CheckoutCartItem[];
            if (Array.isArray(parsed)) items = parsed;
          } catch {
            items = [];
          }
        }

        if (items.length > 0) {
          const existing = getCheckoutCart();
          if (
            existing?.storeSlug &&
            store &&
            existing.storeSlug !== store &&
            (existing.items?.length || 0) > 0
          ) {
            setMultiStoreNotice(true);
          }

          const nextCart: CheckoutCartState = {
            storeSlug: store,
            couponCode: coupon,
            items,
          };

          if (store) {
            try {
              const preview = await getStoreBySlug(store);
              if (!cancelled) {
                nextCart.storeId = preview.id;
                nextCart.storeName = preview.name;
              }
            } catch {
              // slug preview is optional; checkout still works from product ids
            }
          }

          if (!cancelled) {
            saveCheckoutCart(nextCart);
            setCart(nextCart);
          }
        } else {
          const stored = getCheckoutCart();
          if (!cancelled) setCart(stored);
        }
      }

      if (cancelled) return;

      const session = getCheckoutSession();
      if (session?.verified && session.accessToken) {
        setPhonePhase('verified');
        if (session.email) {
          setPreferEmail(true);
          setEmail(session.email);
        }
        setVerifiedPhone(session.phoneNumber || session.email || null);
        setSelectedId(session.selectedAddressId || null);
        if (session.phoneNumber) {
          const local = toLocalIraqPhone(session.phoneNumber);
          if (local) setReceiverPhone(local);
          // Digital checkouts skip address fetch.
          if (product !== 'mail' && product !== 'developer') {
            void loadAddresses(
              session.phoneNumber,
              session.selectedAddressId || null,
            );
          }
        } else if (product !== 'mail') {
          setShowNewAddress(true);
        }
      } else if (session?.otpId && (session.phoneNumber || session.email)) {
        setPhonePhase('otp');
        setOtpId(session.otpId);
        setCooldown(RESEND_SECONDS);
        if (session.email) {
          setPreferEmail(true);
          setEmail(session.email);
          setVerifiedPhone(null);
        } else {
          setPhone(toLocalIraqPhone(session.phoneNumber) || session.phoneNumber);
          setVerifiedPhone(session.phoneNumber);
        }
      }

      if (!cancelled) setHydrated(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from URL/session
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  // Digital checkout link soft-expiry while the page stays open (no countdown UI).
  useEffect(() => {
    if (!mailExpiresAt) return;
    const tick = () => {
      if (Date.now() >= mailExpiresAt) {
        const wasDeveloper = Boolean(getCheckoutCart()?.developer);
        clearCheckoutCart();
        setCart(null);
        if (wasDeveloper) {
          setDeveloperExpired(true);
        } else {
          setMailExpired(true);
        }
        setMailExpiresAt(null);
        setPayError(null);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [mailExpiresAt]);

  useEffect(() => {
    if (!orderSectionReady || isDigitalCheckout) {
      setPaymentOptions(null);
      return;
    }

    const productIds = (cart?.items || [])
      .map((item) => item.productId)
      .filter(Boolean);
    if (productIds.length === 0) {
      setPaymentOptions(null);
      return;
    }

    let cancelled = false;
    void getCheckoutPaymentOptions(productIds)
      .then((options) => {
        if (cancelled) return;
        setPaymentOptions(options);
        if (options.storeName || options.storeId) {
          setCart((prev) => {
            if (!prev) return prev;
            const next = {
              ...prev,
              storeId: options.storeId || prev.storeId,
              storeName: options.storeName || prev.storeName,
            };
            saveCheckoutCart(next);
            return next;
          });
        }
        setPaymentMethod((current) =>
          !options.cashOnDelivery && current === 'CASH'
            ? 'QASEH_CARD'
            : current,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPaymentOptions({ card: true, cashOnDelivery: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderSectionReady, isDigitalCheckout, cart?.items]);

  useEffect(() => {
    if (isDigitalCheckout) {
      setPaymentMethod('QASEH_CARD');
    }
  }, [isDigitalCheckout]);

  async function loadAddresses(
    e164: string,
    preferId: string | null,
  ): Promise<CheckoutAddress[]> {
    const localPhone = toLocalIraqPhone(e164);
    if (!localPhone) {
      setAddressError(t('errInvalidPhoneShort'));
      return [];
    }

    setAddressesLoading(true);
    setAddressError(null);
    try {
      const list = await listAddresses(localPhone);
      setAddresses(list);

      if (preferId && list.some((a) => a.id === preferId)) {
        setSelectedId(preferId);
      } else if (list.length > 0) {
        const preferred = list.find((a) => a.isDefault) || list[0];
        setSelectedId(preferred.id);
        updateCheckoutSession({ selectedAddressId: preferred.id });
      } else {
        setSelectedId(null);
        setShowNewAddress(true);
      }

      return list;
    } catch (err) {
      setAddressError(
        err instanceof CheckoutApiError ? err.message : t('errLoadAddresses'),
      );
      return [];
    } finally {
      setAddressesLoading(false);
    }
  }

  async function onRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError(null);

    if (itemCount === 0) {
      setPhoneError(t('errNoCheckoutSession'));
      return;
    }

    if (preferEmail) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setPhoneError(t('errEmailRequired'));
        return;
      }

      setPhoneLoading(true);
      try {
        const res = await requestCheckoutOtp({
          email: trimmedEmail,
          preferEmail: true,
        });

        saveCheckoutSession({
          accessToken: '',
          phoneNumber: '',
          email: trimmedEmail,
          verified: false,
          otpId: res.otpId,
          expiresAt: Date.now() + 2 * 60 * 60 * 1000,
        });

        setVerifiedPhone(null);
        setOtpId(res.otpId);
        setOtpCode('');
        setCooldown(RESEND_SECONDS);
        setPhonePhase('otp');
      } catch (err) {
        setPhoneError(
          err instanceof CheckoutApiError ? err.message : t('errSendOtp'),
        );
      } finally {
        setPhoneLoading(false);
      }
      return;
    }

    const e164 = toE164Iraq(phone);
    if (!e164) {
      setPhoneError(t('errInvalidPhone'));
      return;
    }

    setPhoneLoading(true);
    try {
      const res = await requestCheckoutOtp({
        phoneNumber: e164,
      });

      saveCheckoutSession({
        accessToken: '',
        phoneNumber: e164,
        verified: false,
        otpId: res.otpId,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      });

      setVerifiedPhone(e164);
      setOtpId(res.otpId);
      setOtpCode('');
      setCooldown(RESEND_SECONDS);
      setPhonePhase('otp');
    } catch (err) {
      setPhoneError(
        err instanceof CheckoutApiError ? err.message : t('errSendOtp'),
      );
    } finally {
      setPhoneLoading(false);
    }
  }

  async function onVerifyOtp(nextCode?: string) {
    const value = (nextCode ?? otpCode).trim();
    if (!otpId || value.length !== 6) return;

    if (itemCount === 0) {
      setPhoneError(t('errNoCheckoutSession'));
      return;
    }

    const trimmedEmail = email.trim();
    const e164 = verifiedPhone;
    if (preferEmail) {
      if (!trimmedEmail) return;
    } else if (!e164) {
      return;
    }

    setOtpLoading(true);
    setPhoneError(null);
    try {
      const res = await verifyCheckoutOtp({
        phoneNumber: e164 || undefined,
        email: preferEmail ? trimmedEmail : undefined,
        code: value,
        otpId,
      });
      const token = res.accessToken || res.token;
      if (!token) throw new Error(t('errNoToken'));

      const sessionPhone = e164 || res.phoneNumber || '';
      saveCheckoutSession({
        accessToken: token,
        phoneNumber: sessionPhone,
        email: preferEmail ? trimmedEmail : undefined,
        verified: true,
        userId: res.userId,
        otpId,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      });

      setPhonePhase('verified');
      if (sessionPhone) {
        setVerifiedPhone(sessionPhone);
        const local = toLocalIraqPhone(sessionPhone);
        if (local) setReceiverPhone(local);
        if (!cart?.mail) {
          await loadAddresses(sessionPhone, null);
        }
      } else {
        setVerifiedPhone(trimmedEmail);
        if (!cart?.mail) {
          setAddresses([]);
          setShowNewAddress(true);
        }
      }
    } catch (err) {
      setPhoneError(
        err instanceof CheckoutApiError ? err.message : t('errBadOtp'),
      );
    } finally {
      setOtpLoading(false);
    }
  }

  async function onResendOtp() {
    if (cooldown > 0) return;
    if (itemCount === 0) {
      setPhoneError(t('errNoCheckoutSession'));
      return;
    }
    const e164 = verifiedPhone;
    const trimmedEmail = email.trim();
    if (preferEmail ? !trimmedEmail : !e164) return;

    setResending(true);
    setPhoneError(null);
    try {
      const res = await resendCheckoutOtp({
        phoneNumber: preferEmail ? undefined : e164 || undefined,
        otpId: otpId || undefined,
        email: preferEmail ? trimmedEmail : undefined,
        preferEmail: preferEmail || undefined,
      });
      const session = getCheckoutSession();
      if (session) {
        saveCheckoutSession({
          ...session,
          otpId: res.otpId || session.otpId,
        });
      }
      setOtpId(res.otpId || otpId);
      setCooldown(RESEND_SECONDS);
      setOtpCode('');
    } catch (err) {
      setPhoneError(
        err instanceof CheckoutApiError ? err.message : t('errResend'),
      );
    } finally {
      setResending(false);
    }
  }

  function resetPhone() {
    setPhonePhase('input');
    setOtpCode('');
    setOtpId(null);
    setVerifiedPhone(null);
    setPhoneError(null);
    setAddresses([]);
    setSelectedId(null);
    setShowNewAddress(false);
    setAddressError(null);
    setPayError(null);
  }

  function selectAddress(id: string) {
    setSelectedId(id);
    setShowNewAddress(false);
    updateCheckoutSession({ selectedAddressId: id });
    setAddressError(null);
  }

  async function onSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressError(null);

    const session = getCheckoutSession();
    if (!session?.verified || !session.accessToken) {
      setAddressError(t('errVerifyFirst'));
      return;
    }

    const ownerPhone = toLocalIraqPhone(session.phoneNumber);
    if (!ownerPhone) {
      setAddressError(t('errInvalidPhoneShort'));
      return;
    }

    if (!landmark.trim()) setLandmarkWarning(true);

    if (fullName.trim().length < 3) {
      setAddressError(t('errNameShort'));
      return;
    }
    if (street.trim().length < 5) {
      setAddressError(t('errStreetShort'));
      return;
    }
    if (!/^07[3-9][0-9]{8}$/.test(receiverPhone)) {
      setAddressError(t('errReceiverPhone'));
      return;
    }

    setSavingAddress(true);
    try {
      const created = await createAddress({
        phoneNumber: ownerPhone,
        label: label.trim() || t('defaultLabel'),
        fullName: fullName.trim(),
        city,
        district: district.trim() || undefined,
        street: street.trim(),
        buildingNo: buildingNo.trim() || undefined,
        floor: floor.trim() || undefined,
        apartmentNo: apartmentNo.trim() || undefined,
        landmark: landmark.trim() || undefined,
        country: t('defaultCountry'),
        isDefault: true,
      });

      updateCheckoutSession({ selectedAddressId: created.id });
      setAddresses((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
      setSelectedId(created.id);
      setShowNewAddress(false);
      setFullName('');
      setStreet('');
      setDistrict('');
      setBuildingNo('');
      setFloor('');
      setApartmentNo('');
      setLandmark('');
      setLandmarkWarning(false);
    } catch (err) {
      setAddressError(
        err instanceof CheckoutApiError ? err.message : t('errSaveAddress'),
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function startPayment() {
    const session = getCheckoutSession();
    if (!session?.verified || !session.accessToken) {
      setPayError(t('errVerifyFirst'));
      return;
    }

    // —— Mail digital plan (no shipping address) ——
    if (cart?.mail?.sessionId) {
      setPaying(true);
      setPayError(null);
      try {
        const result = await payMailCheckoutSession(cart.mail.sessionId);
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return;
        }
        setPayError(t('errNoPayUrl'));
        setPaying(false);
      } catch (err) {
        if (
          err instanceof CheckoutApiError &&
          (err.status === 410 || err.code === 'MAIL_CHECKOUT_EXPIRED')
        ) {
          clearCheckoutCart();
          setCart(null);
          setMailExpired(true);
          setMailExpiresAt(null);
          setPaying(false);
          return;
        }
        setPayError(
          err instanceof CheckoutApiError ? err.message : t('errCreateOrder'),
        );
        setPaying(false);
      }
      return;
    }

    // —— Developer wallet / Pro (no shipping address) ——
    if (cart?.developer?.sessionId) {
      setPaying(true);
      setPayError(null);
      try {
        const result = await payDeveloperCheckoutSession(
          cart.developer.sessionId,
        );
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return;
        }
        setPayError(t('errNoPayUrl'));
        setPaying(false);
      } catch (err) {
        if (
          err instanceof CheckoutApiError &&
          (err.status === 410 || err.code === 'DEVELOPER_CHECKOUT_EXPIRED')
        ) {
          clearCheckoutCart();
          setCart(null);
          setDeveloperExpired(true);
          setMailExpiresAt(null);
          setPaying(false);
          return;
        }
        setPayError(
          err instanceof CheckoutApiError ? err.message : t('errCreateOrder'),
        );
        setPaying(false);
      }
      return;
    }

    if (!selectedId) {
      setPayError(t('errSelectAddress'));
      return;
    }

    const items = cart?.items || [];
    if (items.length === 0) {
      setPayError(t('errEmptyCart'));
      return;
    }

    setPaying(true);
    setPayError(null);
    updateCheckoutSession({ selectedAddressId: selectedId });

    try {
      const result = await createCheckoutOrder({
        shippingAddressId: selectedId,
        paymentMethod,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
        })),
        couponCode: cart?.couponCode,
        phoneNumber: toLocalIraqPhone(session.phoneNumber) || undefined,
      });

      const order = result.orders?.[0];

      if (paymentMethod === 'CASH' && order?.orderNumber) {
        const storeQuery = cart?.storeSlug
          ? `&store=${encodeURIComponent(cart.storeSlug)}`
          : '';
        router.push(
          `/success?orders=${encodeURIComponent(order.orderNumber)}&paymentMethod=cash${storeQuery}`,
        );
        return;
      }

      const paymentUrl = result.payment?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      if (order?.id) {
        router.push(
          `/pending?orderId=${encodeURIComponent(order.id)}&orders=${encodeURIComponent(order.orderNumber)}`,
        );
        return;
      }

      setPayError(result.message || t('errNoPayUrl'));
      setPaying(false);
    } catch (err) {
      setPayError(
        err instanceof CheckoutApiError ? err.message : t('errCreateOrder'),
      );
      setPaying(false);
    }
  }

  if (!hydrated) {
    return (
      <CheckoutShell
        title={t('pageTitle')}
        description={t('preparing')}
        aboveTitle={<InvoiceSummary cart={cart} />}
        wide
      >
        <div className="flex items-center justify-center gap-2 rounded-[1.35rem] bg-zinc-100 py-10 text-[13px] text-zinc-500">
          <Spinner size="sm" label={t('moments')} />
          {t('moments')}
        </div>
      </CheckoutShell>
    );
  }

  if (mailExpired) {
    const mailHome =
      process.env.NEXT_PUBLIC_MAIL_URL?.replace(/\/$/, '') ||
      'http://localhost:3009';
    return (
      <CheckoutShell
        title={t('mailSessionExpiredTitle')}
        description={t('mailSessionExpiredDescription')}
        wide
      >
        <SoftPanel className="space-y-4 text-center">
          <p className="text-[14px] leading-relaxed text-zinc-600">
            {t('mailSessionExpiredDescription')}
          </p>
          <Button
            className={checkoutCtaClass}
            size="lg"
            onClick={() => {
              window.location.href = `${mailHome}/billing`;
            }}
          >
            {t('mailSessionExpiredAction')}
          </Button>
        </SoftPanel>
      </CheckoutShell>
    );
  }

  if (developerExpired) {
    const developersHome =
      process.env.NEXT_PUBLIC_DEVELOPERS_URL?.replace(/\/$/, '') ||
      'https://developers.rukny.io';
    return (
      <CheckoutShell
        title={t('developerSessionExpiredTitle')}
        description={t('developerSessionExpiredDescription')}
        wide
      >
        <SoftPanel className="space-y-4 text-center">
          <p className="text-[14px] leading-relaxed text-zinc-600">
            {t('developerSessionExpiredDescription')}
          </p>
          <Button
            className={checkoutCtaClass}
            size="lg"
            onClick={() => {
              window.location.href = `${developersHome}/settings/platform`;
            }}
          >
            {t('developerSessionExpiredAction')}
          </Button>
        </SoftPanel>
      </CheckoutShell>
    );
  }

  if (itemCount === 0) {
    const product = searchParams.get('product');
    const variant =
      product === 'mail'
        ? 'mail'
        : product === 'developer'
          ? 'developer'
          : 'store';

    return (
      <EmptyCheckoutState
        variant={variant}
        detail={payError}
        storeName={cart?.storeName}
      />
    );
  }

  return (
    <CheckoutShell
      title={t('pageTitle')}
      description={
        isMailCheckout
          ? t('mailCheckoutDescription')
          : isDeveloperCheckout
            ? t('developerCheckoutDescription')
            : t('pageDescription')
      }
      aboveTitle={<InvoiceSummary cart={cart} />}
      wide
    >
      <div className="space-y-4">
        {multiStoreNotice ? (
          <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <FormAlert>{t('multiStoreConflict')}</FormAlert>
          </div>
        ) : null}

        {!isDigitalCheckout && cart?.storeName ? (
          <p className="px-0.5 text-[13px] leading-relaxed text-zinc-500">
            {t('invoiceStore')}:{' '}
            <span className="font-medium text-zinc-800">{cart.storeName}</span>
            <span className="mx-1.5 text-zinc-300">·</span>
            {t('multiStoreHint')}
          </p>
        ) : null}

        {/* —— 1. Phone —— */}
        <section
          className="checkout-section-enter"
          aria-labelledby="checkout-phone-heading"
        >
          <TicketShell
            tabPlacement="top"
            measureKey={`${phonePhase}-${preferEmail}-${phoneError || ''}-${otpCode.length}`}
            tab={
              phonePhase === 'input' ? (
                <div className="max-w-[15rem] space-y-1.5">
                  <div
                    role="tablist"
                    aria-label={t('channelAria')}
                    dir="ltr"
                    className="inline-flex gap-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!preferEmail}
                      onClick={() => {
                        setPreferEmail(false);
                        setPhoneError(null);
                      }}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors',
                        !preferEmail
                          ? 'bg-zinc-900 text-white'
                          : 'bg-white/80 text-zinc-500 hover:text-zinc-900',
                      )}
                    >
                      <MessageCircle className="size-3" aria-hidden />
                      {t('tabWhatsapp')}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={preferEmail}
                      onClick={() => {
                        setPreferEmail(true);
                        setPhoneError(null);
                      }}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors',
                        preferEmail
                          ? 'bg-zinc-900 text-white'
                          : 'bg-white/80 text-zinc-500 hover:text-zinc-900',
                      )}
                    >
                      <Mail className="size-3" aria-hidden />
                      {t('tabEmail')}
                    </button>
                  </div>
                  <p className="flex items-start gap-1 text-[11px] leading-snug text-zinc-500">
                    <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
                    {t('channelSwitchHint')}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium tracking-wide text-zinc-500">
                    {preferEmail ? t('tabEmail') : t('tabWhatsapp')}
                  </span>
                  {phonePhase === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                      <Check className="size-3" aria-hidden />
                      {t('phoneVerified')}
                    </span>
                  ) : null}
                </div>
              )
            }
            body={
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full',
                      phonePhase === 'verified'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-white/90 text-zinc-600',
                    )}
                  >
                    {phonePhase === 'verified' ? (
                      <ShieldCheck className="size-4" aria-hidden />
                    ) : preferEmail ? (
                      <Mail className="size-4" aria-hidden />
                    ) : (
                      <MessageCircle className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="checkout-phone-heading"
                      className="text-[15px] font-semibold leading-tight tracking-tight text-zinc-900"
                    >
                      {phonePhase === 'verified'
                        ? t('phoneVerified')
                        : preferEmail
                          ? t('phoneSectionEmail')
                          : t('phoneSectionWhatsapp')}
                    </h2>
                    {phonePhase === 'verified' && verifiedPhone ? (
                      <p
                        className="mt-0.5 truncate text-[13px] tabular-nums text-zinc-500"
                        dir="ltr"
                      >
                        {verifiedPhone.includes('@')
                          ? verifiedPhone
                          : maskPhone(verifiedPhone)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[13px] text-zinc-500">
                        {t('phoneSection')}
                      </p>
                    )}
                  </div>
                  {phonePhase === 'verified' ? (
                    <TextLink onClick={resetPhone} className="ms-auto shrink-0">
                      {t('change')}
                    </TextLink>
                  ) : null}
                </div>

                {phonePhase === 'input' ? (
                  <form
                    key="phone-input"
                    onSubmit={onRequestOtp}
                    className="checkout-phase-enter space-y-3"
                  >
                    {preferEmail ? (
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('emailLabel')}</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          dir="ltr"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          aria-invalid={Boolean(phoneError)}
                          className="h-11"
                        />
                        <FieldHint>{t('emailHint')}</FieldHint>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('phoneLabel')}</Label>
                        <Input
                          id="phone"
                          name="phone"
                          dir="ltr"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="07701234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          aria-invalid={Boolean(phoneError)}
                          className="h-11"
                        />
                        <FieldHint>{t('phoneHint')}</FieldHint>
                      </div>
                    )}

                    {phoneError ? <FormAlert>{phoneError}</FormAlert> : null}

                    <Button
                      type="submit"
                      className={checkoutCtaClass}
                      size="lg"
                      disabled={phoneLoading}
                    >
                      {phoneLoading ? (
                        <>
                          <Spinner size="sm" label={t('sending')} />
                          {t('sending')}
                        </>
                      ) : preferEmail ? (
                        <>
                          <Mail className="size-4" aria-hidden />
                          {t('sendOtpEmail')}
                        </>
                      ) : (
                        <>
                          <MessageCircle className="size-4" aria-hidden />
                          {t('sendOtpWhatsapp')}
                        </>
                      )}
                    </Button>
                  </form>
                ) : null}

                {phonePhase === 'otp' &&
                (verifiedPhone || (preferEmail && email.trim())) ? (
                  <div key="otp" className="checkout-phase-enter space-y-4">
                    <p className="text-[13px] leading-5 text-zinc-500">
                      {t('otpSentTo')}{' '}
                      <span className="font-medium text-zinc-900" dir="ltr">
                        {preferEmail && email.trim()
                          ? email.trim()
                          : maskPhone(verifiedPhone || '')}
                      </span>
                    </p>

                    <OtpCodeInput
                      value={otpCode}
                      onChange={(value) => {
                        setOtpCode(value);
                        if (value.length === 6) void onVerifyOtp(value);
                      }}
                      disabled={otpLoading}
                      aria-label={t('otpAria')}
                      aria-invalid={Boolean(phoneError)}
                    />

                    {phoneError ? <FormAlert>{phoneError}</FormAlert> : null}

                    <Button
                      className={checkoutCtaClass}
                      size="lg"
                      disabled={otpLoading || otpCode.length !== 6}
                      onClick={() => void onVerifyOtp()}
                    >
                      {otpLoading ? (
                        <>
                          <Spinner size="sm" label={t('verifying')} />
                          {t('verifying')}
                        </>
                      ) : (
                        t('confirmCode')
                      )}
                    </Button>

                    <div className="flex items-center justify-between gap-3">
                      <TextLink onClick={resetPhone}>{t('changeNumber')}</TextLink>
                      <TextLink
                        disabled={cooldown > 0 || resending}
                        onClick={() => void onResendOtp()}
                      >
                        {resending
                          ? t('sending')
                          : cooldown > 0
                            ? t('resendIn', { s: cooldown })
                            : t('resendCode')}
                      </TextLink>
                    </div>
                  </div>
                ) : null}
              </div>
            }
          />
        </section>

        {/* —— 2. Address (physical carts only) —— */}
        {!isDigitalCheckout ? (
        <section
          className={cn(
            'checkout-section-enter space-y-4 rounded-[1.35rem] bg-zinc-100 p-5 transition-opacity duration-300 sm:p-6',
            phonePhase !== 'verified' && 'pointer-events-none opacity-45',
            phonePhase === 'verified' && 'animate-in fade-in-0 duration-300',
          )}
          aria-labelledby="checkout-address-heading"
          aria-disabled={phonePhase !== 'verified'}
        >
          <SectionHeading
            id="checkout-address-heading"
            index={2}
            title={t('addressSection')}
            done={Boolean(selectedAddress) && !showNewAddress}
          />

          {phonePhase !== 'verified' ? (
            <p className="text-[13px] leading-5 text-zinc-500">{t('addressLocked')}</p>
          ) : addressesLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-zinc-500">
              <Spinner size="sm" label={t('loadingAddresses')} />
              {t('loadingAddresses')}
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.length === 0 && !showNewAddress ? (
                <div className="rounded-2xl bg-white px-4 py-8 text-center">
                  <MapPin className="mx-auto mb-3 size-7 text-zinc-400" />
                  <p className="text-[13px] text-zinc-500">{t('noAddresses')}</p>
                </div>
              ) : null}

              {addresses.length > 0 && !showNewAddress ? (
                <ul className="space-y-2.5">
                  {addresses.map((address) => {
                    const active = selectedId === address.id;
                    return (
                      <li key={address.id}>
                        <button
                          type="button"
                          onClick={() => selectAddress(address.id)}
                          className={cn(
                            'w-full rounded-2xl bg-white p-4 text-start transition-colors duration-200',
                            active
                              ? 'ring-2 ring-primary/30'
                              : 'hover:bg-white/80',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <p className="text-[15px] font-medium text-zinc-900">
                                {address.label}
                                <span className="text-zinc-400"> · </span>
                                {address.fullName}
                              </p>
                              <p className="text-[13px] leading-5 text-zinc-500">
                                {address.city}
                                {address.district ? `، ${address.district}` : ''} —{' '}
                                {address.street}
                                {address.landmark
                                  ? ` · ${t('nearLandmark')} ${address.landmark}`
                                  : ''}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full transition',
                                active
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-zinc-100 text-transparent',
                              )}
                            >
                              <Check className="size-3.5" />
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {!showNewAddress ? (
                <Button
                  type="button"
                  variant="secondary"
                  className={checkoutSecondaryCtaClass}
                  size="lg"
                  onClick={() => setShowNewAddress(true)}
                >
                  <Plus className="size-4" />
                  {t('newAddress')}
                </Button>
              ) : (
                <form
                  onSubmit={onSaveAddress}
                  className="space-y-4 rounded-2xl bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-medium text-zinc-900">
                      {t('newAddress')}
                    </p>
                    {addresses.length > 0 ? (
                      <TextLink
                        onClick={() => {
                          setShowNewAddress(false);
                          setAddressError(null);
                        }}
                      >
                        {t('cancel')}
                      </TextLink>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="label">{t('labelField')}</Label>
                      <Input
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={t('labelPlaceholder')}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t('fullName')}</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('fullNamePlaceholder')}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiverPhone">{t('receiverPhone')}</Label>
                    <Input
                      id="receiverPhone"
                      dir="ltr"
                      inputMode="tel"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      placeholder="07701234567"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('city')}</Label>
                      <select
                        id="city"
                        className="checkout-field"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      >
                        {IRAQI_GOVERNORATES.map((g) => (
                          <option key={g.ar} value={g.ar}>
                            {governorateLabel(g, locale)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">{t('district')}</Label>
                      <Input
                        id="district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder={t('districtPlaceholder')}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street">{t('street')}</Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder={t('streetPlaceholder')}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="buildingNo">{t('building')}</Label>
                      <Input
                        id="buildingNo"
                        value={buildingNo}
                        onChange={(e) => setBuildingNo(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floor">{t('floor')}</Label>
                      <Input
                        id="floor"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apartmentNo">{t('apartment')}</Label>
                      <Input
                        id="apartmentNo"
                        value={apartmentNo}
                        onChange={(e) => setApartmentNo(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landmark">{t('landmark')}</Label>
                    <Input
                      id="landmark"
                      value={landmark}
                      onChange={(e) => {
                        setLandmark(e.target.value);
                        if (e.target.value.trim()) setLandmarkWarning(false);
                      }}
                      placeholder={t('landmarkPlaceholder')}
                      className="h-11"
                    />
                    {landmarkWarning && !landmark.trim() ? (
                      <FormAlert tone="warning">{t('landmarkWarning')}</FormAlert>
                    ) : (
                      <FieldHint>{t('landmarkHint')}</FieldHint>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className={checkoutCtaClass}
                    size="lg"
                    disabled={savingAddress}
                  >
                    {savingAddress ? (
                      <>
                        <Spinner size="sm" label={t('saving')} />
                        {t('saving')}
                      </>
                    ) : (
                      t('saveAddress')
                    )}
                  </Button>
                </form>
              )}

              {addressError ? (
                <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  <FormAlert>{addressError}</FormAlert>
                </div>
              ) : null}
            </div>
          )}
        </section>
        ) : null}

        {/* —— 3. Order + pay —— */}
        <section
          className={cn(
            'checkout-section-enter space-y-4 rounded-[1.35rem] bg-zinc-100 p-5 transition-opacity duration-300 sm:p-6',
            !orderSectionReady && 'pointer-events-none opacity-45',
            orderSectionReady && 'animate-in fade-in-0 duration-300',
          )}
          aria-labelledby="checkout-order-heading"
          aria-disabled={!orderSectionReady}
        >
          <SectionHeading
            id="checkout-order-heading"
            index={isDigitalCheckout ? 2 : 3}
            title={t('orderSection')}
            done={orderSectionReady && canPay}
          />

          {!orderSectionReady ? (
            <SoftPanel className="text-[13px] text-zinc-500">
              {t('orderSectionLocked')}
            </SoftPanel>
          ) : null}

          {isMailCheckout && cart?.mail && phonePhase === 'verified' ? (
            <SoftPanel>
              <p className="text-[13px] text-zinc-500">Rukny Mail</p>
              <p className="mt-1 text-[15px] font-medium text-zinc-900">
                {cart.mail.planName} · {cart.mail.appName}
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-zinc-500">
                {cart.mail.kind === 'outbound_pack'
                  ? `${(cart.mail.outboundPackEmails || 0).toLocaleString('en-US')} outbound emails · ${(cart.mail.totalAmount ?? cart.mail.amount + (cart.mail.taxIqd ?? 400)).toLocaleString('en-US')} ${cart.mail.currency}`
                  : `${cart.mail.mailboxCount} ${
                      cart.mail.mailboxCount === 1 ? 'seat' : 'seats'
                    } · ${(cart.mail.totalAmount ?? cart.mail.amount + (cart.mail.taxIqd ?? 400)).toLocaleString('en-US')} ${cart.mail.currency}/mo`}
              </p>
            </SoftPanel>
          ) : null}

          {isDeveloperCheckout && cart?.developer && phonePhase === 'verified' ? (
            <SoftPanel>
              <p className="text-[13px] text-zinc-500">Rukny Developers</p>
              <p className="mt-1 text-[15px] font-medium text-zinc-900">
                {cart.developer.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-zinc-500">
                {cart.developer.amount.toLocaleString('en-US')}{' '}
                {cart.developer.currency}
                {cart.developer.billingCycle
                  ? ` · ${cart.developer.billingCycle === 'YEARLY' ? t('invoiceDeveloperYearly') : t('invoiceDeveloperMonthly')}`
                  : ''}
              </p>
            </SoftPanel>
          ) : null}

          {selectedAddress && phonePhase === 'verified' && !isDigitalCheckout ? (
            <SoftPanel>
              <p className="text-[13px] text-zinc-500">{t('deliverTo')}</p>
              <p className="mt-1 text-[15px] font-medium text-zinc-900">
                {selectedAddress.label} · {selectedAddress.fullName}
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-zinc-500">
                {governorateDisplayName(selectedAddress.city, locale)}
                {selectedAddress.district
                  ? `${locale === 'ar' ? '، ' : ', '}${selectedAddress.district}`
                  : ''}{' '}
                — {selectedAddress.street}
              </p>
            </SoftPanel>
          ) : null}

          {itemCount === 0 ? (
            <SoftPanel className="text-[13px] text-zinc-500">
              {t('emptyCart')}
            </SoftPanel>
          ) : null}

          {orderSectionReady ? (
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-zinc-700">
                {t('paymentMethodLabel')}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QASEH_CARD')}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl bg-white p-4 text-start transition-colors',
                    paymentMethod === 'QASEH_CARD'
                      ? 'ring-2 ring-zinc-900'
                      : 'ring-1 ring-zinc-200/80 hover:ring-zinc-300',
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-primary">
                    <CreditCard className="size-4" />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium text-zinc-900">
                      {t('cardPay')}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-5 text-zinc-500">
                      {t('cardPayHint')}
                    </p>
                  </div>
                </button>

                {showCodOption ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl bg-white p-4 text-start transition-colors',
                      paymentMethod === 'CASH'
                        ? 'ring-2 ring-zinc-900'
                        : 'ring-1 ring-zinc-200/80 hover:ring-zinc-300',
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-primary">
                      <Banknote className="size-4" />
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-zinc-900">
                        {t('codPay')}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-5 text-zinc-500">
                        {t('codPayHint')}
                      </p>
                    </div>
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {payError ? <FormAlert>{payError}</FormAlert> : null}

          <Button
            className={checkoutCtaClass}
            size="lg"
            disabled={!canPay}
            onClick={() => void startPayment()}
          >
            {paying ? (
              <>
                <Spinner
                  size="sm"
                  label={
                    paymentMethod === 'CASH' ? t('placingOrder') : t('openingPay')
                  }
                />
                {paymentMethod === 'CASH' ? t('placingOrder') : t('openingPay')}
              </>
            ) : paymentMethod === 'CASH' && !isDigitalCheckout ? (
              t('confirmOrder')
            ) : (
              t('payNow')
            )}
          </Button>

          {!canPay &&
          phonePhase === 'verified' &&
          !isDigitalCheckout &&
          !selectedId ? (
            <p className="text-center text-[13px] text-zinc-500 animate-in fade-in-0 duration-200">
              {t('needAddress')}
            </p>
          ) : null}
        </section>
      </div>
    </CheckoutShell>
  );
}

function SectionHeading({
  id,
  index,
  title,
  done,
}: {
  id: string;
  index: number;
  title: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums transition-colors duration-300',
          done
            ? 'bg-emerald-600 text-white'
            : 'bg-zinc-900 text-white',
        )}
      >
        {done ? (
          <Check className="size-3.5 animate-in zoom-in-50 duration-200" />
        ) : (
          index
        )}
      </span>
      <h2
        id={id}
        className="text-[15px] font-semibold tracking-tight text-zinc-900"
      >
        {title}
      </h2>
    </div>
  );
}
