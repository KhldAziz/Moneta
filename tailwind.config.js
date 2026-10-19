/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        moneta: {
          primary: '#0F766E',      // Primer (tombol utama, tautan, tab aktif)
          accent: '#14B8A6',       // Aksen (progres normal, grafik)
          bg: '#F8FAFC',           // Latar halaman
          card: '#FFFFFF',         // Latar kartu
          text: '#0F172A',         // Teks utama
          subtext: '#475569',      // Teks pendukung / keterangan
          income: '#15803D',       // Pemasukan
          warning: '#B45309',      // Peringatan teks
          'warning-bg': '#FEF3C7', // Peringatan latar (budget 80-99%)
          danger: '#B91C1C',       // Bahaya teks
          'danger-bg': '#FEE2E2',  // Bahaya latar (budget >=100%, aksi hapus)
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
        'float': '0 8px 24px -4px rgba(15, 118, 110, 0.25)',
      }
    },
  },
  plugins: [],
}
