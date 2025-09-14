import React from 'react';

interface LoaderProps {
  t: (key: string) => string;
}

const Loader: React.FC<LoaderProps> = ({ t }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xl flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-t-blue-400 border-slate-200/50 rounded-full animate-spin"></div>
      <p className="text-white text-lg mt-4 font-semibold">{t('loader.thinking')}</p>
      <p className="text-slate-400 text-sm mt-2">{t('loader.wait')}</p>
    </div>
  );
};

export default Loader;