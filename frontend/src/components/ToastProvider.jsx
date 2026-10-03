import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e1e2e',
          color: '#c0caf5',
          border: '1px solid var(--border-soft)',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: '#1e1e2e',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: '#1e1e2e',
          },
        },
      }}
    />
  );
}
