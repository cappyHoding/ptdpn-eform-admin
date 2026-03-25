import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <p className="text-gray-500">Halaman tidak ditemukan</p>
      <Button onClick={() => navigate('/dashboard')}>Kembali ke Dashboard</Button>
    </div>
  );
}
