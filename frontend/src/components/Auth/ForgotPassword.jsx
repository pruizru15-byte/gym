import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Dumbbell, ArrowLeft, Send, CheckCircle, Lock } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});

    // API URL - hardcoded for now or use env
    const API_URL = 'http://localhost:3000/api/auth';

    const validateEmail = () => {
        if (!email.trim()) return 'El email es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
        return '';
    };

    const validatePassword = () => {
        if (!newPassword) return 'La contraseña es requerida';
        // "más de 8 caracteres, 1 caracter especial, mayusculas, y numeros"
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;
        if (!passwordRegex.test(newPassword)) {
            return 'La contraseña debe tener más de 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial.';
        }
        return '';
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        const emailError = validateEmail();
        if (emailError) {
            setErrors({ email: emailError });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await axios.post(`${API_URL}/forgot-password`, { email });
            toast.success('Código enviado a tu correo');
            setStep(2);
        } catch (error) {
            console.error('Error sending code:', error);
            const msg = error.response?.data?.error || 'Error al enviar el código';
            toast.error(msg);
            setErrors({ form: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        const newErrors = {};
        const passwordError = validatePassword();
        if (passwordError) newErrors.newPassword = passwordError;
        if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
        if (!code.trim()) newErrors.code = 'El código es requerido';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await axios.post(`${API_URL}/reset-password`, {
                email,
                code,
                newPassword
            });
            toast.success('Contraseña restablecida exitosamente');
            // Wait a bit before redirecting
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('Error resetting password:', error);
            const msg = error.response?.data?.error || 'Error al restablecer la contraseña';
            toast.error(msg);
            setErrors({ form: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
            <Toaster position="top-right" />
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
                        <Dumbbell className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">GymPro</h1>
                    <p className="text-gray-600">Recuperación de Contraseña</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {step === 1 ? (
                        /* Step 1: Email */
                        <form onSubmit={handleSendCode} className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Ingresa tu correo
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Te enviaremos un código de seguridad para restablecer tu contraseña.
                            </p>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="tu@email.com"
                                    disabled={loading}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            {errors.form && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{errors.form}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Enviar Código</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* Step 2: Code & New Password */
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Restablecer Contraseña
                            </h2>
                            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                                Hemos enviado un código a <strong>{email}</strong>
                            </div>

                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                    Código de Seguridad
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="123456"
                                    disabled={loading}
                                />
                                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                            </div>

                            {errors.form && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{errors.form}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Cambiar Contraseña</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
