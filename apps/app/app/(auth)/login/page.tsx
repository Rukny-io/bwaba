import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'تسجيل الدخول | ركني',
};

export default function LoginPage() {
  return (
    <AuthCard>
      <LoginForm />
    </AuthCard>
  );
}
