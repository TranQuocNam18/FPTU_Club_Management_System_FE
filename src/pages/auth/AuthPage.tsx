import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import './AuthPage.css';

// Schemas
const loginSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  fullName: z.string().min(3, 'Ho ten toi thieu 3 ky tu'),
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mat khau xac nhan khong khop',
  path: ['confirmPassword'],
});
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [showPassLogin, setShowPassLogin] = useState(false);
  const [showPassRegister, setShowPassRegister] = useState(false);

  // Form Hooks
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Login Submit Handler (Local credentials)
  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const res = await authApi.login(data);
      const { accessToken, refreshToken } = res.data.data;
      
      useAuthStore.getState().setAccessToken(accessToken);
      useAuthStore.getState().setRefreshToken(refreshToken);
      
      const meRes = await authApi.me();
      setAuth(meRes.data.data, accessToken, refreshToken);
      toast.success('Dang nhap thanh cong!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Dang nhap that bai'));
    }
  };

  // Register Submit Handler
  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      const res = await authApi.register({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName.trim(),
        role: 'Student'
      });
      toast.success(res.data.message || 'Dang ky thanh cong.');
      navigate('/login');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Dang ky that bai'));
    }
  };

  // Nav Switch with Animation
  const handleSwitchMode = (targetMode: 'login' | 'register') => {
    if (targetMode === 'login') {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Main Glassmorphic Wrapper Container */}
      <div className={`auth-wrapper ${mode === 'register' ? 'toggled' : ''}`}>
        
        {/* Sliding background shape overlays */}
        <div className="background-shape">
          <div className="shape-grid-overlay" />
        </div>
        <div className="secondary-shape" />

        {/* ==================== LOGIN PANEL (LEFT SIDE) ==================== */}
        <div className="credentials-panel signin">
          <h2 className="slide-element mb-1">Login</h2>

          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="flex flex-col">
              <div className="field-wrapper slide-element">
                <input
                {...registerLogin('email')}
                type="email"
                placeholder=" "
                required
              />
              <label>Email or Username</label>
              <Mail className="input-icon" size={17} />
              {loginErrors.email && (
                <p className="text-rose-500 text-[10px] absolute -bottom-5 left-0">{loginErrors.email.message}</p>
              )}
            </div>

            <div className="field-wrapper slide-element">
              <input
                {...registerLogin('password')}
                type={showPassLogin ? 'text' : 'password'}
                placeholder=" "
                required
              />
              <label>Password</label>
              <button
                type="button"
                onClick={() => setShowPassLogin(!showPassLogin)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none"
              >
                {showPassLogin ? <EyeOff className="input-icon" size={17} /> : <Eye className="input-icon" size={17} />}
              </button>
                {loginErrors.password && (
                  <p className="text-rose-500 text-[10px] absolute -bottom-5 left-0">{loginErrors.password.message}</p>
                )}
              </div>

              <div className="slide-element mt-3 text-right">
                <Link to="/forgot-password" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                  Forgot password?
                </Link>
              </div>

              <div className="field-wrapper slide-element mt-10">
              <button className="submit-button" type="submit" disabled={isLoginSubmitting} aria-busy={isLoginSubmitting}>
                <span className="submit-button-content">
                  {isLoginSubmitting ? 'Signing in...' : 'Login'}
                </span>
              </button>
            </div>
          </form>

          <div className="switch-link slide-element">
            <p>
              Don't have an account? <br />
              <button type="button" onClick={() => handleSwitchMode('register')}>
                Sign Up
              </button>
            </p>
          </div>
        </div>

        {/* ==================== WELCOME BACK MESSAGE (RIGHT SIDE FOR SIGNIN) ==================== */}
        <div className="welcome-section signin">
          <h2 className="slide-element">WELCOME BACK!</h2>
          <p className="slide-element">Hope, You and your Family have a Great Day</p>
        </div>

        {/* ==================== REGISTER PANEL (RIGHT SIDE) ==================== */}
        <div className="credentials-panel signup">
          <h2 className="slide-element mb-1">Register</h2>
          
          <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="flex flex-col">
            <div className="field-wrapper slide-element">
              <input
                {...registerRegister('fullName')}
                type="text"
                placeholder=" "
                required
              />
              <label>Full Name</label>
              <User className="input-icon" size={16} />
              {registerErrors.fullName && (
                <p className="text-rose-500 text-[9px] absolute -bottom-5 left-0">{registerErrors.fullName.message}</p>
              )}
            </div>

            <div className="field-wrapper slide-element">
              <input
                {...registerRegister('email')}
                type="email"
                placeholder=" "
                required
              />
              <label>Email</label>
              <Mail className="input-icon" size={16} />
              {registerErrors.email && (
                <p className="text-rose-500 text-[9px] absolute -bottom-5 left-0">{registerErrors.email.message}</p>
              )}
            </div>

            <div className="field-wrapper slide-element">
              <input
                {...registerRegister('password')}
                type={showPassRegister ? 'text' : 'password'}
                placeholder=" "
                required
              />
              <label>Password</label>
              <button
                type="button"
                onClick={() => setShowPassRegister(!showPassRegister)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none"
              >
                {showPassRegister ? <EyeOff className="input-icon" size={16} /> : <Eye className="input-icon" size={16} />}
              </button>
              {registerErrors.password && (
                <p className="text-rose-500 text-[9px] absolute -bottom-5 left-0">{registerErrors.password.message}</p>
              )}
            </div>

            <div className="field-wrapper slide-element">
              <input
                {...registerRegister('confirmPassword')}
                type="password"
                placeholder=" "
                required
              />
              <label>Confirm Password</label>
              <Lock className="input-icon" size={16} />
              {registerErrors.confirmPassword && (
                <p className="text-rose-500 text-[9px] absolute -bottom-5 left-0">{registerErrors.confirmPassword.message}</p>
              )}
            </div>

            <div className="field-wrapper slide-element mt-8">
              <button className="submit-button" type="submit" disabled={isRegisterSubmitting} aria-busy={isRegisterSubmitting}>
                <span className="submit-button-content">
                  {isRegisterSubmitting ? 'Creating account...' : 'Register'}
                </span>
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>
                Already have an account? <br />
                <button type="button" onClick={() => handleSwitchMode('login')}>
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* ==================== WELCOME MESSAGE (LEFT SIDE FOR SIGNUP) ==================== */}
        <div className="welcome-section signup">
          <h2 className="slide-element">WELCOME!</h2>
          <p className="slide-element">Hope, You and your Family have a Great Day</p>
        </div>

      </div>
    </div>
  );
}
