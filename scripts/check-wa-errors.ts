/**
 * Check WhatsApp sending errors
 */
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Checking WhatsApp errors...\n');

  const failedPeserta = await prisma.peserta.findMany({
    where: {
      wa_status: 'FAILED',
    },
    select: {
      id: true,
      nama: true,
      kode_unik: true,
      nomor_telepon: true,
      wa_status: true,
      wa_error: true,
      wa_sent_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (failedPeserta.length === 0) {
    console.log('✅ No failed messages found');
    return;
  }

  console.log(`❌ Found ${failedPeserta.length} failed messages:\n`);
  
  failedPeserta.forEach((peserta, index) => {
    console.log(`${index + 1}. ${peserta.nama} (${peserta.kode_unik})`);
    console.log(`   Phone: ${peserta.nomor_telepon}`);
    console.log(`   Error: ${peserta.wa_error || 'No error message'}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
