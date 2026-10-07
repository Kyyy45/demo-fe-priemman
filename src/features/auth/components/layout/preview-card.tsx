export function PreviewCard({ alt = "Priemman" }: { alt?: string }) {
  return (
    <div
      aria-label={`${alt} image placeholder`}
      // Token placeholder yang sama dengan mosaic gambar di About/TeamShowcase,
      // supaya warna "gambar belum ada" konsisten di seluruh app. Ini aman di sini
      // karena AuthShell merender di atas bg-surface (lihat auth-shell.tsx), bukan
      // bg-canvas — sebelumnya AuthShell salah pakai bg-canvas sehingga token ini
      // menyatu dengan background-nya sendiri di tema light.
      className="absolute inset-0 bg-surface-container-high"
      role="img"
    >
      {/* 1. Placeholder visual lokal; tidak memakai aset eksternal atau endpoint API. */}
    </div>
  );
}
