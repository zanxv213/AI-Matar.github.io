import React, { useState } from 'react';
import * as firebaseService from '../services/firebaseService';

type Language = 'en' | 'ar';

interface LoginPanelProps {
    t: (key: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ t, language, setLanguage }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (isSignUp) {
                await firebaseService.signUpUser(email, password);
            } else {
                await firebaseService.signInUser(email, password);
            }
        } catch (err: any) {
            setError(firebaseService.getFirebaseErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen p-4">
            <div className="w-full max-w-md h-auto flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50 relative">

                <div className="absolute top-4 right-4 flex items-center space-x-1 bg-slate-800/50 border border-white/10 rounded-full p-1">
                    <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>EN</button>
                    <button onClick={() => setLanguage('ar')} className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'ar' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>ع</button>
                </div>

                <h1 className="text-3xl font-bold mb-2 text-slate-100">{t('login.title')}</h1>
                <p className="text-slate-400 mb-8">{t('login.subtitle')}</p>

                <div className="w-full mb-6">
                    <div className="flex border-b border-white/10">
                        <button onClick={() => { setIsSignUp(false); setError(null); }} className={`flex-1 py-3 font-semibold transition-colors ${!isSignUp ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>
                            {t('login.signInTab')}
                        </button>
                        <button onClick={() => { setIsSignUp(true); setError(null); }} className={`flex-1 py-3 font-semibold transition-colors ${isSignUp ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>
                            {t('login.signUpTab')}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">{t('login.emailLabel')}</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-2">{t('login.passwordLabel')}</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-wait text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-400/50">
                        {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto"></div> : (isSignUp ? t('login.signUpButton') : t('login.signInButton'))}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPanel;