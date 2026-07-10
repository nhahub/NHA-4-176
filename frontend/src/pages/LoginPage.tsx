import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/foodads-logo.png';

const schema = z.object({
  email: z.string().email('Use a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'owner@foodads.ai',
      password: 'Owner123!',
    },
  });

  async function handleSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values);
    } catch {
      setError('Login failed. Check the email and password.');
    }
  }

  return (
    <div className="shell auth-shell">
      <div className="auth-card panel">
        <div className="auth-mark">
          <img src={logo} alt="FoodAds AI logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} />
        </div>
        <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>
          FoodAds AI
        </div>
        <h1 className="auth-title">Sign in to your studio</h1>
        <form className="form-grid" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email && <span className="field-error">{form.formState.errors.email.message}</span>}
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" autoComplete="current-password" {...form.register('password')} />
            {form.formState.errors.password && <span className="field-error">{form.formState.errors.password.message}</span>}
          </div>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <LoaderCircle className="spin" size={16} /> : <LogIn size={16} />}
            Sign in
          </button>
        </form>
        <p className="muted auth-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
