import { ServiceRequest, MasterUnit, EmailReportData, EmailNotificationLog, ServiceType } from '../types';

export const formatServiceTypeLabel = (type: ServiceType): string => {
  switch (type) {
    case 'fotocopy':
      return 'Foto Copy / Penggandaan Dokumen';
    case 'laminating':
      return 'Laminating Presisi';
    case 'atk':
      return 'Alat Tulis Kantor (ATK)';
    case 'seragam':
      return 'Seragam Sekolah';
    case 'air_galon':
      return 'Air Minum Galon';
    default:
      return String(type || '').toUpperCase();
  }
};

export const generateOrderCompletionEmail = (
  request: ServiceRequest,
  unitObj?: MasterUnit,
  operatorName?: string
): EmailReportData => {
  const unitName = unitObj?.name || `Unit ${request.unit}`;
  const headName = unitObj?.headName || 'Kepala Unit';
  const headEmail = unitObj?.email || `${request.unit.toLowerCase()}@lazuardi.sch.id`;
  const ccEmails = [request.userEmail, 'resources.room@lazuardi.sch.id'].filter(Boolean).join(', ');

  const formattedRequestDate = new Date(request.requestDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const completionDateStr = request.completedDate || new Date().toISOString();
  const formattedCompletedDate = new Date(completionDateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const serviceLabel = formatServiceTypeLabel(request.serviceType);
  const subject = `[LAPORAN SELESAI] Order Layanan RR: ${request.requestNumber} - ${serviceLabel} (${request.unit})`;

  // Build service-specific details string
  let detailsText = '';
  let detailsHtml = '';

  if (request.serviceType === 'fotocopy' && request.photocopyDetail) {
    const pc = request.photocopyDetail;
    const colorLabel = pc.colorType || 'Hitam Putih';
    const bindingLabel = pc.binding || 'Tanpa Jilid';

    detailsText = [
      `• Jenis Dokumen    : ${pc.documentType || request.purpose}`,
      `• Total Lembar     : ${pc.totalSheets || 0} Lembar`,
      `• Ukuran Kertas    : ${pc.paperSize || 'A4'}`,
      `• Mode Cetak       : ${colorLabel}`,
      `• Finishing / Jilid: ${bindingLabel}`,
      `• Rincian Cetak    : ${pc.pageCount || 1} Halaman x ${pc.copyCount || 1} Rangkap`,
      pc.notes ? `• Catatan Khusus   : "${pc.notes}"` : ''
    ].filter(Boolean).join('\n');

    detailsHtml = `
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li><strong>Jenis Dokumen:</strong> ${pc.documentType || request.purpose}</li>
        <li><strong>Total Lembar Hasil Cetak:</strong> <span style="color: #0f766e; font-weight: bold;">${pc.totalSheets || 0} Lembar</span></li>
        <li><strong>Ukuran Kertas:</strong> ${pc.paperSize || 'A4'}</li>
        <li><strong>Warna Cetak:</strong> ${colorLabel}</li>
        <li><strong>Finishing / Jilid:</strong> ${bindingLabel}</li>
        <li><strong>Rincian Pengerjaan:</strong> ${pc.pageCount || 1} Halaman x ${pc.copyCount || 1} Rangkap</li>
        ${pc.notes ? `<li><strong>Catatan Tambahan:</strong> <em>${pc.notes}</em></li>` : ''}
      </ul>
    `;
  } else if (request.serviceType === 'laminating' && request.laminatingDetail) {
    const lam = request.laminatingDetail;
    detailsText = [
      `• Jenis Dokumen    : ${lam.documentType || request.purpose}`,
      `• Jumlah Lembar    : ${lam.quantity || 1} Lembar`,
      `• Ukuran Kertas    : ${lam.paperSize || 'A4'}`,
      `• Ketebalan Plastik: ${lam.thickness || '100 Micron (Standar)'}`,
      lam.filmType ? `• Tipe Film        : ${lam.filmType}` : '',
      lam.cornerCut ? `• Sudut Potong     : ${lam.cornerCut}` : '',
      lam.notes ? `• Catatan Khusus   : "${lam.notes}"` : ''
    ].filter(Boolean).join('\n');

    detailsHtml = `
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li><strong>Jenis Dokumen:</strong> ${lam.documentType || request.purpose}</li>
        <li><strong>Jumlah Lembar:</strong> <span style="color: #0f766e; font-weight: bold;">${lam.quantity || 1} Lembar</span></li>
        <li><strong>Ukuran Kertas:</strong> ${lam.paperSize || 'A4'}</li>
        <li><strong>Ketebalan Plastik:</strong> ${lam.thickness || '100 Micron'}</li>
        ${lam.filmType ? `<li><strong>Tipe Film:</strong> ${lam.filmType}</li>` : ''}
        ${lam.cornerCut ? `<li><strong>Sudut Potong:</strong> ${lam.cornerCut}</li>` : ''}
        ${lam.notes ? `<li><strong>Catatan Khusus:</strong> <em>${lam.notes}</em></li>` : ''}
      </ul>
    `;
  } else if (request.serviceType === 'atk') {
    if (request.items && request.items.length > 0) {
      detailsText = request.items.map((it, idx) => {
        const qty = it.quantityApproved ?? it.quantityRequested;
        return `  ${idx + 1}. ${it.itemName} (${it.itemCode}) : ${qty} ${it.unitMeasure}`;
      }).join('\n');

      detailsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left; font-size: 12px; color: #475569;">
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1;">No</th>
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1;">Kode</th>
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1;">Nama Barang</th>
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right;">Jumlah Diserahkan</th>
            </tr>
          </thead>
          <tbody>
            ${request.items.map((it, idx) => `
              <tr style="font-size: 13px;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${idx + 1}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-family: monospace;">${it.itemCode}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${it.itemName}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right; color: #0f766e; font-weight: bold;">
                  ${it.quantityApproved ?? it.quantityRequested} ${it.unitMeasure}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      detailsText = `• Keperluan: ${request.purpose}`;
      detailsHtml = `<p>${request.purpose}</p>`;
    }
  } else if (request.serviceType === 'seragam') {
    if (request.items && request.items.length > 0) {
      detailsText = request.items.map((it, idx) => {
        const qty = it.quantityApproved ?? it.quantityRequested;
        return `  ${idx + 1}. ${it.itemName} (Size: ${it.size || '-'}) : ${qty} Pcs`;
      }).join('\n');

      detailsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left; font-size: 12px; color: #475569;">
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1;">No</th>
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1;">Item Seragam</th>
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center;">Ukuran</th>
              <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right;">Jumlah Diserahkan</th>
            </tr>
          </thead>
          <tbody>
            ${request.items.map((it, idx) => `
              <tr style="font-size: 13px;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${idx + 1}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${it.itemName}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${it.size || '-'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right; color: #0f766e; font-weight: bold;">
                  ${it.quantityApproved ?? it.quantityRequested} Pcs
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      detailsText = `• Keperluan: ${request.purpose}`;
      detailsHtml = `<p>${request.purpose}</p>`;
    }
  } else if (request.serviceType === 'air_galon' && request.waterDetail) {
    const wd = request.waterDetail;
    detailsText = [
      `• Titik / Ruangan  : ${wd.roomName}`,
      `• Jenis Permintaan : ${wd.requestType}`,
      `• Galon Isi Diberi : ${wd.gallonCount} Galon`,
      `• Galon Kosong Rtr : ${wd.emptyGallonsReturned ?? 0} Galon`,
      wd.notes ? `• Catatan          : "${wd.notes}"` : ''
    ].filter(Boolean).join('\n');

    detailsHtml = `
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li><strong>Ruangan / Titik Galon:</strong> ${wd.roomName}</li>
        <li><strong>Kategori:</strong> ${wd.requestType}</li>
        <li><strong>Galon Isi Diserahkan:</strong> <span style="color: #0284c7; font-weight: bold;">${wd.gallonCount} Galon Isi</span></li>
        <li><strong>Galon Kosong Ditukar Kembali:</strong> <span style="color: #d97706; font-weight: bold;">${wd.emptyGallonsReturned ?? 0} Galon</span></li>
        ${wd.notes ? `<li><strong>Catatan:</strong> <em>${wd.notes}</em></li>` : ''}
      </ul>
    `;
  }

  // Plain Text Body formatted cleanly
  const plainBody = `Yth. Bapak/Ibu ${headName},
Kepala Unit ${unitName}
Sekolah Lazuardi Global Compassionate School

Dengan hormat,

Bersama ini kami informasikan bahwa permohonan order layanan Resources Room (RR) dari staf/guru unit Anda telah SELESAI DILAKSANAKAN dan diserahterimakan dengan rincian sebagai berikut:

================================================================================
INFORMASI TRANSAKSI ORDER
================================================================================
• Nomor Registrasi : ${request.requestNumber}
• Layanan          : ${serviceLabel}
• Tanggal Diajukan : ${formattedRequestDate}
• Tanggal Selesai  : ${formattedCompletedDate}
• Pemohon          : ${request.userName} (${request.userEmail})
• Unit / Bagian    : ${request.unit} - ${request.department}
• Keperluan        : ${request.purpose || '-'}
• Urgensi          : ${request.urgency || 'Biasa'}

================================================================================
RINCIAN PENGERJAAN & BARANG/DOKUMEN YANG DISERAHKAN
================================================================================
${detailsText}

================================================================================
BERITA ACARA SERAH TERIMA
================================================================================
• Status Akhir     : SELESAI DILAKSANAKAN (ORDER COMPLETED)
• Diserahkan Kepada: ${request.pickedUpBy || request.userName}
• Petugas RR       : ${request.processedBy || operatorName || 'Petugas Resources Room'}
• Catatan Petugas  : ${request.adminNotes || 'Pekerjaan selesai dalam kondisi baik'}

Laporan ini dikirimkan secara otomatis oleh Sistem Manajemen Layanan Resources Room Sekolah Lazuardi sebagai arsip laporan resmi untuk pimpinan unit.

Terima kasih atas kerja samanya.

Hormat kami,
Resources Room (RR)
Sekolah Lazuardi Global Compassionate School
Email: resources.room@lazuardi.sch.id
Jl. Margonda Raya / Kampus Cinere
`;

  // HTML Body for formatted email render
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #115e59; padding: 24px 32px; color: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.85; font-weight: 700; display: block; margin-bottom: 4px;">Sekolah Lazuardi GCS</span>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Laporan Penyelesaian Order Layanan RR</h1>
        </div>
        <div style="background-color: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;">
          ${request.requestNumber}
        </div>
      </div>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 32px;">
      
      <p style="margin-top: 0; font-size: 15px; line-height: 1.5;">
        Yth. Bapak/Ibu <strong>${headName}</strong>,<br>
        <span style="color: #64748b;">Kepala Unit ${unitName} - Sekolah Lazuardi</span>
      </p>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Dengan hormat, kami informasikan bahwa permohonan order layanan <strong>${serviceLabel}</strong> yang diajukan oleh staf/guru unit Anda telah <strong>SELESAI DILAKSANAKAN</strong> dan diserahterimakan dengan rincian sebagai berikut:
      </p>

      <!-- Status Banner -->
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <span style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Status Pelaksanaan</span>
        <div style="font-size: 16px; font-weight: 800; color: #065f46; margin-top: 2px;">
          ✓ SELESAI DILAKSANAKAN & DISERAHKAN
        </div>
        <span style="font-size: 12px; color: #047857; display: block; margin-top: 4px;">
          Diselesaikan pada: <strong>${formattedCompletedDate}</strong>
        </span>
      </div>

      <!-- Info Table -->
      <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">
        1. Informasi Order & Pemohon
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.6;">
        <tr>
          <td style="width: 38%; padding: 6px 0; color: #64748b;">Nomor Registrasi</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${request.requestNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Nama Pemohon</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${request.userName} (<a href="mailto:${request.userEmail}" style="color: #0284c7; text-decoration: none;">${request.userEmail}</a>)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Unit & Departemen</td>
          <td style="padding: 6px 0; color: #0f172a;">${request.unit} • ${request.department}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Waktu Pengajuan</td>
          <td style="padding: 6px 0; color: #0f172a;">${formattedRequestDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Keperluan / Catatan</td>
          <td style="padding: 6px 0; color: #0f172a;">${request.purpose || '-'}</td>
        </tr>
      </table>

      <!-- Work Details -->
      <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">
        2. Rincian Pengerjaan / Barang yang Diserahkan
      </h3>
      <div style="background-color: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px;">
        ${detailsHtml}
      </div>

      <!-- Handover Section -->
      <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">
        3. Informasi Serah Terima Loket RR
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.6;">
        <tr>
          <td style="width: 38%; padding: 6px 0; color: #64748b;">Diserahkan Kepada / Pengambil</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${request.pickedUpBy || request.userName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Petugas Pelaksana RR</td>
          <td style="padding: 6px 0; color: #0f172a;">${request.processedBy || operatorName || 'Petugas Resources Room'}</td>
        </tr>
        ${request.adminNotes ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Catatan Khusus RR</td>
          <td style="padding: 6px 0; color: #0f172a; font-style: italic;">"${request.adminNotes}"</td>
        </tr>
        ` : ''}
      </table>

      <!-- Closing Note -->
      <p style="margin-top: 28px; font-size: 12px; line-height: 1.6; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        Laporan ini dikirimkan secara otomatis sebagai arsip pemberitahuan resmi untuk Kepala Unit. Jika terdapat pertanyaan atau konfirmasi lebih lanjut, silakan menghubungi loket Resources Room Sekolah Lazuardi.
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 16px 32px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center;">
      <strong>Resources Room (RR) — Sekolah Lazuardi Global Compassionate School</strong><br>
      Email: <a href="mailto:resources.room@lazuardi.sch.id" style="color: #0f766e; text-decoration: none;">resources.room@lazuardi.sch.id</a> • Website Layanan Internal
    </div>

  </div>
</body>
</html>
`;

  return {
    to: headEmail,
    toName: `${headName} (Kepala Unit ${unitName})`,
    cc: ccEmails,
    subject,
    plainBody,
    htmlBody,
    requestNumber: request.requestNumber,
    unitName,
    serviceType: request.serviceType,
    completedDate: formattedCompletedDate
  };
};

/**
 * Generate Direct Google Mail (Web) compose link
 * Opens directly in user's browser with school account
 */
export const getGmailComposeUrl = (emailData: EmailReportData): string => {
  const params = new URLSearchParams();
  params.set('view', 'cm');
  params.set('fs', '1');
  params.set('to', emailData.to);
  if (emailData.cc) params.set('cc', emailData.cc);
  params.set('su', emailData.subject);
  params.set('body', emailData.plainBody);

  return `https://mail.google.com/mail/?${params.toString()}`;
};

/**
 * Generate standard mailto URI for desktop/native mail clients
 */
export const getMailtoUrl = (emailData: EmailReportData): string => {
  const params = new URLSearchParams();
  if (emailData.cc) params.set('cc', emailData.cc);
  params.set('subject', emailData.subject);
  params.set('body', emailData.plainBody);

  return `mailto:${emailData.to}?${params.toString()}`;
};

const EMAIL_LOGS_STORAGE_KEY = 'lazuardi_email_notification_logs';

/**
 * Save notification log to local storage
 */
export const saveEmailNotificationLog = (log: EmailNotificationLog): void => {
  try {
    const existingStr = localStorage.getItem(EMAIL_LOGS_STORAGE_KEY);
    const logs: EmailNotificationLog[] = existingStr ? JSON.parse(existingStr) : [];
    // Unshift to top
    const updated = [log, ...logs.filter(l => l.id !== log.id)].slice(0, 100);
    localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save email notification log to localStorage:', e);
  }
};

/**
 * Retrieve notification logs
 */
export const getEmailNotificationLogs = (): EmailNotificationLog[] => {
  try {
    const existingStr = localStorage.getItem(EMAIL_LOGS_STORAGE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Clear all notification logs
 */
export const clearEmailNotificationLogs = (): void => {
  try {
    localStorage.removeItem(EMAIL_LOGS_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear email notification logs:', e);
  }
};
