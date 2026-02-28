/**
 * Script untuk generate Excel template peserta
 * dengan 100 nama orang Indonesia
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Daftar nama depan Indonesia
const namaDepan = [
  'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi',
  'Indra', 'Joko', 'Kartika', 'Lili', 'Made', 'Novi', 'Oki', 'Putri',
  'Raden', 'Siti', 'Tono', 'Umar', 'Vina', 'Wati', 'Yuni', 'Zahra',
  'Agus', 'Bambang', 'Candra', 'Dian', 'Edi', 'Fajar', 'Ginanjar', 'Hendra',
  'Irfan', 'Jaya', 'Kurnia', 'Lestari', 'Mahendra', 'Nanda', 'Oky', 'Pramono',
];

// Daftar nama belakang Indonesia
const namaBelakang = [
  'Wijaya', 'Santoso', 'Pratama', 'Kusuma', 'Sari', 'Wibowo', 'Nugroho', 'Setiawan',
  'Permata', 'Utama', 'Kartika', 'Rahayu', 'Putra', 'Putri', 'Saputra', 'Saputri',
  'Hidayat', 'Ningsih', 'Lestari', 'Susanto', 'Prasetyo', 'Hartono', 'Gunawan', 'Pranoto',
  'Wahyudi', 'Hakim', 'Syahputra', 'Indrayana', 'Firmansyah', 'Ramadhan', 'Fauzi', 'Rizki',
];

// Daftar kota Indonesia
const kota = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Medan', 'Makassar',
  'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Malang', 'Solo', 'Denpasar',
  'Balikpapan', 'Pontianak', 'Manado', 'Pekanbaru', 'Batam', 'Banjarmasin', 'Samarinda',
];

// Daftar nama jalan
const jalan = [
  'Merdeka', 'Sudirman', 'Gatot Subroto', 'Diponegoro', 'Ahmad Yani', 'Veteran',
  'Pahlawan', 'Raya Bogor', 'Asia Afrika', 'Thamrin', 'Proklamasi', 'Melawai',
  'Cendana', 'Mawar', 'Anggrek', 'Kenanga', 'Dahlia', 'Flamboyan', 'Mangga Dua',
];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNama(): string {
  return `${randomFromArray(namaDepan)} ${randomFromArray(namaBelakang)}`;
}

function generateNomorTelepon(): string {
  const prefix = ['0812', '0813', '0821', '0822', '0823', '0852', '0853', '0856', '0857', '0858'];
  const randomPrefix = randomFromArray(prefix);
  const randomNumbers = randomNumber(10000000, 99999999);
  return `${randomPrefix}${randomNumbers}`;
}

function generateAlamat(): string {
  const kotaPilihan = randomFromArray(kota);
  const jalanPilihan = randomFromArray(jalan);
  const nomor = randomNumber(1, 500);
  const rt = randomNumber(1, 20).toString().padStart(3, '0');
  const rw = randomNumber(1, 15).toString().padStart(3, '0');
  
  return `Jl. ${jalanPilihan} No. ${nomor}, RT ${rt}/RW ${rw}, ${kotaPilihan}`;
}

// Generate 100 peserta
const pesertaData = [];
for (let i = 1; i <= 100; i++) {
  pesertaData.push({
    nama: generateNama(),
    nomor_telepon: generateNomorTelepon(),
    alamat: generateAlamat(),
  });
}

// Create workbook
const worksheet = XLSX.utils.json_to_sheet(pesertaData);

// Set column widths
worksheet['!cols'] = [
  { wch: 25 }, // nama
  { wch: 15 }, // nomor_telepon
  { wch: 60 }, // alamat
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Peserta');

// Save to public folder
const outputPath = path.join(process.cwd(), 'public', 'template_peserta_100.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Excel file generated successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log(`👥 Total participants: ${pesertaData.length}`);
console.log('\n📋 Sample data (first 5 participants):');
pesertaData.slice(0, 5).forEach((p, i) => {
  console.log(`${i + 1}. ${p.nama} - ${p.nomor_telepon} - ${p.alamat}`);
});
