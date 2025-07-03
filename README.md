Below is the complete **frontend** codebase, configured for **Vite + React + TypeScript + Tailwind CSS**.

---

**package.json**

```json
{
  "name": "film-streaming-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/react-router-dom": "^6.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.2.0",
    "typescript": "^4.9.0",
    "vite": "^4.0.0",
    "@vitejs/plugin-react": "^3.0.0"
  }
}
```

---

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

---

**vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
});
```

---

**tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: []
} satisfies Config;
```

---

**postcss.config.cjs**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

---

**src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

**src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
```

---

**src/api/auth.ts**

```ts
import axios from 'axios';

interface AuthResponse {
  token: string;
}

const base = '/api/auth';
export function requestOtp(phone: string) {
  return axios.post(`${base}/request-otp`, { phoneNumber: phone });
}
export function verifyOtp(phone: string, code: string): Promise<AuthResponse> {
  return axios
    .post(`${base}/verify-otp`, { phoneNumber: phone, code })
    .then(r => r.data);
}
```

---

**src/api/payment.ts**

```ts
import axios from 'axios';

interface InitiateResponse {
  merchantRequestId: string;
  checkoutRequestId: string;
}
interface StatusResponse {
  status: string;
  paidAt?: string;
  filmId?: string;
}
interface LinkResponse { urlToken: string; expiresAt: string }

const base = '/api/payment';
export function initiate(
  filmId: string,
  amount: number,
  jwt: string
): Promise<InitiateResponse> {
  return axios
    .post(
      `${base}/initiate`,
      { filmId, amount },
      { headers: { Authorization: `Bearer ${jwt}` } }
    )
    .then(r => r.data);
}
export function status(
  checkoutRequestId: string,
  jwt: string
): Promise<StatusResponse> {
  return axios
    .get(`${base}/status/${checkoutRequestId}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    })
    .then(r => r.data);
}
export function latestLink(
  checkoutRequestId: string
): Promise<LinkResponse> {
  return axios
    .get(`/api/dev/latest-link/${checkoutRequestId}`)
    .then(r => r.data);
}
```

---

**src/contexts/AuthContext.tsx**

```tsx
import React, { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as authApi from '../api/auth';

interface AuthContextType {
  jwt: string;
  login: (phone: string, code: string) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jwt, setJwt] = useState<string>(
    localStorage.getItem('jwt') || ''
  );
  const navigate = useNavigate();
  const location = useLocation();

  const login = async (phone: string, code: string) => {
    const { token } = await authApi.verifyOtp(phone, code);
    localStorage.setItem('jwt', token);
    setJwt(token);
    const from = (location.state as any)?.from?.pathname || '/films';
    navigate(from, { replace: true });
  };

  return (
    <AuthContext.Provider value={{ jwt, login }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

---

**src/routes/AppRouter.tsx**

```tsx
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import Login from '../pages/Login';
import FilmList from '../pages/FilmList';
import FilmDetail from '../pages/FilmDetail';
import Payment from '../pages/Payment';
import PaymentStatus from '../pages/PaymentStatus';
import Stream from '../pages/Stream';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { jwt } = useAuth();
  const location = useLocation();
  return jwt ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={<ProtectedRoute>
            <Routes>
              <Route path="films" element={<FilmList />} />
              <Route path="films/:id" element={<FilmDetail />} />
              <Route path="payment/:filmId" element={<Payment />} />
              <Route path="status/:checkoutRequestId" element={<PaymentStatus />} />
              <Route path="stream" element={<Stream />} />
              <Route path="*" element={<Navigate to="films" replace />} />
            </Routes>
          </ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

**src/pages/Login.tsx**

```tsx
import React, { useState } from 'react';
import * as authApi from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const { login } = useAuth();

  const handleRequest = async () => {
    await authApi.requestOtp(phone);
    setStep(2);
  };
  const handleVerify = () => login(phone, code);

  return (
    <div className="p-4 max-w-md mx-auto">
      {step === 1 ? (
        <>
          <input
            className="border p-2 w-full"
            placeholder="Phone Number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleRequest}
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <input
            className="border p-2 w-full"
            placeholder="OTP Code"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
            onClick={handleVerify}
          >
            Verify & Login
          </button>
        </>
      )}
    </div>
  );
}
```

---

**src/pages/FilmList.tsx**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';

const films = [
  { id: 'matrix1999', title: 'The Matrix (1999)' },
  { id: 'inception2010', title: 'Inception (2010)' }
];

export default function FilmList() {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {films.map(f => (
        <div key={f.id} className="border p-4 rounded">
          <h2 className="text-xl font-bold">{f.title}</h2>
          <Link
            to={`/films/${f.id}`}
            className="mt-2 inline-block px-3 py-1 bg-blue-500 text-white rounded"
          >
            Details & Rent
          </Link>
        </div>
      ))}
    </div>
  );
}
```

---

**src/pages/FilmDetail.tsx**

```tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function FilmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Film: {id}</h1>
      <p className="mt-2">Description and details here...</p>
      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        onClick={() => navigate(`/payment/${id}`)}
      >
        Rent for 1 KES
      </button>
    </div>
  );
}
```

---

**src/pages/Payment.tsx**

```tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as paymentApi from '../api/payment';

export default function Payment() {
  const { filmId } = useParams<{ filmId: string }>();
  const { jwt } = useAuth();
  const navigate = useNavigate();

  const handlePay = async () => {
    const { checkoutRequestId } = await paymentApi.initiate(
      filmId,
      1,
      jwt
    );
    navigate(`/status/${checkoutRequestId}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl">Payment for {filmId}</h1>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handlePay}
      >
        Pay Now
      </button>
    </div>
  );
}
```

---
