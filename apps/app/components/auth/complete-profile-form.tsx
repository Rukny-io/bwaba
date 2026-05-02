'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Button,
  Input,
  Label,
  Spinner,
  TextField,
  TextArea,
  Select,
  ListBox,
  FieldError,
  InputOTP,
  Alert,
  Card,
} from '@heroui/react';
import { updateProfile, checkUsernameAvailable, sendPhoneOtp, verifyPhoneOtp, ApiError } from '@/lib/api/auth';
import { setup2FA, verify2FASetup } from '@/lib/api/user';
import { useAuth } from '@/providers/auth-provider';

// ─── Store Categories ────────────────────────────────────────

const STORE_CATEGORIES = [
  { slug: 'electronics', nameAr: 'الإلكترونيات' },
  { slug: 'fashion', nameAr: 'الأزياء والموضة' },
  { slug: 'food', nameAr: 'الطعام والمشروبات' },
  { slug: 'beauty', nameAr: 'الجمال والعناية' },
  { slug: 'home', nameAr: 'المنزل والأثاث' },
  { slug: 'sports', nameAr: 'الرياضة واللياقة' },
  { slug: 'books', nameAr: 'الكتب والتعليم' },
  { slug: 'toys', nameAr: 'الألعاب والأطفال' },
  { slug: 'automotive', nameAr: 'السيارات والمركبات' },
  { slug: 'health', nameAr: 'الصحة والطب' },
  { slug: 'jewelry', nameAr: 'المجوهرات والإكسسوارات' },
  { slug: 'general', nameAr: 'متجر عام' },
];

const EMPLOYEES_OPTIONS = [
  { value: 'solo', label: 'فقط أنا' },
  { value: '2-5', label: '٢ - ٥ موظفين' },
  { value: '6-10', label: '٦ - ١٠ موظفين' },
  { value: '11-50', label: '١١ - ٥٠ موظفاً' },
  { value: '50+', label: 'أكثر من ٥٠ موظفاً' },
];

// ─── Helpers ─────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? 'bg-zinc-900 dark:bg-white w-6'
              : i === current
              ? 'bg-zinc-900 dark:bg-white w-8'
              : 'bg-zinc-200 dark:bg-zinc-700 w-6'
          }`}
        />
      ))}
    </div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-6">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
      <p className="text-[13px] text-zinc-500 mt-1">{subtitle}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-600 dark:text-red-400 text-sm text-center">
      {message}
    </div>
  );
}

// ─── Step 1: Personal Profile ─────────────────────────────────

interface Step1Data { name: string; username: string; }

function Step1Profile({ data, onChange, onNext }: {
  data: Step1Data;
  onChange: (d: Partial<Step1Data>) => void;
  onNext: () => void;
}) {
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced username availability check
  useEffect(() => {
    const username = data.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkUsernameAvailable(username);
        setUsernameStatus(available ? 'available' : 'taken');
        if (!available) setUsernameError('اسم المستخدم مأخوذ. اختر اسماً آخر.');
        else setUsernameError(null);
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [data.username]);

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setUsernameError(null);
    const name = data.name.trim();
    const username = data.username.trim().toLowerCase();
    let valid = true;
    if (!name || name.length < 2) { setNameError('أدخل الاسم الكامل (حرفان على الأقل).'); valid = false; }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) { setUsernameError('3-30 حرف لاتيني أو أرقام أو _ فقط.'); valid = false; }
    if (usernameStatus === 'taken') { setUsernameError('اسم المستخدم مأخوذ. اختر اسماً آخر.'); valid = false; }
    if (usernameStatus === 'checking') { setUsernameError('جارٍ التحقق من اسم المستخدم...'); valid = false; }
    if (valid) onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <StepHeader
        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        title="الملف الشخصي"
        subtitle="أدخل اسمك الكامل واسم المستخدم"
      />

      <TextField fullWidth isRequired isInvalid={!!nameError}>
        <Label>الاسم الكامل</Label>
        <Input
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="مثال: أحمد محمد"
          autoComplete="name"
          autoFocus
        />
        {nameError && <FieldError>{nameError}</FieldError>}
      </TextField>

      <TextField fullWidth isRequired isInvalid={!!usernameError || usernameStatus === 'taken'}>
        <Label>اسم المستخدم</Label>
        <div className="relative">
          <Input
            value={data.username}
            onChange={(e) => { onChange({ username: e.target.value }); setUsernameError(null); }}
            placeholder="مثال: ahmed_store"
            autoComplete="username"
            dir="ltr"
            className="text-left"
          />
          {usernameStatus === 'checking' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><Spinner size="sm" /></span>
          )}
          {usernameStatus === 'available' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          )}
          {usernameStatus === 'taken' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </span>
          )}
        </div>
        {usernameError ? (
          <FieldError>{usernameError}</FieldError>
        ) : usernameStatus === 'available' ? (
          <p className="text-[11px] text-emerald-500 mt-1">اسم المستخدم متاح ✓</p>
        ) : (
          <p className="text-[11px] text-zinc-400 mt-1">3-30 حرف لاتيني، أرقام أو _ فقط</p>
        )}
      </TextField>

      <Button type="submit" variant="primary" fullWidth className="rounded-full mt-2" isDisabled={usernameStatus === 'checking' || usernameStatus === 'taken'}>
        التالي
      </Button>
    </form>
  );
}

// ─── Step 2: Store Info ───────────────────────────────────────

interface Step2Data {
  storeCategory: string; employeesCount: string; phone: string;
  storeDescription: string; storeAddress: string; storeCountry: string; storeCity: string;
}

function Step2Store({ data, onChange, onNext, onBack, isPending, error }: {
  data: Step2Data;
  onChange: (d: Partial<Step2Data>) => void;
  onNext: () => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [phoneVerifyPhase, setPhoneVerifyPhase] = useState<'idle' | 'sending' | 'otp' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOtp = async () => {
    const phone = data.phone.trim();
    if (!phone) { setLocalError('أدخل رقم الهاتف أولاً.'); return; }
    setLocalError(null);
    setOtpError(null);
    setPhoneVerifyPhase('sending');
    try {
      await sendPhoneOtp(phone);
      setPhoneVerifyPhase('otp');
    } catch (err) {
      setPhoneVerifyPhase('idle');
      setLocalError(err instanceof ApiError ? err.message : 'تعذّر إرسال رمز التحقق. حاول مجدداً.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) { setOtpError('أدخل الرمز المكوّن من 6 أرقام.'); return; }
    setOtpError(null);
    setIsVerifying(true);
    try {
      await verifyPhoneOtp(data.phone.trim(), otpCode);
      setPhoneVerifyPhase('verified');
    } catch (err) {
      setOtpCode('');
      setOtpError(err instanceof ApiError ? err.message : 'الرمز غير صحيح أو منتهي الصلاحية.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!data.storeCategory) { setLocalError('اختر تصنيف المتجر.'); return; }
    if (!data.phone.trim()) { setLocalError('رقم الهاتف مطلوب.'); return; }
    onNext();
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <StepHeader
        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        title="معلومات المتجر"
        subtitle="ساعدنا في تخصيص تجربتك"
      />

      {displayError && <ErrorBanner message={displayError} />}

      {/* Store Category Select */}
      <div className="space-y-1.5">
        <Select
          isRequired
          isDisabled={isPending}
          selectedKey={data.storeCategory || null}
          onSelectionChange={(key) => onChange({ storeCategory: key as string })}
          placeholder="اختر تصنيفاً..."
          fullWidth
        >
          <Label>تصنيف المتجر</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover className="max-h-64 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" dir="rtl">
            <ListBox className="">
              {STORE_CATEGORIES.map((c) => (
                <ListBox.Item key={c.slug} id={c.slug} textValue={c.nameAr}>
                  {c.nameAr}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Employees Select */}
      <div className="space-y-1.5">
        <Select
          isDisabled={isPending}
          selectedKey={data.employeesCount || null}
          onSelectionChange={(key) => onChange({ employeesCount: key as string })}
          placeholder="اختر..."
          fullWidth
        >
          <Label>عدد الموظفين</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover dir="rtl">
            <ListBox>
              {EMPLOYEES_OPTIONS.map((o) => (
                <ListBox.Item key={o.value} id={o.value} textValue={o.label}>
                  {o.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <TextField fullWidth isRequired isDisabled={isPending || phoneVerifyPhase === 'verified'}>
          <Label>رقم الهاتف</Label>
          <Input
            type="tel"
            value={data.phone}
            onChange={(e) => { onChange({ phone: e.target.value }); setPhoneVerifyPhase('idle'); setOtpCode(''); setOtpError(null); }}
            placeholder="+964 770 000 0000"
            dir="ltr"
            className="text-left"
          />
          {phoneVerifyPhase === 'verified' ? (
            <p className="text-[11px] text-emerald-500 mt-1">✓ تم التحقق من رقم الهاتف عبر واتساب</p>
          ) : (
            <p className="text-[11px] text-zinc-400 mt-1">يُستخدم للتواصل والتحقق</p>
          )}
        </TextField>
      </div>

      {/* Description */}
      <TextField fullWidth isDisabled={isPending}>
        <Label>وصف المتجر</Label>
        <TextArea
          value={data.storeDescription}
          onChange={(e) => onChange({ storeDescription: e.target.value })}
          placeholder="اكتب وصفاً مختصراً لمتجرك..."
          rows={3}
          maxLength={500}
        />
      </TextField>

      {/* Country + City */}
      <div className="grid grid-cols-2 gap-3">
        <TextField fullWidth isDisabled={isPending}>
          <Label>الدولة</Label>
          <Input value={data.storeCountry} onChange={(e) => onChange({ storeCountry: e.target.value })} placeholder="العراق" />
        </TextField>
        <TextField fullWidth isDisabled={isPending}>
          <Label>المحافظة</Label>
          <Input value={data.storeCity} onChange={(e) => onChange({ storeCity: e.target.value })} placeholder="بغداد" />
        </TextField>
      </div>

      {/* Address */}
      <TextField fullWidth isDisabled={isPending}>
        <Label>عنوان المتجر</Label>
        <Input value={data.storeAddress} onChange={(e) => onChange({ storeAddress: e.target.value })} placeholder="الشارع والحي" />
      </TextField>

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" isDisabled={isPending} onPress={onBack} fullWidth className="rounded-full">
          رجوع
        </Button>
        <Button type="submit" variant="primary" isPending={isPending} isDisabled={isPending} fullWidth className="rounded-full">
          التالي
        </Button>
      </div>
    </form>
  );
}

// ─── Step 3: Two-Factor Authentication ───────────────────────

function Step32FA({ onNext, onBack }: { onNext: (enabled: boolean) => void; onBack: () => void }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'choose' | 'scan' | 'verify'>('choose');

  const handleSelectAuthenticator = async () => {
    // Don't re-fetch if QR already generated (prevent secret regeneration)
    if (qrCode) { setPhase('scan'); return; }
    setIsPending(true);
    setError(null);
    try {
      const res = await setup2FA();
      setQrCode(res.qrCode);
      setSecret(res.secret);
      setPhase('scan');
    } catch {
      setError('تعذّر تهيئة المصادقة الثنائية. أعد المحاولة.');
    } finally {
      setIsPending(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) { setError('أدخل الرمز المكوّن من 6 أرقام.'); return; }
    setIsPending(true);
    try {
      await verify2FASetup(code);
      onNext(true);
    } catch (err) {
      setError(err instanceof ApiError ? (err.message || 'الرمز غير صحيح.') : 'تعذّر التحقق.');
    } finally {
      setIsPending(false);
    }
  };

  if (phase === 'choose') {
    return (
      <div className="space-y-5">
        <StepHeader
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
          title="تأمين حسابك"
          subtitle="المصادقة الثنائية تحمي حسابك حتى لو سُرّبت كلمة المرور"
        />

        {error && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <button onClick={handleSelectAuthenticator} disabled={isPending} className="w-full text-right disabled:opacity-50 disabled:cursor-not-allowed">
          <Card className="border-2 hover:border-foreground transition-all cursor-pointer">
            <div className="flex items-center gap-4 p-1">
              <div className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                {isPending ? <Spinner size="sm" /> : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">تطبيق المصادقة</p>
                <p className="text-xs text-muted mt-0.5">Google Authenticator أو Authy</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0 rotate-180"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </Card>
        </button>

        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>يمكنك تفعيل المصادقة الثنائية لاحقاً من إعدادات الأمان</Alert.Description>
          </Alert.Content>
        </Alert>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth className="rounded-full" onPress={onBack}>رجوع</Button>
          <Button variant="ghost" fullWidth className="rounded-full" onPress={() => onNext(false)}>تخطي الآن</Button>
        </div>
      </div>
    );
  }

  if (phase === 'scan') {
    return (
      <div className="space-y-5">
        <StepHeader
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/></svg>}
          title="امسح رمز QR"
          subtitle="افتح تطبيق المصادقة واضغط + لإضافة حساب جديد"
        />

        {qrCode && (
          <div className="flex flex-col items-center gap-4">
            <Card className="p-4 inline-flex">
              <Image src={qrCode} alt="QR Code" width={160} height={160} unoptimized />
            </Card>
            {secret && (
              <Card variant="secondary" className="w-full text-center">
                <div className="space-y-1.5 p-1">
                  <p className="text-xs text-muted">أو أدخل المفتاح يدوياً</p>
                  <code className="text-sm font-mono text-foreground tracking-widest select-all break-all" dir="ltr">{secret}</code>
                </div>
              </Card>
            )}
          </div>
        )}

        <Button variant="primary" fullWidth className="rounded-full" onPress={() => setPhase('verify')}>
          تم المسح، أدخل الرمز
        </Button>
        <Button variant="ghost" fullWidth className="rounded-full" onPress={() => setPhase('choose')}>
          رجوع
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <StepHeader
        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        title="أدخل رمز التحقق"
        subtitle="الرمز المكوّن من 6 أرقام من تطبيق المصادقة"
      />

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="flex justify-center" dir="ltr">
        <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
          <InputOTP.Group>
            <InputOTP.Slot index={0} />
            <InputOTP.Slot index={1} />
            <InputOTP.Slot index={2} />
          </InputOTP.Group>
          <InputOTP.Separator />
          <InputOTP.Group>
            <InputOTP.Slot index={3} />
            <InputOTP.Slot index={4} />
            <InputOTP.Slot index={5} />
          </InputOTP.Group>
        </InputOTP>
      </div>

      <Button type="submit" variant="primary" isPending={isPending} isDisabled={isPending || code.length < 6} fullWidth className="rounded-full">
        تفعيل المصادقة الثنائية
      </Button>
      <Button type="button" variant="ghost" fullWidth className="rounded-full" onPress={() => setPhase('scan')}>
        رجوع
      </Button>
    </form>
  );
}

// ─── Step 4: Welcome ─────────────────────────────────────────

function StepWelcome() {
  const router = useRouter();
  return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">مرحباً بك في ركني! 🎉</h2>
        <p className="text-[13px] text-zinc-500 mt-2 leading-relaxed">حسابك جاهز تماماً. يمكنك الآن بدء إدارة متجرك وتنمية أعمالك.</p>
      </div>
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-right space-y-2">
        <div className="flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
          <span>الملف الشخصي مكتمل</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
          <span>المتجر الإلكتروني تم إنشاؤه</span>
        </div>
      </div>
      <Button variant="primary" fullWidth className="rounded-full" onPress={() => router.replace('/app')}>
        الذهاب إلى لوحة التحكم
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-180"><polyline points="9 18 15 12 9 6"/></svg>
      </Button>
    </div>
  );
}

// ─── Token Validation Hook ───────────────────────────────────

const SESSION_KEY_PREFIX = 'cp_token_';

function useTokenGuard(token: string): 'loading' | 'valid' | 'invalid' {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY_PREFIX + token);
    if (stored === 'active') {
      setStatus('valid');
    } else {
      setStatus('invalid');
      router.replace('/login?error=invalid_session');
    }
  }, [token, router]);

  return status;
}

// ─── Main Form ────────────────────────────────────────────────

interface CompleteProfileFormProps {
  token: string;
  initialStep?: number;
}

export function CompleteProfileForm({ token, initialStep = 1 }: CompleteProfileFormProps) {
  const { setUser } = useAuth();
  const router = useRouter();
  // steps: 1=profile, 2=store, 3=2fa, 4=welcome
  const [step, setStep] = useState(() => Math.max(1, Math.min(initialStep, 4)));
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [step1, setStep1] = useState<Step1Data>({ name: '', username: '' });
  const [step2, setStep2] = useState<Step2Data>({
    storeCategory: '', employeesCount: '', phone: '',
    storeDescription: '', storeAddress: '', storeCountry: '', storeCity: '',
  });

  const tokenStatus = useTokenGuard(token);

  const TOTAL_STEPS = 4;

  // Sync step to URL without pushing to history
  const goToStep = (s: number) => {
    setStep(s);
    const url = `/complete-profile/${token}${s > 1 ? `?s=${s}` : ''}`;
    window.history.replaceState(null, '', url);
  };

  const handleSubmitProfileAndStore = async () => {
    setIsPending(true);
    setSubmitError(null);
    try {
      const { user } = await updateProfile({
        name: step1.name.trim(),
        username: step1.username.trim().toLowerCase(),
        phone: step2.phone.trim() || undefined,
        storeCategory: step2.storeCategory || undefined,
        storeDescription: step2.storeDescription.trim() || undefined,
        employeesCount: step2.employeesCount || undefined,
        storeCountry: step2.storeCountry.trim() || undefined,
        storeCity: step2.storeCity.trim() || undefined,
        storeAddress: step2.storeAddress.trim() || undefined,
      });
      setUser(user);
      goToStep(3);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? (err.message || 'حدث خطأ. أعد المحاولة.') : 'تعذّر الاتصال بالخادم.');
    } finally {
      setIsPending(false);
    }
  };

  const handleFinish2FA = (enabled: boolean) => {
    // Remove token from sessionStorage — one-time use
    sessionStorage.removeItem(SESSION_KEY_PREFIX + token);
    goToStep(4);
  };

  if (tokenStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="sm" />
      </div>
    );
  }

  if (tokenStatus === 'invalid') return null;

  return (
    <div className="w-full" dir="rtl">
      <StepIndicator current={step - 1} total={TOTAL_STEPS} />
      {step === 1 && <Step1Profile data={step1} onChange={(d) => setStep1((p) => ({ ...p, ...d }))} onNext={() => goToStep(2)} />}
      {step === 2 && <Step2Store data={step2} onChange={(d) => setStep2((p) => ({ ...p, ...d }))} onNext={handleSubmitProfileAndStore} onBack={() => goToStep(1)} isPending={isPending} error={submitError} />}
      {step === 3 && <Step32FA onNext={handleFinish2FA} onBack={() => goToStep(2)} />}
      {step === 4 && <StepWelcome />}
    </div>
  );
}

