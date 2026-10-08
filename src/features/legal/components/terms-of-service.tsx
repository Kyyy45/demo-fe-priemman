"use client";

import { useLanguage } from "@/shared/providers/language-provider";
import { InternalLink, LegalLayout, LegalSection, List, MailLink, P } from "./legal-layout";

export function TermsOfService() {
  const { lang } = useLanguage();
  return lang === "id" ? <TermsOfServiceId /> : <TermsOfServiceEn />;
}

function TermsOfServiceEn() {
  return (
    <LegalLayout
      footer={<>Questions about these terms? Email <MailLink /> or visit the <InternalLink href="/contact">Contact</InternalLink> page.</>}
      intro="These Terms of Service govern your access to and use of the Priemman website and services."
      lang="en"
      title="Terms of Service"
      updated="October 8, 2026"
    >
      <LegalSection id="using-priemman" title="Using Priemman">
        <P>You may use Priemman only in compliance with these terms and applicable law. You are responsible for keeping your account secure and for activity performed through your account. Information submitted to Priemman must be accurate and must not impersonate another person.</P>
      </LegalSection>
      <LegalSection id="your-content" title="Your content">
        <P>You retain ownership of content you submit. You grant Priemman a limited, non-exclusive license to host, process, display, and distribute that content as necessary to operate the service and according to your visibility settings. You represent that you have the rights required to submit the content.</P>
      </LegalSection>
      <LegalSection id="prohibited-conduct" title="Prohibited conduct">
        <List>
          <li>Do not upload unlawful, infringing, malicious, deceptive, or abusive content.</li>
          <li>Do not attempt to access another account, bypass security, or disrupt the service.</li>
          <li>Do not use Priemman to distribute spam, malware, or unsolicited commercial messages.</li>
          <li>Do not misuse public profiles, media, comments, or creator access workflows.</li>
        </List>
      </LegalSection>
      <LegalSection id="creator-access" title="Creator access and third-party sign-in">
        <P>Creator access is subject to review and may be approved, rejected, suspended, or revoked. Google and other identity providers authenticate accounts under their own terms. Priemman is not responsible for outages or policies of third-party services. How we handle data received from these providers is described in our <InternalLink href="/privacy-policy">Privacy Policy</InternalLink>.</P>
      </LegalSection>
      <LegalSection id="availability" title="Availability and termination">
        <P>We may change, suspend, or discontinue parts of Priemman to maintain or improve the service. We may suspend or terminate access when these terms are violated, the account presents a security risk, or required by law. You may stop using Priemman at any time.</P>
      </LegalSection>
      <LegalSection id="liability" title="Disclaimers and liability">
        <P>Priemman is provided on an “as available” basis. To the extent permitted by law, Priemman disclaims warranties and will not be liable for indirect, incidental, special, or consequential losses arising from use of the service.</P>
      </LegalSection>
      <LegalSection id="changes" title="Changes and contact">
        <P>We may update these terms by publishing a revised version with a new effective date. Continued use after the effective date means you accept the revised terms.</P>
      </LegalSection>
    </LegalLayout>
  );
}

function TermsOfServiceId() {
  return (
    <LegalLayout
      footer={<>Ada pertanyaan tentang ketentuan ini? Kirim email ke <MailLink /> atau kunjungi halaman <InternalLink href="/contact">Kontak</InternalLink>.</>}
      intro="Ketentuan Layanan ini mengatur akses dan penggunaan Anda atas situs dan layanan Priemman."
      lang="id"
      title="Ketentuan Layanan"
      updated="8 Oktober 2026"
    >
      <LegalSection id="using-priemman" title="Menggunakan Priemman">
        <P>Anda hanya boleh menggunakan Priemman sesuai dengan ketentuan ini dan hukum yang berlaku. Anda bertanggung jawab menjaga keamanan akun Anda dan atas aktivitas yang dilakukan melalui akun Anda. Informasi yang Anda kirimkan ke Priemman harus akurat dan tidak boleh menyamar sebagai orang lain.</P>
      </LegalSection>
      <LegalSection id="your-content" title="Konten Anda">
        <P>Anda tetap memiliki hak atas konten yang Anda kirimkan. Anda memberikan kepada Priemman lisensi terbatas dan non-eksklusif untuk menyimpan, memproses, menampilkan, dan mendistribusikan konten tersebut sejauh diperlukan untuk menjalankan layanan dan sesuai pengaturan visibilitas Anda. Anda menyatakan bahwa Anda memiliki hak yang diperlukan untuk mengirimkan konten tersebut.</P>
      </LegalSection>
      <LegalSection id="prohibited-conduct" title="Tindakan yang dilarang">
        <List>
          <li>Jangan mengunggah konten yang melanggar hukum, melanggar hak pihak lain, berbahaya, menyesatkan, atau kasar.</li>
          <li>Jangan mencoba mengakses akun lain, menembus sistem keamanan, atau mengganggu layanan.</li>
          <li>Jangan menggunakan Priemman untuk menyebarkan spam, malware, atau pesan komersial yang tidak diminta.</li>
          <li>Jangan menyalahgunakan profil publik, media, komentar, atau alur pengajuan akses kreator.</li>
        </List>
      </LegalSection>
      <LegalSection id="creator-access" title="Akses kreator dan masuk melalui pihak ketiga">
        <P>Akses kreator memerlukan peninjauan dan dapat disetujui, ditolak, ditangguhkan, atau dicabut. Google dan penyedia identitas lainnya mengautentikasi akun berdasarkan ketentuan mereka sendiri. Priemman tidak bertanggung jawab atas gangguan layanan atau kebijakan layanan pihak ketiga. Cara kami menangani data yang diterima dari penyedia tersebut dijelaskan dalam <InternalLink href="/privacy-policy">Kebijakan Privasi</InternalLink> kami.</P>
      </LegalSection>
      <LegalSection id="availability" title="Ketersediaan dan pengakhiran">
        <P>Kami dapat mengubah, menangguhkan, atau menghentikan sebagian layanan Priemman untuk pemeliharaan atau peningkatan layanan. Kami dapat menangguhkan atau mengakhiri akses apabila ketentuan ini dilanggar, akun menimbulkan risiko keamanan, atau diwajibkan oleh hukum. Anda dapat berhenti menggunakan Priemman kapan saja.</P>
      </LegalSection>
      <LegalSection id="liability" title="Penafian dan batasan tanggung jawab">
        <P>Priemman disediakan “sebagaimana tersedia”. Sejauh diizinkan oleh hukum, Priemman tidak memberikan jaminan dan tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, atau konsekuensial yang timbul dari penggunaan layanan.</P>
      </LegalSection>
      <LegalSection id="changes" title="Perubahan dan kontak">
        <P>Kami dapat memperbarui ketentuan ini dengan menerbitkan versi revisi beserta tanggal berlaku yang baru. Dengan tetap menggunakan layanan setelah tanggal berlaku tersebut, Anda dianggap menyetujui ketentuan yang telah direvisi.</P>
      </LegalSection>
    </LegalLayout>
  );
}
