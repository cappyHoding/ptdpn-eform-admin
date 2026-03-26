import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileSearch } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <FileSearch className="w-12 h-12 text-primary" />
        </div>

        {/* 404 number */}
        <p className="text-8xl font-bold text-primary/20 leading-none mb-4">404</p>

        {/* Text */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-muted-foreground mb-8">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}