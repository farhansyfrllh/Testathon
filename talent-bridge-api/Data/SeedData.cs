using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TalentBridgeApi.Models;

namespace TalentBridgeApi.Data;

/// <summary>
/// Idempotent seed data — realistic dataset for Batam-Singapore data center ecosystem.
/// 6 courses (18 modules, 54 questions) + 15 jobs.
/// </summary>
public static class SeedData
{
    // ── Course IDs ───────────────────────────────────────────────────────────
    private static readonly Guid C1 = new("11111111-0000-0000-0000-000000000001"); // Data Center Fundamentals
    private static readonly Guid C2 = new("11111111-0000-0000-0000-000000000002"); // Cybersecurity Essentials
    private static readonly Guid C3 = new("11111111-0000-0000-0000-000000000003"); // Cloud Computing & Virtualization
    private static readonly Guid C4 = new("11111111-0000-0000-0000-000000000004"); // Linux Administration
    private static readonly Guid C5 = new("11111111-0000-0000-0000-000000000005"); // Power & Cooling Engineering
    private static readonly Guid C6 = new("11111111-0000-0000-0000-000000000006"); // Network Infrastructure

    // ── Module IDs ───────────────────────────────────────────────────────────
    // C1
    private static readonly Guid C1M1 = new("21111111-0000-0000-0001-000000000001");
    private static readonly Guid C1M2 = new("21111111-0000-0000-0001-000000000002");
    private static readonly Guid C1M3 = new("21111111-0000-0000-0001-000000000003");
    // C2
    private static readonly Guid C2M1 = new("21111111-0000-0000-0002-000000000001");
    private static readonly Guid C2M2 = new("21111111-0000-0000-0002-000000000002");
    private static readonly Guid C2M3 = new("21111111-0000-0000-0002-000000000003");
    // C3
    private static readonly Guid C3M1 = new("21111111-0000-0000-0003-000000000001");
    private static readonly Guid C3M2 = new("21111111-0000-0000-0003-000000000002");
    private static readonly Guid C3M3 = new("21111111-0000-0000-0003-000000000003");
    // C4
    private static readonly Guid C4M1 = new("21111111-0000-0000-0004-000000000001");
    private static readonly Guid C4M2 = new("21111111-0000-0000-0004-000000000002");
    private static readonly Guid C4M3 = new("21111111-0000-0000-0004-000000000003");
    // C5
    private static readonly Guid C5M1 = new("21111111-0000-0000-0005-000000000001");
    private static readonly Guid C5M2 = new("21111111-0000-0000-0005-000000000002");
    private static readonly Guid C5M3 = new("21111111-0000-0000-0005-000000000003");
    // C6
    private static readonly Guid C6M1 = new("21111111-0000-0000-0006-000000000001");
    private static readonly Guid C6M2 = new("21111111-0000-0000-0006-000000000002");
    private static readonly Guid C6M3 = new("21111111-0000-0000-0006-000000000003");

    // ── Job IDs ──────────────────────────────────────────────────────────────
    private static readonly Guid J01 = new("51111111-0000-0000-0000-000000000001");
    private static readonly Guid J02 = new("51111111-0000-0000-0000-000000000002");
    private static readonly Guid J03 = new("51111111-0000-0000-0000-000000000003");
    private static readonly Guid J04 = new("51111111-0000-0000-0000-000000000004");
    private static readonly Guid J05 = new("51111111-0000-0000-0000-000000000005");
    private static readonly Guid J06 = new("51111111-0000-0000-0000-000000000006");
    private static readonly Guid J07 = new("51111111-0000-0000-0000-000000000007");
    private static readonly Guid J08 = new("51111111-0000-0000-0000-000000000008");
    private static readonly Guid J09 = new("51111111-0000-0000-0000-000000000009");
    private static readonly Guid J10 = new("51111111-0000-0000-0000-000000000010");
    private static readonly Guid J11 = new("51111111-0000-0000-0000-000000000011");
    private static readonly Guid J12 = new("51111111-0000-0000-0000-000000000012");
    private static readonly Guid J13 = new("51111111-0000-0000-0000-000000000013");
    private static readonly Guid J14 = new("51111111-0000-0000-0000-000000000014");
    private static readonly Guid J15 = new("51111111-0000-0000-0000-000000000015");

    // ── Helper ───────────────────────────────────────────────────────────────
    private static Guid QId(int course, int module, int question) =>
        new($"3{course:D1}{module:D1}11111-0000-0000-0000-{question:D12}");

    private static Guid OId(int course, int module, int question, int option) =>
        new($"4{course:D1}{module:D1}{question:D1}1111-0000-0000-0000-{option:D12}");

    // ── Entry point ──────────────────────────────────────────────────────────
    public static async Task InitializeAsync(AppDbContext context)
    {
        if (await context.Courses.AnyAsync()) return;

        var courses = BuildCourses();
        var jobs    = BuildJobs();

        await context.Courses.AddRangeAsync(courses);
        await context.Jobs.AddRangeAsync(jobs);
        await context.SaveChangesAsync();
    }

    // ════════════════════════════════════════════════════════════════════════
    // COURSES
    // ════════════════════════════════════════════════════════════════════════
    private static List<Course> BuildCourses() => new()
    {
        Course1_DataCenterFundamentals(),
        Course2_CybersecurityEssentials(),
        Course3_CloudComputing(),
        Course4_LinuxAdministration(),
        Course5_PowerCooling(),
        Course6_NetworkInfrastructure(),
    };

    // ── COURSE 1: Data Center Fundamentals ──────────────────────────────────
    private static Course Course1_DataCenterFundamentals() => new()
    {
        Id                 = C1,
        Title              = "Data Center Fundamentals",
        Category           = "Infrastructure",
        RequiredSkillsJson = Js(new[] { "Data Center Operations", "Power Systems", "Cooling Systems", "Networking" }),
        Modules            = new List<CourseModule>
        {
            // Module 1 — MCQ: Core Components
            Mod(C1M1, C1, 1, "mcq", "Komponen Utama Data Center", new List<Question>
            {
                Mcq(QId(1,1,1), C1M1,
                    "Apa fungsi utama UPS (Uninterruptible Power Supply) di data center?",
                    ("Menyimpan data secara permanen", false),
                    ("Menyediakan daya cadangan saat listrik padam", true),
                    ("Mengatur suhu ruangan server", false),
                    ("Mengelola traffic jaringan", false)),

                Mcq(QId(1,1,2), C1M1,
                    "Perangkat apa yang menghubungkan beberapa server dalam satu jaringan lokal di data center?",
                    ("CRAC Unit", false),
                    ("PDU (Power Distribution Unit)", false),
                    ("Network Switch", true),
                    ("Transformer", false)),

                Mcq(QId(1,1,3), C1M1,
                    "Apa kepanjangan PUE dan apa artinya?",
                    ("Power Unit Efficiency — efisiensi unit daya", false),
                    ("Power Usage Effectiveness — rasio total daya vs daya IT", true),
                    ("Physical Utility Estimation — estimasi utilitas fisik", false),
                    ("Primary Unit Exchange — pertukaran unit utama", false)),

                Mcq(QId(1,1,4), C1M1,
                    "Apa yang dimaksud dengan Tier IV dalam klasifikasi Uptime Institute?",
                    ("Satu jalur distribusi daya tanpa redundansi", false),
                    ("Fault-tolerant dengan 99.995% uptime guarantee", true),
                    ("Data center tanpa pendingin aktif", false),
                    ("Kluster server skala kecil di kantor", false)),

                Mcq(QId(1,1,5), C1M1,
                    "Berapa nilai PUE ideal yang menjadi target data center modern (green DC)?",
                    ("3.0 — tiga kali lipat dari beban IT", false),
                    ("2.0 — dua kali lipat dari beban IT", false),
                    ("1.2 atau lebih rendah", true),
                    ("0.5 — lebih hemat dari beban IT", false)),
            }),

            // Module 2 — Multi-select: Power & Cooling Standards
            Mod(C1M2, C1, 2, "multi_select", "Standar Daya & Pendingin", new List<Question>
            {
                MultiSelect(QId(1,2,1), C1M2,
                    "Pilih semua metode cooling yang umum di data center modern:",
                    ("CRAC (Computer Room Air Conditioning)", true),
                    ("Liquid Cooling / Immersion Cooling", true),
                    ("Free Cooling (Air-Side Economizer)", true),
                    ("Kipas meja biasa 12 inci", false)),

                MultiSelect(QId(1,2,2), C1M2,
                    "Komponen mana yang termasuk dalam sistem distribusi daya data center?",
                    ("PDU (Power Distribution Unit)", true),
                    ("Automatic Transfer Switch (ATS)", true),
                    ("Optical Fiber Splice Tray", false),
                    ("Diesel Generator", true)),

                MultiSelect(QId(1,2,3), C1M2,
                    "Standar/regulasi mana yang relevan untuk data center?",
                    ("TIA-942 (Data Center Standard)", true),
                    ("Uptime Institute Tier Classification", true),
                    ("ISO/IEC 30134 (Data Center KPIs)", true),
                    ("IEEE 802.11ax (Wi-Fi 6)", false)),

                MultiSelect(QId(1,2,4), C1M2,
                    "Praktik mana yang mengurangi konsumsi energi cooling di data center?",
                    ("Hot aisle/cold aisle containment", true),
                    ("Menaikkan suhu setpoint server (ASHRAE A2: hingga 35°C)", true),
                    ("Mematikan semua AC dan mengandalkan ventilasi alami", false),
                    ("Variable speed drives pada pompa cooling tower", true)),
                    
                TrueFalse(QId(1,2,5), C1M2, "Standar ANSI/TIA-942 menetapkan Tier IV sebagai tingkat redundansi dan ketersediaan tertinggi (fault tolerant).", true),
            }),

            // Module 3 — Drag-drop: Component → Zone
            Mod(C1M3, C1, 3, "drag_drop", "Mapping Komponen ke Zona Data Center", new List<Question>
            {
                DragDrop(QId(1,3,1), C1M3,
                    "Drag setiap komponen ke zona yang tepat (Power / Network / Compute / Cooling):",
                    ("UPS", 0), ("Network Switch", 1), ("Server Rack", 2), ("CRAC Unit", 3)),

                DragDrop(QId(1,3,2), C1M3,
                    "Tempatkan perangkat berikut ke zona yang benar:",
                    ("PDU", 0), ("Firewall", 1), ("Blade Server", 2), ("Cooling Tower", 3)),

                DragDrop(QId(1,3,3), C1M3,
                    "Identifikasi zona untuk setiap infrastruktur berikut:",
                    ("Diesel Generator", 0), ("Router", 1), ("GPU Cluster", 2), ("Chiller Unit", 3)),
                    
                TrueFalse(QId(1,3,4), C1M3, "Zone 'Compute' di dalam Data Center merupakan area utama yang mengkonsumsi paling banyak daya listrik dibandingkan zona lainnya.", true),
                TrueFalse(QId(1,3,5), C1M3, "Network Switch Core sebaiknya diletakkan berdekatan dengan Chiller Unit agar mendapat pendinginan maksimal.", false),
            }),
        }
    };

    // ── COURSE 2: Cybersecurity Essentials ──────────────────────────────────
    private static Course Course2_CybersecurityEssentials() => new()
    {
        Id                 = C2,
        Title              = "Cybersecurity Essentials",
        Category           = "Security",
        RequiredSkillsJson = Js(new[] { "Cybersecurity", "Networking", "Linux Administration" }),
        Modules            = new List<CourseModule>
        {
            Mod(C2M1, C2, 1, "mcq", "Konsep Keamanan Siber Dasar", new List<Question>
            {
                Mcq(QId(2,1,1), C2M1,
                    "Apa yang dimaksud 'defense in depth' dalam keamanan siber?",
                    ("Menggunakan satu firewall yang sangat kuat", false),
                    ("Strategi berlapis dengan multiple layer keamanan", true),
                    ("Menyembunyikan server di jaringan tertutup", false),
                    ("Enkripsi seluruh data di database", false)),

                Mcq(QId(2,1,2), C2M1,
                    "Serangan apa yang menyamar sebagai entitas terpercaya untuk mencuri kredensial?",
                    ("DDoS Attack", false),
                    ("SQL Injection", false),
                    ("Phishing / Spear Phishing", true),
                    ("Buffer Overflow", false)),

                Mcq(QId(2,1,3), C2M1,
                    "Port berapa yang digunakan HTTPS secara default?",
                    ("80", false),
                    ("443", true),
                    ("22", false),
                    ("8080", false)),

                Mcq(QId(2,1,4), C2M1,
                    "Apa fungsi SIEM (Security Information and Event Management)?",
                    ("Memblokir traffic jaringan secara otomatis", false),
                    ("Mengenkripsi data saat transit", false),
                    ("Mengumpulkan dan menganalisis log keamanan secara terpusat", true),
                    ("Memindai vulnerability pada aplikasi web", false)),

                Mcq(QId(2,1,5), C2M1,
                    "Apa itu Zero Trust Architecture?",
                    ("Tidak mempercayai siapapun, verifikasi setiap akses meski dari dalam jaringan", true),
                    ("Menonaktifkan semua firewall untuk mempermudah akses", false),
                    ("Sistem keamanan tanpa password", false),
                    ("VPN yang tidak memerlukan otentikasi", false)),
            }),

            Mod(C2M2, C2, 2, "multi_select", "Jenis-Jenis Ancaman Siber", new List<Question>
            {
                MultiSelect(QId(2,2,1), C2M2,
                    "Pilih semua yang termasuk kategori malware:",
                    ("Ransomware", true),
                    ("Trojan Horse", true),
                    ("Spyware", true),
                    ("VPN Client", false)),

                MultiSelect(QId(2,2,2), C2M2,
                    "Teknik apa yang digunakan attacker dalam Advanced Persistent Threat (APT)?",
                    ("Spear phishing untuk initial access", true),
                    ("Lateral movement dalam jaringan internal", true),
                    ("Menginstall antivirus terbaru", false),
                    ("Data exfiltration secara bertahap dan tersembunyi", true)),

                MultiSelect(QId(2,2,3), C2M2,
                    "Kontrol keamanan mana yang termasuk dalam kategori 'preventive controls'?",
                    ("Multi-Factor Authentication (MFA)", true),
                    ("Firewall rules", true),
                    ("Intrusion Detection System (IDS)", false),
                    ("Patch management rutin", true)),

                MultiSelect(QId(2,2,4), C2M2,
                    "Apa saja komponen dari CIA Triad dalam keamanan informasi?",
                    ("Confidentiality (Kerahasiaan)", true),
                    ("Integrity (Integritas)", true),
                    ("Availability (Ketersediaan)", true),
                    ("Accountability (Akuntabilitas)", false)),
            }),

            Mod(C2M3, C2, 3, "drag_drop", "Security Tools ke Fase NIST Framework", new List<Question>
            {
                // Zones: 0=Prevent, 1=Detect, 2=Respond, 3=Recover
                DragDrop(QId(2,3,1), C2M3,
                    "Tempatkan security tools ke fase NIST CSF yang tepat (Prevent/Detect/Respond/Recover):",
                    ("Firewall", 0), ("IDS/IPS", 1), ("Incident Response Plan", 2), ("Backup & Restore", 3)),

                DragDrop(QId(2,3,2), C2M3,
                    "Drag tools Linux security ke fungsi yang benar:",
                    ("iptables", 0), ("Snort", 1), ("Metasploit (pen-test)", 2), ("rsync backup", 3)),

                DragDrop(QId(2,3,3), C2M3,
                    "Kategorikan kontrol keamanan berikut:",
                    ("Multi-Factor Authentication", 0), ("SIEM System", 1), ("Forensic Analysis", 2), ("Disaster Recovery Plan", 3)),
            }),
        }
    };

    // ── COURSE 3: Cloud Computing & Virtualization ───────────────────────────
    private static Course Course3_CloudComputing() => new()
    {
        Id                 = C3,
        Title              = "Cloud Computing & Virtualization",
        Category           = "Cloud",
        RequiredSkillsJson = Js(new[] { "Cloud Computing", "Virtualization", "Networking", "Linux Administration" }),
        Modules            = new List<CourseModule>
        {
            Mod(C3M1, C3, 1, "mcq", "Konsep Cloud & Virtualisasi", new List<Question>
            {
                Mcq(QId(3,1,1), C3M1,
                    "Apa perbedaan utama antara IaaS, PaaS, dan SaaS?",
                    ("Ketiganya sama — hanya penamaan berbeda dari vendor berbeda", false),
                    ("IaaS=infrastruktur, PaaS=platform dev, SaaS=software siap pakai", true),
                    ("IaaS untuk gaming, PaaS untuk bisnis, SaaS untuk personal", false),
                    ("Ketiganya hanya berjalan di AWS", false)),

                Mcq(QId(3,1,2), C3M1,
                    "Apa fungsi hypervisor dalam virtualisasi?",
                    ("Mengelola koneksi internet pada server", false),
                    ("Mempartisi hardware fisik untuk menjalankan beberapa VM secara bersamaan", true),
                    ("Mengoptimalkan kecepatan CPU secara otomatis", false),
                    ("Sistem operasi khusus untuk server IBM", false)),

                Mcq(QId(3,1,3), C3M1,
                    "Apa yang dimaksud 'containers' vs 'virtual machines'?",
                    ("Container membutuhkan OS lengkap, VM lebih ringan", false),
                    ("Container berbagi OS kernel host (lebih ringan), VM punya OS sendiri", true),
                    ("Container dan VM adalah hal yang sama persis", false),
                    ("Container hanya bisa digunakan di Linux", false)),

                Mcq(QId(3,1,4), C3M1,
                    "Teknologi hypervisor Type 1 (bare-metal) yang umum digunakan di data center adalah:",
                    ("VirtualBox dan VMware Workstation", false),
                    ("VMware ESXi, Microsoft Hyper-V, KVM", true),
                    ("Docker dan Podman", false),
                    ("Xen hanya — tidak ada yang lain", false)),

                Mcq(QId(3,1,5), C3M1,
                    "Apa keuntungan utama cloud hybrid untuk data center?",
                    ("Tidak perlu infrastruktur on-premise sama sekali", false),
                    ("Fleksibilitas: workload sensitif on-prem, workload fleksibel di public cloud", true),
                    ("Gratis sepenuhnya tanpa biaya operasional", false),
                    ("Performa selalu lebih baik dari on-premise", false)),
            }),

            Mod(C3M2, C3, 2, "multi_select", "Layanan & Strategi Cloud", new List<Question>
            {
                MultiSelect(QId(3,2,1), C3M2,
                    "Pilih manfaat utama cloud computing untuk bisnis:",
                    ("Skalabilitas elastis sesuai kebutuhan", true),
                    ("Pay-as-you-go — bayar sesuai pemakaian", true),
                    ("Tidak memerlukan koneksi internet", false),
                    ("Disaster recovery yang lebih mudah", true)),

                MultiSelect(QId(3,2,2), C3M2,
                    "Teknologi mana yang mendukung Container Orchestration?",
                    ("Kubernetes (K8s)", true),
                    ("Docker Swarm", true),
                    ("Apache Hadoop", false),
                    ("OpenShift", true)),

                MultiSelect(QId(3,2,3), C3M2,
                    "Fitur apa yang tersedia di VMware vSphere untuk high availability?",
                    ("vMotion — live migration VM tanpa downtime", true),
                    ("HA (High Availability) — auto restart VM", true),
                    ("DRS (Distributed Resource Scheduler)", true),
                    ("vSphere Chat — komunikasi admin", false)),

                MultiSelect(QId(3,2,4), C3M2,
                    "Tantangan keamanan apa yang khusus untuk cloud environment?",
                    ("Misconfiguration storage bucket (data breach)", true),
                    ("Shared responsibility model yang perlu dipahami", true),
                    ("Tidak ada risiko keamanan di cloud", false),
                    ("Identity and Access Management (IAM) yang lemah", true)),
            }),

            Mod(C3M3, C3, 3, "drag_drop", "Cloud Service Models", new List<Question>
            {
                // Zones: 0=IaaS, 1=PaaS, 2=SaaS, 3=On-Premise
                DragDrop(QId(3,3,1), C3M3,
                    "Drag layanan ke kategori cloud model yang tepat (IaaS/PaaS/SaaS/On-Premise):",
                    ("AWS EC2 Virtual Machines", 0), ("Google App Engine", 1), ("Microsoft 365", 2), ("Physical Server Rack", 3)),

                DragDrop(QId(3,3,2), C3M3,
                    "Kategori tanggung jawab keamanan (Siapa yang mengelola?):",
                    ("Hypervisor Layer", 0), ("Application Runtime", 1), ("User Data & Access", 2), ("Physical Datacenter", 3)),

                DragDrop(QId(3,3,3), C3M3,
                    "Tempatkan komponen ke arsitektur cloud yang benar:",
                    ("Load Balancer", 0), ("CI/CD Pipeline", 1), ("SaaS Application", 2), ("Bare Metal Server", 3)),
            }),
        }
    };

    // ── COURSE 4: Linux Administration ──────────────────────────────────────
    private static Course Course4_LinuxAdministration() => new()
    {
        Id                 = C4,
        Title              = "Linux Administration for Data Centers",
        Category           = "Operations",
        RequiredSkillsJson = Js(new[] { "Linux Administration", "Networking", "Cybersecurity" }),
        Modules            = new List<CourseModule>
        {
            Mod(C4M1, C4, 1, "mcq", "Perintah & Konsep Linux Dasar", new List<Question>
            {
                Mcq(QId(4,1,1), C4M1,
                    "Perintah apa yang digunakan untuk melihat penggunaan disk di Linux?",
                    ("top", false),
                    ("df -h", true),
                    ("ps aux", false),
                    ("netstat", false)),

                Mcq(QId(4,1,2), C4M1,
                    "Apa fungsi perintah 'chmod 755 script.sh' di Linux?",
                    ("Menghapus file script.sh", false),
                    ("Memberi izin: owner bisa rwx, group dan others bisa r-x", true),
                    ("Memindahkan file ke /usr/bin", false),
                    ("Membuat file hidden", false)),

                Mcq(QId(4,1,3), C4M1,
                    "Perintah mana yang digunakan untuk memonitor proses secara real-time di Linux?",
                    ("ls -la", false),
                    ("grep", false),
                    ("top atau htop", true),
                    ("cat /proc/cpuinfo", false)),

                Mcq(QId(4,1,4), C4M1,
                    "Di Linux, service/daemon dikelola menggunakan sistem init modern. Perintah apa yang digunakan?",
                    ("service start nginx (SysV init saja)", false),
                    ("systemctl start nginx (systemd)", true),
                    ("run nginx", false),
                    ("init nginx", false)),

                Mcq(QId(4,1,5), C4M1,
                    "File konfigurasi network interface di Ubuntu/Debian modern menggunakan:",
                    ("/etc/network/interfaces saja", false),
                    ("Netplan YAML di /etc/netplan/", true),
                    ("C:\\Windows\\System32\\drivers\\etc\\hosts", false),
                    ("/etc/resolv.conf untuk semua konfigurasi", false)),
            }),

            Mod(C4M2, C4, 2, "multi_select", "Linux Security & Monitoring", new List<Question>
            {
                MultiSelect(QId(4,2,1), C4M2,
                    "Alat monitoring mana yang umum digunakan untuk Linux server?",
                    ("Nagios / Zabbix", true),
                    ("Prometheus + Grafana", true),
                    ("Microsoft Excel", false),
                    ("htop / nload / iotop", true)),

                MultiSelect(QId(4,2,2), C4M2,
                    "Langkah hardening keamanan Linux server yang direkomendasikan:",
                    ("Nonaktifkan root SSH login, gunakan key-based auth", true),
                    ("Pasang fail2ban untuk block brute force", true),
                    ("Gunakan password 123456 agar mudah diingat", false),
                    ("Update/patch OS secara rutin", true)),

                MultiSelect(QId(4,2,3), C4M2,
                    "Perintah Linux mana yang berguna untuk network troubleshooting?",
                    ("ping dan traceroute", true),
                    ("ss -tulpn (lihat port yang mendengarkan)", true),
                    ("rm -rf / (hapus semua file)", false),
                    ("tcpdump (capture network packets)", true)),

                MultiSelect(QId(4,2,4), C4M2,
                    "Fitur LVM (Logical Volume Manager) memungkinkan:",
                    ("Resize partisi tanpa unmount (online resize)", true),
                    ("Snapshot volume untuk backup", true),
                    ("Boot tanpa kernel", false),
                    ("Striping dan mirroring disk", true)),
            }),

            Mod(C4M3, C4, 3, "drag_drop", "Linux Command ke Fungsinya", new List<Question>
            {
                // Zones: 0=File Ops, 1=Network, 2=Process, 3=Security
                DragDrop(QId(4,3,1), C4M3,
                    "Drag perintah Linux ke kategori fungsinya (File/Network/Process/Security):",
                    ("cp, mv, rsync", 0), ("ip addr, netstat", 1), ("kill, nice, top", 2), ("sudo, chmod, chown", 3)),

                DragDrop(QId(4,3,2), C4M3,
                    "Tempatkan file konfigurasi ke tujuan yang benar:",
                    ("/etc/fstab", 0), ("/etc/netplan/*.yaml", 1), ("/etc/systemd/system/", 2), ("/etc/sudoers", 3)),

                DragDrop(QId(4,3,3), C4M3,
                    "Pasangkan log file Linux ke sumber log-nya:",
                    ("/var/log/syslog", 0), ("/var/log/auth.log", 1), ("/var/log/kern.log", 2), ("/var/log/apt/", 3)),
            }),
        }
    };

    // ── COURSE 5: Power & Cooling Engineering ───────────────────────────────
    private static Course Course5_PowerCooling() => new()
    {
        Id                 = C5,
        Title              = "Power & Cooling Engineering",
        Category           = "Infrastructure",
        RequiredSkillsJson = Js(new[] { "Power Systems", "Cooling Systems", "Data Center Operations" }),
        Modules            = new List<CourseModule>
        {
            Mod(C5M1, C5, 1, "mcq", "Sistem Daya Data Center", new List<Question>
            {
                Mcq(QId(5,1,1), C5M1,
                    "Apa itu N+1 redundancy dalam sistem UPS data center?",
                    ("Tidak ada redundansi, hanya satu UPS", false),
                    ("Satu komponen ekstra siap menggantikan jika ada kegagalan", true),
                    ("Semua komponen digandakan 10 kali", false),
                    ("Hanya berlaku untuk sistem jaringan", false)),

                Mcq(QId(5,1,2), C5M1,
                    "Berapa lama umumnya genset diesel harus mampu menyuplai daya saat PLN padam di Tier III DC?",
                    ("5 menit", false),
                    ("1 jam", false),
                    ("72 jam (3 hari) atau lebih dengan fuel top-up", true),
                    ("Tidak ada ketentuan — tergantung budget", false)),

                Mcq(QId(5,1,3), C5M1,
                    "Apa fungsi ATS (Automatic Transfer Switch)?",
                    ("Mengatur kecepatan kipas pendingin", false),
                    ("Otomatis pindahkan beban dari PLN ke genset saat listrik padam", true),
                    ("Mengkonversi AC ke DC untuk server", false),
                    ("Mengatur distribusi beban antar rak server", false)),

                Mcq(QId(5,1,4), C5M1,
                    "Perbedaan antara 2N dan N+1 power redundancy adalah:",
                    ("Sama saja, hanya penamaan berbeda", false),
                    ("2N = dua sistem lengkap paralel; N+1 = satu komponen cadangan", true),
                    ("2N lebih murah dari N+1", false),
                    ("N+1 hanya digunakan di cloud, 2N untuk on-premise", false)),

                Mcq(QId(5,1,5), C5M1,
                    "Standar PLN Batam untuk data center menggunakan tegangan distribusi:",
                    ("110V (standar Amerika)", false),
                    ("380V/220V tiga fase (standar Indonesia)", true),
                    ("48V DC (telekomunikasi saja)", false),
                    ("1000V industri berat", false)),
            }),

            Mod(C5M2, C5, 2, "multi_select", "Sistem Pendingin & Efisiensi", new List<Question>
            {
                MultiSelect(QId(5,2,1), C5M2,
                    "Faktor apa yang mempengaruhi PUE data center?",
                    ("Efisiensi sistem cooling (CRAH, chiller)", true),
                    ("Desain hot/cold aisle containment", true),
                    ("Warna cat dinding server room", false),
                    ("Efisiensi UPS dan PDU (power chain loss)", true)),

                MultiSelect(QId(5,2,2), C5M2,
                    "Teknologi cooling mana yang cocok untuk iklim tropis seperti Batam?",
                    ("Precision air conditioning (CRAH/CRAC)", true),
                    ("District cooling dari chilled water plant", true),
                    ("Free cooling murni dari udara luar (tanpa mekanik)", false),
                    ("Indirect evaporative cooling dengan pre-cooling", true)),

                MultiSelect(QId(5,2,3), C5M2,
                    "Pilih KPI (Key Performance Indicator) yang relevan untuk efisiensi data center:",
                    ("PUE (Power Usage Effectiveness)", true),
                    ("WUE (Water Usage Effectiveness)", true),
                    ("CUE (Carbon Usage Effectiveness)", true),
                    ("LUE (Lunch Usage Effectiveness)", false)),

                MultiSelect(QId(5,2,4), C5M2,
                    "Komponen sistem chilled water mana yang umum di data center skala besar?",
                    ("Chiller (water-cooled atau air-cooled)", true),
                    ("Cooling Tower", true),
                    ("CRAH (Computer Room Air Handler)", true),
                    ("Printer laser", false)),
            }),

            Mod(C5M3, C5, 3, "drag_drop", "Power Flow di Data Center", new List<Question>
            {
                // Zones: 0=Utility, 1=Generation, 2=Conditioning, 3=Distribution
                DragDrop(QId(5,3,1), C5M3,
                    "Drag komponen ke tahapan aliran daya data center (Utility/Generation/Conditioning/Distribution):",
                    ("PLN / Utility Grid", 0), ("Diesel Generator", 1), ("UPS System", 2), ("PDU Rack", 3)),

                DragDrop(QId(5,3,2), C5M3,
                    "Tempatkan komponen cooling ke tahapannya (Chilling/Transport/Distribution/Monitoring):",
                    ("Chiller Unit", 0), ("Cooling Tower Pump", 1), ("CRAH Unit", 2), ("DCIM Software", 3)),

                DragDrop(QId(5,3,3), C5M3,
                    "Pasangkan redundansi ke tipe arsitektur daya yang tepat:",
                    ("N (no redundancy)", 0), ("N+1 (one spare)", 1), ("2N (fully redundant)", 2), ("2N+1 (concurrent maintainable)", 3)),
            }),
        }
    };

    // ── COURSE 6: Network Infrastructure ────────────────────────────────────
    private static Course Course6_NetworkInfrastructure() => new()
    {
        Id                 = C6,
        Title              = "Network Infrastructure for Data Centers",
        Category           = "Networking",
        RequiredSkillsJson = Js(new[] { "Networking", "Cybersecurity", "Linux Administration" }),
        Modules            = new List<CourseModule>
        {
            Mod(C6M1, C6, 1, "mcq", "Jaringan Data Center Modern", new List<Question>
            {
                Mcq(QId(6,1,1), C6M1,
                    "Apa itu topologi spine-leaf yang umum digunakan di modern data center?",
                    ("Jaringan bintang biasa dengan satu switch pusat", false),
                    ("Arsitektur 2-tier: spine sebagai aggregation, leaf sebagai access layer", true),
                    ("Topologi cincin untuk redundansi", false),
                    ("Hanya digunakan di jaringan WAN", false)),

                Mcq(QId(6,1,2), C6M1,
                    "Protokol BGP dalam data center digunakan untuk:",
                    ("Hanya routing antar ISP di internet", false),
                    ("Routing dinamis termasuk dalam DC fabric (eBGP/iBGP)", true),
                    ("Enkripsi traffic jaringan", false),
                    ("Manajemen IP address secara otomatis", false)),

                Mcq(QId(6,1,3), C6M1,
                    "Apa fungsi VXLAN dalam jaringan data center modern?",
                    ("Memperlambat jaringan untuk keamanan", false),
                    ("Overlay network untuk mengextend L2 segment di atas L3 infrastructure", true),
                    ("Protokol backup data antar DC", false),
                    ("Menggantikan TCP/IP sepenuhnya", false)),

                Mcq(QId(6,1,4), C6M1,
                    "Berapa kapasitas bandwidth minimum yang direkomendasikan untuk server-to-server traffic di modern DC?",
                    ("100 Mbps per server", false),
                    ("1 Gbps per server (dengan tren ke 10/25/100 GbE)", true),
                    ("56 Kbps — sudah cukup untuk server", false),
                    ("Tidak ada standar yang diperlukan", false)),

                Mcq(QId(6,1,5), C6M1,
                    "Apa itu LACP (Link Aggregation Control Protocol)?",
                    ("Protokol untuk mengenkripsi traffic WiFi", false),
                    ("Menggabungkan beberapa link fisik menjadi satu logical link untuk bandwidth/redundansi", true),
                    ("Sistem monitoring jaringan berbasis AI", false),
                    ("Protokol routing khusus untuk IPv6", false)),
            }),

            Mod(C6M2, C6, 2, "multi_select", "Protokol & Keamanan Jaringan", new List<Question>
            {
                MultiSelect(QId(6,2,1), C6M2,
                    "Protokol mana yang digunakan untuk manajemen perangkat jaringan?",
                    ("SNMP (Simple Network Management Protocol)", true),
                    ("NetFlow / sFlow (traffic analysis)", true),
                    ("HTTP (browsing saja)", false),
                    ("RESTCONF / NETCONF (network automation)", true)),

                MultiSelect(QId(6,2,2), C6M2,
                    "Teknik keamanan jaringan mana yang relevan untuk data center?",
                    ("Network segmentation dengan VLAN", true),
                    ("Micro-segmentation dengan SDN", true),
                    ("Menonaktifkan semua firewall untuk performa", false),
                    ("Port security dan 802.1X authentication", true)),

                MultiSelect(QId(6,2,3), C6M2,
                    "Tools apa yang digunakan untuk network automation di data center modern?",
                    ("Ansible (agentless automation)", true),
                    ("Terraform (infrastructure as code)", true),
                    ("Microsoft Paint", false),
                    ("Python dengan Netmiko/NAPALM", true)),

                MultiSelect(QId(6,2,4), C6M2,
                    "Fitur apa yang ada pada enterprise switch di data center?",
                    ("Spanning Tree Protocol (STP/RSTP)", true),
                    ("Quality of Service (QoS)", true),
                    ("Built-in coffee maker", false),
                    ("OSPF/BGP routing support", true)),
            }),

            Mod(C6M3, C6, 3, "drag_drop", "OSI Layer ke Perangkat/Protokol", new List<Question>
            {
                // Zones: 0=L2 (Data Link), 1=L3 (Network), 2=L4 (Transport), 3=L7 (Application)
                DragDrop(QId(6,3,1), C6M3,
                    "Drag perangkat/protokol ke OSI layer yang tepat (L2/L3/L4/L7):",
                    ("Ethernet Switch", 0), ("Router / IP", 1), ("TCP/UDP", 2), ("HTTP/HTTPS", 3)),

                DragDrop(QId(6,3,2), C6M3,
                    "Tempatkan komponen jaringan DC ke tier arsitekturnya:",
                    ("Core Switch (Spine)", 0), ("Distribution Switch", 1), ("Access Switch (Leaf)", 2), ("End Server NIC", 3)),

                DragDrop(QId(6,3,3), C6M3,
                    "Pasangkan protokol ke fungsi yang tepat dalam jaringan DC:",
                    ("VLAN / 802.1Q", 0), ("OSPF / BGP", 1), ("LACP / 802.3ad", 2), ("DNS / NTP", 3)),
            }),
        }
    };

    // ════════════════════════════════════════════════════════════════════════
    // JOBS — 15 realistic positions (Batam & Singapore data center ecosystem)
    // ════════════════════════════════════════════════════════════════════════
    private static List<Job> BuildJobs() => new()
    {
        // ── BATAM (8 jobs) ─────────────────────────────────────────────────
        new Job { Id=J01, Title="Data Center Technician",
            Company="PT Citadel Data Center Batam", Location="Batam", MinGrade="Unranked",
            Description="Bertanggung jawab operasional harian data center: pemeliharaan server, monitoring infrastruktur fisik, penggantian komponen hardware. Cocok untuk fresh graduate IT/Teknik Elektro.",
            RequiredSkillsJson=Js(new[]{"Data Center Operations","Networking","Power Systems"}) },

        new Job { Id=J02, Title="NOC Engineer (Network Operations Center)",
            Company="PT Biznet Networks Batam", Location="Batam", MinGrade="Unranked",
            Description="Monitor jaringan 24/7 dari NOC, eskalasi insiden, dokumentasi tiket, dan koordinasi dengan tim lapangan. Shift work, 3 shift rotasi.",
            RequiredSkillsJson=Js(new[]{"Networking","Linux Administration","Data Center Operations"}) },

        new Job { Id=J03, Title="Network Engineer",
            Company="PT Equinix Indonesia (Batam)", Location="Batam", MinGrade="Bronze",
            Description="Merancang, mengimplementasi, dan memelihara infrastruktur jaringan data center. Pengalaman dengan routing protocol (BGP, OSPF) dan network security diperlukan.",
            RequiredSkillsJson=Js(new[]{"Networking","Cybersecurity","Linux Administration"}) },

        new Job { Id=J04, Title="Systems Administrator",
            Company="PT Telin Batam", Location="Batam", MinGrade="Bronze",
            Description="Mengelola server Linux/Windows, virtualisasi VMware/KVM, backup & recovery, dan patch management untuk infrastruktur telekomunikasi di Batam.",
            RequiredSkillsJson=Js(new[]{"Linux Administration","Virtualization","Networking"}) },

        new Job { Id=J05, Title="Power & Mechanical Engineer",
            Company="PT Nongsa Digital Park", Location="Batam", MinGrade="Bronze",
            Description="Bertanggung jawab sistem kelistrikan (UPS, genset, ATS) dan mekanikal (HVAC, cooling tower, chiller) data center di kawasan Nongsa Digital Park Batam.",
            RequiredSkillsJson=Js(new[]{"Power Systems","Cooling Systems","Data Center Operations"}) },

        new Job { Id=J06, Title="Infrastructure Lead",
            Company="PT NTT Indonesia (Batam)", Location="Batam", MinGrade="Silver",
            Description="Memimpin tim infrastruktur 8-10 orang, mengelola proyek peningkatan kapasitas DC, koordinasi dengan vendor internasional. Minimal 3 tahun pengalaman di industri data center.",
            RequiredSkillsJson=Js(new[]{"Data Center Operations","Power Systems","Cooling Systems","Networking"}) },

        new Job { Id=J07, Title="Cloud Infrastructure Engineer",
            Company="PT DCI Indonesia (Batam)", Location="Batam", MinGrade="Silver",
            Description="Mengelola infrastruktur cloud hybrid (AWS/Azure + on-premise), container orchestration dengan Kubernetes, dan automation dengan Ansible/Terraform.",
            RequiredSkillsJson=Js(new[]{"Cloud Computing","Virtualization","Linux Administration","Networking"}) },

        new Job { Id=J08, Title="Cybersecurity Analyst",
            Company="PT Telkom Sigma Batam", Location="Batam", MinGrade="Silver",
            Description="Monitoring SIEM, analisis insiden keamanan, vulnerability assessment, dan implementasi kebijakan keamanan untuk infrastruktur data center kritial.",
            RequiredSkillsJson=Js(new[]{"Cybersecurity","Networking","Linux Administration"}) },

        // ── SINGAPORE (7 jobs) ─────────────────────────────────────────────
        new Job { Id=J09, Title="Data Center Operations Specialist",
            Company="ST Telemedia Global DC (Singapore)", Location="Singapore", MinGrade="Bronze",
            Description="Beroperasi di data center carrier-neutral kelas dunia di Singapore. Mengelola colocation client, hands-and-eyes support, dan pemeliharaan infrastruktur Tier III+.",
            RequiredSkillsJson=Js(new[]{"Data Center Operations","Networking","Power Systems"}) },

        new Job { Id=J10, Title="Network Operations Engineer",
            Company="Equinix Singapore", Location="Singapore", MinGrade="Silver",
            Description="Mengelola jaringan backbone dan interconnection di IBX data center Singapore, termasuk BGP peering, MPLS, dan cross-connect management untuk ratusan klien enterprise global.",
            RequiredSkillsJson=Js(new[]{"Networking","Cybersecurity","Linux Administration"}) },

        new Job { Id=J11, Title="Data Center Facility Engineer",
            Company="Keppel Data Centres Singapore", Location="Singapore", MinGrade="Silver",
            Description="Mengelola fasilitas fisik DC Keppel di Singapore: sistem mekanikal (chiller, cooling tower, CRAC), kelistrikan (switchgear, UPS, genset), dan compliance dengan Green Mark/ISO 50001.",
            RequiredSkillsJson=Js(new[]{"Power Systems","Cooling Systems","Data Center Operations"}) },

        new Job { Id=J12, Title="Cloud Solutions Architect",
            Company="CapitaLand Digital Singapore", Location="Singapore", MinGrade="Silver",
            Description="Merancang solusi cloud hybrid untuk klien properti dan retail di Asia Pasifik. Mengintegrasikan AWS/Azure dengan on-premise data center, microservices architecture.",
            RequiredSkillsJson=Js(new[]{"Cloud Computing","Virtualization","Networking","Cybersecurity"}) },

        new Job { Id=J13, Title="Senior Infrastructure Engineer",
            Company="GDS International Singapore", Location="Singapore", MinGrade="Gold",
            Description="Lead engineer untuk ekspansi data center GDS di Singapore. Merancang power dan cooling untuk DC 50MW+, sertifikasi Tier IV, dan go-to-market untuk hyperscale clients.",
            RequiredSkillsJson=Js(new[]{"Data Center Operations","Power Systems","Cooling Systems","Networking","Virtualization"}) },

        new Job { Id=J14, Title="Senior Cloud Architect",
            Company="Keppel DC REIT Singapore", Location="Singapore", MinGrade="Gold",
            Description="Merancang arsitektur cloud enterprise untuk REIT data center terbesar di Asia. Expertise cloud-native architecture, multi-cloud strategy, FinOps, dan AI/ML infrastructure.",
            RequiredSkillsJson=Js(new[]{"Cloud Computing","Virtualization","Cybersecurity","Networking","AI/ML"}) },

        new Job { Id=J15, Title="Head of Cybersecurity Operations",
            Company="Singtel Data Centre Singapore", Location="Singapore", MinGrade="Gold",
            Description="Memimpin tim SOC (Security Operations Center) 20+ analis untuk portofolio data center Singtel. Tanggung jawab mencakup threat intelligence, incident response, dan compliance PCI-DSS/SOC2.",
            RequiredSkillsJson=Js(new[]{"Cybersecurity","Networking","Linux Administration","Cloud Computing"}) },
    };

    // ════════════════════════════════════════════════════════════════════════
    // BUILDER HELPERS — keep question/option creation DRY
    // ════════════════════════════════════════════════════════════════════════

    private static string Js(string[] arr) => JsonSerializer.Serialize(arr);

    private static CourseModule Mod(Guid id, Guid courseId, int order, string type, string title, List<Question> questions) =>
        new() { Id=id, CourseId=courseId, OrderIndex=order, ModuleType=type, Title=title, Questions=questions };

    private static Question Mcq(Guid id, Guid moduleId, string text,
        (string text, bool correct) o1, (string text, bool correct) o2,
        (string text, bool correct) o3, (string text, bool correct) o4) =>
        new()
        {
            Id=id, ModuleId=moduleId, QuestionText=text, QuestionType="mcq",
            Options=new List<QuestionOption>
            {
                new() { Id=Guid.NewGuid(), OptionText=o1.text, IsCorrect=o1.correct, Position=0 },
                new() { Id=Guid.NewGuid(), OptionText=o2.text, IsCorrect=o2.correct, Position=1 },
                new() { Id=Guid.NewGuid(), OptionText=o3.text, IsCorrect=o3.correct, Position=2 },
                new() { Id=Guid.NewGuid(), OptionText=o4.text, IsCorrect=o4.correct, Position=3 },
            }
        };

    private static Question MultiSelect(Guid id, Guid moduleId, string text,
        (string text, bool correct) o1, (string text, bool correct) o2,
        (string text, bool correct) o3, (string text, bool correct) o4) =>
        new()
        {
            Id=id, ModuleId=moduleId, QuestionText=text, QuestionType="multi_select",
            Options=new List<QuestionOption>
            {
                new() { Id=Guid.NewGuid(), OptionText=o1.text, IsCorrect=o1.correct, Position=0 },
                new() { Id=Guid.NewGuid(), OptionText=o2.text, IsCorrect=o2.correct, Position=1 },
                new() { Id=Guid.NewGuid(), OptionText=o3.text, IsCorrect=o3.correct, Position=2 },
                new() { Id=Guid.NewGuid(), OptionText=o4.text, IsCorrect=o4.correct, Position=3 },
            }
        };

    private static Question DragDrop(Guid id, Guid moduleId, string text,
        (string label, int zone) o1, (string label, int zone) o2,
        (string label, int zone) o3, (string label, int zone) o4) =>
        new()
        {
            Id=id, ModuleId=moduleId, QuestionText=text, QuestionType="drag_drop",
            Options=new List<QuestionOption>
            {
                new() { Id=Guid.NewGuid(), OptionText=o1.label, IsCorrect=true, Position=o1.zone },
                new() { Id=Guid.NewGuid(), OptionText=o2.label, IsCorrect=true, Position=o2.zone },
                new() { Id=Guid.NewGuid(), OptionText=o3.label, IsCorrect=true, Position=o3.zone },
                new() { Id=Guid.NewGuid(), OptionText=o4.label, IsCorrect=true, Position=o4.zone },
            }
        };

    private static Question TrueFalse(Guid id, Guid moduleId, string text, bool isTrue) =>
        new()
        {
            Id=id, ModuleId=moduleId, QuestionText=text, QuestionType="true_false",
            Options=new List<QuestionOption>
            {
                new() { Id=Guid.NewGuid(), OptionText="Benar", IsCorrect=isTrue, Position=0 },
                new() { Id=Guid.NewGuid(), OptionText="Salah", IsCorrect=!isTrue, Position=1 },
            }
        };
}
