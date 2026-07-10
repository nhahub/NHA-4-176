import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/foodads-logo.png';

const schema = z.object({
  displayName: z.string().min(2, 'Add your name'),
  email: z.string().email('Use a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  async function handleSubmit(values: FormValues) {
    setError(null);
    try {
      await register(values);
    } catch {
      setError('Could not create the account. Try a different email.');
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
        <h1 className="auth-title">Create your studio account</h1>
        <form className="form-grid" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="field">
            <label>Name</label>
            <input className="input" autoComplete="name" {...form.register('displayName')} />
            {form.formState.errors.displayName && <span className="field-error">{form.formState.errors.displayName.message}</span>}
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email && <span className="field-error">{form.formState.errors.email.message}</span>}
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" autoComplete="new-password" {...form.register('password')} />
            {form.formState.errors.password && <span className="field-error">{form.formState.errors.password.message}</span>}
          </div>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <LoaderCircle className="spin" size={16} /> : <UserPlus size={16} />}
            Create account
          </button>
        </form>
        <p className="muted auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
