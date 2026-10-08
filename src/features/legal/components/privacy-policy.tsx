"use client";

import { useLanguage } from "@/shared/providers/language-provider";
import {
  ExternalLink,
  InternalLink,
  LegalLayout,
  LegalSection,
  List,
  MailLink,
  P,
  Strong,
} from "./legal-layout";

const USER_DATA_POLICY = "https://developers.google.com/terms/api-services-user-data-policy";
const GOOGLE_PERMISSIONS = "https://myaccount.google.com/permissions";

// Kebijakan ini mengikuti persyaratan verifikasi OAuth Google
// (support.google.com/cloud/answer/13806988): menjelaskan akses, penggunaan,
// berbagi, perlindungan, serta retensi & penghapusan data pengguna Google,
// dan menyatakan kepatuhan Limited Use. Isi data Google disesuaikan dengan
// backend: scope "openid email profile"; yang disimpan hanya ID akun (sub),
// email, status verifikasi email, nama, dan URL foto profil.
export function PrivacyPolicy() {
  const { lang } = useLanguage();
  return lang === "id" ? <PrivacyPolicyId /> : <PrivacyPolicyEn />;
}

function PrivacyPolicyEn() {
  return (
    <LegalLayout
      footer={<>Questions about this policy? Email <MailLink /> or visit the <InternalLink href="/contact">Contact</InternalLink> page.</>}
      intro="This Privacy Policy explains how Priemman (“Priemman”, “we”, “us”) accesses, uses, stores, shares, and protects information when you use the Priemman website and services, including information we receive when you sign in with Google."
      lang="en"
      title="Privacy Policy"
      updated="October 8, 2026"
    >
      <LegalSection id="information-we-collect" title="Information we collect">
        <P>We collect information you provide directly when you create an account, complete your profile, publish projects, upload media, request creator access, or contact us. This may include your name, email address, headline, company, city and country, website, about text, work experience, avatar, projects, media, collections, likes, and saves.</P>
        <P>We also process technical information needed to run the service securely, such as session cookies, IP address, browser type, and request logs.</P>
      </LegalSection>

      <LegalSection id="google-user-data" title="Google user data we access">
        <P>When you choose “Sign in with Google”, Priemman requests only the following Google OAuth scopes: <Strong>openid</Strong>, <Strong>email</Strong>, and <Strong>profile</Strong>. With your consent, Google shares the following data with us:</P>
        <List>
          <li>Your Google account identifier.</li>
          <li>Your email address and whether Google has verified it.</li>
          <li>Your name.</li>
          <li>Your profile picture URL.</li>
        </List>
        <P>We do not request access to your Gmail, Google Drive, Google Calendar, Google Contacts, or any other Google Workspace or Google API data. The access token Google issues during sign-in is used once to retrieve the data above and is not stored.</P>
      </LegalSection>

      <LegalSection id="how-we-use-google-data" title="How we use Google user data">
        <List>
          <li>The account identifier and verified email are used to create your Priemman account, recognise you when you sign in again, and keep your account secure.</li>
          <li>Your name and profile picture are used to pre-fill your Priemman profile. You can change them at any time in your account settings, and they appear publicly only on your profile and published projects.</li>
          <li>Your email address is used to send service messages, such as a welcome email, sign-in codes, security notices, and replies to your support requests.</li>
        </List>
        <P>We use Google user data only to provide and improve the user-facing features of Priemman described in this policy. We do not use Google user data for advertising, and we do not use it to develop, improve, or train generalized or non-personalized AI or machine-learning models.</P>
      </LegalSection>

      <LegalSection id="limited-use" title="Limited Use disclosure">
        <P>Priemman’s use and transfer of information received from Google APIs to any other app will adhere to the <ExternalLink href={USER_DATA_POLICY}>Google API Services User Data Policy</ExternalLink>, including the Limited Use requirements. In particular, we do not:</P>
        <List>
          <li>Use or transfer Google user data for serving advertisements, including targeted, personalized, retargeted, or interest-based advertising.</li>
          <li>Sell Google user data, or transfer it to data brokers or information resellers.</li>
          <li>Use or transfer Google user data to determine credit-worthiness or for lending purposes.</li>
          <li>Allow humans to read Google user data, except with your affirmative consent, when necessary for security purposes or to investigate abuse, to comply with applicable law, or when the data has been aggregated and anonymized for internal operations.</li>
          <li>Use or transfer Google user data to train generalized AI or machine-learning models.</li>
        </List>
      </LegalSection>

      <LegalSection id="how-we-use-information" title="How we use other information">
        <List>
          <li>To authenticate you and maintain your account.</li>
          <li>To display your profile and published projects according to your visibility settings.</li>
          <li>To provide project publishing, media upload, collections, likes, saves, creator access review, and workspace features.</li>
          <li>To communicate service notices, security alerts, and support responses.</li>
          <li>To protect the service, prevent abuse, and comply with legal obligations.</li>
        </List>
      </LegalSection>

      <LegalSection id="sharing" title="How we share information">
        <P>We do not sell your personal information, and we do not share Google user data with third parties except as described below:</P>
        <List>
          <li><Strong>Public content you choose to publish.</Strong> Your public profile (name, avatar, headline, and other profile details you add) and projects marked public are visible to anyone. Your email address is never shown on your public profile.</li>
          <li><Strong>Service providers.</Strong> We use providers for hosting, databases, media storage and delivery, and email delivery. They process data only on our behalf, under confidentiality obligations, and only as needed to operate Priemman.</li>
          <li><Strong>Legal requirements.</Strong> We may disclose information when required by law, or when needed to protect the rights, safety, and security of our users and the service.</li>
          <li><Strong>Business transfers.</Strong> If Priemman is involved in a merger or acquisition, information may be transferred subject to this policy, and we will notify you before your data becomes subject to a different policy.</li>
        </List>
      </LegalSection>

      <LegalSection id="security" title="How we protect your data">
        <List>
          <li>All traffic between your browser and Priemman is encrypted in transit using HTTPS (TLS).</li>
          <li>Sessions use HttpOnly, Secure cookies with CSRF protection, and sign-in requests are protected with a one-time state value.</li>
          <li>Access to production systems and personal data is restricted to authorized team members who need it to operate the service.</li>
          <li>We do not store your Google password or Google access tokens.</li>
        </List>
        <P>No internet service can guarantee absolute security. Please contact us promptly if you believe your account has been compromised.</P>
      </LegalSection>

      <LegalSection id="retention-and-deletion" title="Data retention and deletion">
        <P>We keep your account information, including the Google user data listed above, for as long as your Priemman account is active. Drafts, unpublished projects, and private content remain stored until you delete them or your account.</P>
        <P>You can request deletion of your account and personal data at any time by emailing <MailLink /> from the email address associated with your account. After verifying the request, we delete your account, profile, projects, media, and the Google user data we hold within 30 days, except for information we must keep to comply with legal obligations, resolve disputes, or prevent fraud and abuse. Residual copies in backups are removed as those backups expire.</P>
        <P>You can also revoke Priemman’s access to your Google account at any time from your <ExternalLink href={GOOGLE_PERMISSIONS}>Google Account permissions page</ExternalLink>. Revoking access stops future sign-ins with Google but does not by itself delete data already stored by Priemman; send us a deletion request for that.</P>
      </LegalSection>

      <LegalSection id="your-choices" title="Your choices and rights">
        <P>You may review and update your profile in your account settings, change the visibility of your projects, and request access to, correction of, export of, or deletion of your personal information, subject to applicable law. To make a privacy request, email <MailLink /> or use the <InternalLink href="/contact">Contact</InternalLink> page.</P>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <P>Priemman is not intended for children under 13, or under the minimum age required to use online services in your country. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.</P>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <P>We may update this policy from time to time and will publish the new “Last updated” date on this page. If we change how Priemman uses Google user data, we will notify you in the app or by email before the change takes effect and, where required, ask for your consent again.</P>
      </LegalSection>
    </LegalLayout>
  );
}

function PrivacyPolicyId() {
  return (
    <LegalLayout
      footer={<>Ada pertanyaan tentang kebijakan ini? Kirim email ke <MailLink /> atau kunjungi halaman <InternalLink href="/contact">Kontak</InternalLink>.</>}
      intro="Kebijakan Privasi ini menjelaskan bagaimana Priemman (“Priemman”, “kami”) mengakses, menggunakan, menyimpan, membagikan, dan melindungi informasi saat Anda menggunakan situs dan layanan Priemman, termasuk informasi yang kami terima saat Anda masuk dengan Google."
      lang="id"
      title="Kebijakan Privasi"
      updated="8 Oktober 2026"
    >
      <LegalSection id="information-we-collect" title="Informasi yang kami kumpulkan">
        <P>Kami mengumpulkan informasi yang Anda berikan secara langsung saat membuat akun, melengkapi profil, menerbitkan proyek, mengunggah media, mengajukan akses kreator, atau menghubungi kami. Informasi ini dapat mencakup nama, alamat email, headline, perusahaan, kota dan negara, situs web, teks tentang diri Anda, pengalaman kerja, avatar, proyek, media, koleksi, suka, dan simpanan.</P>
        <P>Kami juga memproses informasi teknis yang diperlukan untuk menjalankan layanan dengan aman, seperti cookie sesi, alamat IP, jenis browser, dan log permintaan.</P>
      </LegalSection>

      <LegalSection id="google-user-data" title="Data pengguna Google yang kami akses">
        <P>Saat Anda memilih “Masuk dengan Google”, Priemman hanya meminta scope OAuth Google berikut: <Strong>openid</Strong>, <Strong>email</Strong>, dan <Strong>profile</Strong>. Dengan persetujuan Anda, Google membagikan data berikut kepada kami:</P>
        <List>
          <li>Pengenal (ID) akun Google Anda.</li>
          <li>Alamat email Anda dan status verifikasinya oleh Google.</li>
          <li>Nama Anda.</li>
          <li>URL foto profil Anda.</li>
        </List>
        <P>Kami tidak meminta akses ke Gmail, Google Drive, Google Calendar, Google Contacts, maupun data Google Workspace atau Google API lainnya. Token akses yang diterbitkan Google saat masuk hanya digunakan satu kali untuk mengambil data di atas dan tidak disimpan.</P>
      </LegalSection>

      <LegalSection id="how-we-use-google-data" title="Cara kami menggunakan data pengguna Google">
        <List>
          <li>ID akun dan email terverifikasi digunakan untuk membuat akun Priemman Anda, mengenali Anda saat masuk kembali, dan menjaga keamanan akun.</li>
          <li>Nama dan foto profil digunakan untuk mengisi awal profil Priemman Anda. Anda dapat mengubahnya kapan saja di pengaturan akun, dan keduanya hanya tampil secara publik di profil serta proyek yang Anda terbitkan.</li>
          <li>Alamat email digunakan untuk mengirim pesan layanan, seperti email sambutan, kode masuk, pemberitahuan keamanan, dan balasan atas permintaan dukungan Anda.</li>
        </List>
        <P>Kami menggunakan data pengguna Google hanya untuk menyediakan dan meningkatkan fitur Priemman yang digunakan langsung oleh pengguna sebagaimana dijelaskan dalam kebijakan ini. Kami tidak menggunakan data pengguna Google untuk iklan, dan tidak menggunakannya untuk mengembangkan, meningkatkan, atau melatih model AI atau machine learning yang bersifat umum atau tidak dipersonalisasi.</P>
      </LegalSection>

      <LegalSection id="limited-use" title="Pernyataan Limited Use">
        <P>Penggunaan dan pengalihan informasi yang diterima Priemman dari Google API ke aplikasi lain akan mematuhi <ExternalLink href={USER_DATA_POLICY}>Kebijakan Data Pengguna Layanan Google API</ExternalLink> (Google API Services User Data Policy), termasuk persyaratan Limited Use. Secara khusus, kami tidak:</P>
        <List>
          <li>Menggunakan atau mengalihkan data pengguna Google untuk menayangkan iklan, termasuk iklan bertarget, dipersonalisasi, retargeting, atau berbasis minat.</li>
          <li>Menjual data pengguna Google, atau mengalihkannya kepada pialang data atau penjual kembali informasi.</li>
          <li>Menggunakan atau mengalihkan data pengguna Google untuk menilai kelayakan kredit atau untuk tujuan pinjaman.</li>
          <li>Mengizinkan manusia membaca data pengguna Google, kecuali dengan persetujuan tegas dari Anda, bila diperlukan untuk keamanan atau menyelidiki penyalahgunaan, untuk mematuhi hukum yang berlaku, atau bila data telah diagregasi dan dianonimkan untuk operasional internal.</li>
          <li>Menggunakan atau mengalihkan data pengguna Google untuk melatih model AI atau machine learning yang bersifat umum.</li>
        </List>
      </LegalSection>

      <LegalSection id="how-we-use-information" title="Cara kami menggunakan informasi lainnya">
        <List>
          <li>Untuk mengautentikasi Anda dan mengelola akun Anda.</li>
          <li>Untuk menampilkan profil dan proyek yang Anda terbitkan sesuai pengaturan visibilitas.</li>
          <li>Untuk menyediakan fitur penerbitan proyek, unggah media, koleksi, suka, simpanan, peninjauan akses kreator, dan workspace.</li>
          <li>Untuk mengirim pemberitahuan layanan, peringatan keamanan, dan tanggapan dukungan.</li>
          <li>Untuk melindungi layanan, mencegah penyalahgunaan, dan memenuhi kewajiban hukum.</li>
        </List>
      </LegalSection>

      <LegalSection id="sharing" title="Cara kami membagikan informasi">
        <P>Kami tidak menjual informasi pribadi Anda, dan kami tidak membagikan data pengguna Google kepada pihak ketiga kecuali sebagaimana dijelaskan di bawah ini:</P>
        <List>
          <li><Strong>Konten publik yang Anda pilih untuk diterbitkan.</Strong> Profil publik Anda (nama, avatar, headline, dan detail profil lain yang Anda tambahkan) serta proyek bertanda publik dapat dilihat oleh siapa saja. Alamat email Anda tidak pernah ditampilkan di profil publik.</li>
          <li><Strong>Penyedia layanan.</Strong> Kami menggunakan penyedia untuk hosting, basis data, penyimpanan dan pengiriman media, serta pengiriman email. Mereka memproses data hanya atas nama kami, di bawah kewajiban kerahasiaan, dan hanya sejauh diperlukan untuk menjalankan Priemman.</li>
          <li><Strong>Kewajiban hukum.</Strong> Kami dapat mengungkapkan informasi bila diwajibkan oleh hukum, atau bila diperlukan untuk melindungi hak, keselamatan, dan keamanan pengguna serta layanan kami.</li>
          <li><Strong>Pengalihan usaha.</Strong> Jika Priemman terlibat dalam merger atau akuisisi, informasi dapat dialihkan dengan tetap tunduk pada kebijakan ini, dan kami akan memberi tahu Anda sebelum data Anda tunduk pada kebijakan yang berbeda.</li>
        </List>
      </LegalSection>

      <LegalSection id="security" title="Cara kami melindungi data Anda">
        <List>
          <li>Seluruh lalu lintas antara browser Anda dan Priemman dienkripsi saat transit menggunakan HTTPS (TLS).</li>
          <li>Sesi menggunakan cookie HttpOnly dan Secure dengan perlindungan CSRF, dan permintaan masuk dilindungi dengan nilai state sekali pakai.</li>
          <li>Akses ke sistem produksi dan data pribadi dibatasi hanya untuk anggota tim berwenang yang memerlukannya untuk menjalankan layanan.</li>
          <li>Kami tidak menyimpan kata sandi Google maupun token akses Google Anda.</li>
        </List>
        <P>Tidak ada layanan internet yang dapat menjamin keamanan mutlak. Segera hubungi kami jika Anda yakin akun Anda telah disusupi.</P>
      </LegalSection>

      <LegalSection id="retention-and-deletion" title="Retensi dan penghapusan data">
        <P>Kami menyimpan informasi akun Anda, termasuk data pengguna Google yang disebutkan di atas, selama akun Priemman Anda aktif. Draf, proyek yang belum diterbitkan, dan konten privat tetap tersimpan hingga Anda menghapusnya atau menghapus akun Anda.</P>
        <P>Anda dapat meminta penghapusan akun dan data pribadi kapan saja dengan mengirim email ke <MailLink /> dari alamat email yang terhubung dengan akun Anda. Setelah permintaan diverifikasi, kami menghapus akun, profil, proyek, media, dan data pengguna Google yang kami simpan dalam waktu 30 hari, kecuali informasi yang wajib kami simpan untuk memenuhi kewajiban hukum, menyelesaikan sengketa, atau mencegah penipuan dan penyalahgunaan. Salinan sisa di cadangan (backup) akan terhapus saat masa berlaku cadangan tersebut berakhir.</P>
        <P>Anda juga dapat mencabut akses Priemman ke akun Google Anda kapan saja melalui <ExternalLink href={GOOGLE_PERMISSIONS}>halaman izin Akun Google</ExternalLink>. Mencabut akses akan menghentikan proses masuk dengan Google berikutnya, tetapi tidak dengan sendirinya menghapus data yang sudah disimpan Priemman; kirimkan permintaan penghapusan kepada kami untuk itu.</P>
      </LegalSection>

      <LegalSection id="your-choices" title="Pilihan dan hak Anda">
        <P>Anda dapat meninjau dan memperbarui profil di pengaturan akun, mengubah visibilitas proyek, serta meminta akses, perbaikan, ekspor, atau penghapusan informasi pribadi Anda, sesuai hukum yang berlaku, termasuk Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi. Untuk mengajukan permintaan terkait privasi, kirim email ke <MailLink /> atau gunakan halaman <InternalLink href="/contact">Kontak</InternalLink>.</P>
      </LegalSection>

      <LegalSection id="children" title="Anak-anak">
        <P>Priemman tidak ditujukan untuk anak di bawah usia 13 tahun, atau di bawah usia minimum untuk menggunakan layanan daring di negara Anda. Kami tidak dengan sengaja mengumpulkan informasi pribadi dari anak-anak. Jika Anda yakin seorang anak telah memberikan informasi pribadi kepada kami, hubungi kami dan kami akan menghapusnya.</P>
      </LegalSection>

      <LegalSection id="changes" title="Perubahan kebijakan ini">
        <P>Kami dapat memperbarui kebijakan ini dari waktu ke waktu dan akan mencantumkan tanggal “Terakhir diperbarui” yang baru di halaman ini. Jika kami mengubah cara Priemman menggunakan data pengguna Google, kami akan memberi tahu Anda melalui aplikasi atau email sebelum perubahan berlaku dan, bila diwajibkan, meminta persetujuan Anda kembali.</P>
      </LegalSection>
    </LegalLayout>
  );
}
