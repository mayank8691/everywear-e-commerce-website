import { ArrowRight, LockKeyhole, ShoppingBag, UserRound } from 'lucide-react';

export default function AuthScreen({ mode, setMode, onSubmit, error }) {
  const isRegister = mode === 'register';

  return (
    <section className="auth-page wrap">
      <div className="auth-aside">
        <span className="auth-kicker"><ShoppingBag size={15} /> EVERYWEAR ACCOUNT</span>
        <h1>{isRegister ? <>Good finds,<br /><em>saved for you.</em></> : <>Welcome back<br /><em>to Everywear.</em></>}</h1>
        <p>Keep track of orders, save the pieces you like, and pick up right where you left off.</p>
        <span className="auth-aside-note">YOUR EVERYDAY MARKETPLACE <span>•</span> EST. 2026</span>
      </div>
      <div className="auth-panel">
        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('login')}>Sign in</button>
          <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('register')}>Create account</button>
        </div>
        <h2>{isRegister ? 'Join Everywear' : 'Sign in to your account'}</h2>
        <p className="auth-hint">{isRegister ? 'A few details and you are all set.' : 'Enter your details to continue.'}</p>
        <form className="auth-form" onSubmit={(event) => {
          event.preventDefault();
          const data = Object.fromEntries(new FormData(event.currentTarget).entries());
          onSubmit({ ...data, mode });
        }}>
          {isRegister && <label>Full name<input name="name" type="text" autoComplete="name" minLength="2" maxLength="80" placeholder="Your name" required /></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <label>Password<input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" type="submit">{isRegister ? 'Create account' : 'Sign in'}<ArrowRight size={17} /></button>
        </form>
        <p className="auth-security"><LockKeyhole size={14} /> Your password is securely hashed and never stored in your browser.</p>
      </div>
    </section>
  );
}