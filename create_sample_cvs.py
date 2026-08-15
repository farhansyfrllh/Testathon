"""
Generate 3 sample CV PDFs for Talent Bridge demo.
Profiles:
  1. sample_cv_bronze.pdf  — Entry-level DC technician (~45% match → Bronze)
  2. sample_cv_silver.pdf  — Mid-level network/sysadmin (~70% match → Silver)
  3. sample_cv_gold.pdf    — Senior cloud/DC architect (~85% match → Gold)

Uses PyMuPDF (fitz) which is already in requirements.txt.
Run: python create_sample_cvs.py
"""

import fitz  # PyMuPDF


def add_page(doc: fitz.Document, lines: list[str]) -> None:
    """Add a page with left-aligned text lines."""
    page = doc.new_page(width=595, height=842)  # A4
    y = 60
    for line in lines:
        size = 14 if line.startswith("###") else (11 if line.startswith("##") else 10)
        bold = line.startswith("#")
        text = line.lstrip("#").strip()
        if not text:
            y += 6
            continue
        page.insert_text(
            (50, y),
            text,
            fontname="helv" if not bold else "hebo",
            fontsize=size,
            color=(0, 0, 0),
        )
        y += size + 5
        if y > 800:
            break


# ─────────────────────────────────────────────────────────────────────────────
# CV 1 — Entry Level (Bronze target: ~45% match)
# Skills: Data Center Operations, Networking, Power Systems
# ─────────────────────────────────────────────────────────────────────────────
cv1_lines = [
    "### RIZKY PRATAMA",
    "## rizky.pratama@email.com | +62 812-3456-7890 | Batam, Kepulauan Riau",
    "",
    "## OBJECTIVE",
    "Fresh graduate Teknik Elektro mencari posisi sebagai Data Center Technician.",
    "Memiliki dasar yang kuat dalam operasi data center dan sistem kelistrikan.",
    "",
    "## EDUCATION",
    "## S1 Teknik Elektro — Universitas Batam (2020–2024)",
    "IPK: 3.45 / 4.00",
    "Tugas Akhir: Analisis Sistem Kelistrikan dan Manajemen Daya Data Center Skala Kecil",
    "",
    "## SKILLS",
    "Data Center Operations: Familiar dengan komponen fisik DC, rak server, dan kabel.",
    "Power Systems: Pemahaman UPS, PDU, ATS, dan sistem distribusi daya 3 fasa.",
    "Networking: Dasar TCP/IP, subnetting, konfigurasi switch Cisco, VLAN.",
    "Hardware Maintenance: Pemasangan server, hot-swap disk, manajemen kabel.",
    "Operating System: Windows Server 2019, Ubuntu Linux (dasar).",
    "",
    "## CERTIFICATIONS",
    "Cisco Certified Entry Networking Technician (CCENT) — 2023",
    "CompTIA IT Fundamentals+ — 2023",
    "",
    "## INTERNSHIP",
    "## PT Telkom Indonesia — Batam (Jun–Aug 2023)",
    "Magang di divisi infrastruktur jaringan. Membantu pemeliharaan ruang server,",
    "monitoring sistem UPS, dan dokumentasi inventaris perangkat jaringan.",
    "",
    "## PROJECTS",
    "Instalasi dan konfigurasi homelab dengan 2 server Dell PowerEdge menggunakan",
    "Proxmox Virtualization. Monitoring daya dengan smart PDU.",
    "",
    "## LANGUAGES",
    "Bahasa Indonesia (Native), English (Professional Working Proficiency)",
]

# ─────────────────────────────────────────────────────────────────────────────
# CV 2 — Mid Level (Silver target: ~70% match)
# Skills: Networking, Linux Administration, Cybersecurity, Data Center Ops, Virtualization
# ─────────────────────────────────────────────────────────────────────────────
cv2_lines = [
    "### FARHAN ADITYA NUGROHO",
    "## farhan.aditya@email.com | +62 813-9876-5432 | Batam, Kepulauan Riau",
    "",
    "## PROFESSIONAL SUMMARY",
    "Network & Systems Engineer dengan 3 tahun pengalaman di industri data center Batam.",
    "Keahlian di Linux Administration, Networking, Cybersecurity, dan Virtualization.",
    "Berpengalaman dalam pengelolaan infrastruktur colocation dan cloud hybrid.",
    "",
    "## EDUCATION",
    "## S1 Teknik Informatika — Politeknik Negeri Batam (2017–2021)",
    "IPK: 3.62 / 4.00",
    "",
    "## PROFESSIONAL EXPERIENCE",
    "## Network Engineer — PT Biznet Networks Batam (2021–sekarang)",
    "- Mengelola infrastruktur jaringan backbone 10GbE untuk 200+ colocation clients.",
    "- Konfigurasi dan monitoring Cisco Nexus, Juniper EX series (BGP, OSPF, VLAN).",
    "- Linux Administration: mengelola 50+ server Ubuntu/CentOS (nginx, DNS, NTP).",
    "- Implementasi Virtualization dengan VMware ESXi 7 dan KVM/Proxmox.",
    "- Incident response: analisis log, troubleshooting jaringan down dalam SLA < 30 menit.",
    "",
    "## SKILLS",
    "Networking: BGP, OSPF, MPLS, VLAN, spanning-tree, network automation Ansible.",
    "Linux Administration: Ubuntu, CentOS, shell scripting, systemd, LVM, Nagios.",
    "Cybersecurity: firewall iptables, fail2ban, IDS Snort, vulnerability scanning.",
    "Virtualization: VMware vSphere, KVM, Docker, basic Kubernetes.",
    "Data Center Operations: cabling, rack management, hot aisle/cold aisle.",
    "Cloud Computing: AWS EC2/VPC dasar, Azure fundamentals.",
    "",
    "## CERTIFICATIONS",
    "CCNA (Cisco Certified Network Associate) — 2022",
    "CompTIA Security+ — 2023",
    "VMware VCP-DCV 2022",
    "",
    "## LANGUAGES",
    "Bahasa Indonesia (Native), English (Full Professional Proficiency)",
]

# ─────────────────────────────────────────────────────────────────────────────
# CV 3 — Senior Level (Gold target: ~87% match)
# Skills: All 16 skills heavily covered
# ─────────────────────────────────────────────────────────────────────────────
cv3_lines = [
    "### DIANA KUSUMA WARDANI",
    "## diana.kusuma@email.com | +65 9123-4567 | Singapore / Batam",
    "",
    "## EXECUTIVE SUMMARY",
    "Senior Cloud & Data Center Architect dengan 8 tahun pengalaman internasional.",
    "Expert dalam Cloud Computing (AWS/Azure/GCP), Virtualization, Cybersecurity,",
    "Data Center Operations, Power Systems, Cooling Systems, AI/ML infrastructure,",
    "Networking, Linux Administration, Docker, Kubernetes, dan DCIM.",
    "",
    "## EDUCATION",
    "## S2 Computer Science — Nanyang Technological University Singapore (2014–2016)",
    "## S1 Teknik Informatika — Institut Teknologi Bandung (2010–2014)",
    "",
    "## PROFESSIONAL EXPERIENCE",
    "## Senior Cloud Architect — Keppel DC Singapore (2020–sekarang)",
    "- Merancang arsitektur cloud hybrid multi-cloud (AWS, Azure, GCP) untuk 30+ klien enterprise.",
    "- Data Center Operations: oversight operasional 3 DC Tier III+ dengan total kapasitas 80MW.",
    "- Power Systems: desain sistem 2N redundant UPS dan genset untuk DC baru Keppel.",
    "- Cooling Systems: implementasi chilled water plant dan liquid cooling untuk HPC cluster.",
    "- AI/ML Infrastructure: deploy GPU cluster (NVIDIA DGX A100) untuk klien AI di Singapore.",
    "- Cybersecurity: Zero Trust Architecture, SOC2 Type II, ISO 27001 compliance.",
    "- Networking: merancang spine-leaf fabric 400GbE dengan BGP EVPN/VXLAN.",
    "- Linux Administration: automation infrastruktur dengan Ansible, Terraform, Python.",
    "- Virtualization: VMware vSphere 8, Nutanix HCI, OpenStack private cloud.",
    "",
    "## Infrastructure Lead — ST Telemedia Singapore (2016–2020)",
    "- Memimpin tim 15 engineer untuk ekspansi DC ST Telemedia di Singapore dan Batam.",
    "- Cloud Computing: migrasi workload on-premise ke AWS dan Azure (lift & shift + re-arch).",
    "- Implementasi DCIM (Data Center Infrastructure Management) Schneider EcoStruxure.",
    "",
    "## KEY SKILLS",
    "Cloud Computing: AWS (Solutions Architect Pro), Azure (Expert), GCP, multi-cloud.",
    "Virtualization: VMware vSphere, Nutanix, KVM, Kubernetes, Docker, OpenStack.",
    "Data Center Operations: Tier III/IV design, DCIM, capacity planning, TIA-942.",
    "Power Systems: 2N/N+1 UPS, ATS, genset, power chain optimization, PUE < 1.3.",
    "Cooling Systems: chilled water, liquid cooling, free cooling, CRAC/CRAH.",
    "Cybersecurity: Zero Trust, SIEM, SOC, ISO 27001, PCI-DSS, penetration testing.",
    "Networking: 400GbE DC fabric, BGP EVPN, VXLAN, SD-WAN, network automation.",
    "Linux Administration: RHEL, Ubuntu, Python automation, Ansible, Terraform.",
    "AI/ML: GPU cluster design, NVIDIA DGX, MLOps infrastructure, HPC storage.",
    "SQL Server: database administration, high availability, Always On AG.",
    "Docker: container platform, registry, security scanning.",
    "Kubernetes: K8s cluster management, Helm, service mesh Istio.",
    "",
    "## CERTIFICATIONS",
    "AWS Certified Solutions Architect Professional",
    "Azure Solutions Architect Expert",
    "VMware VCDX (Data Center Virtualization)",
    "CISSP (Certified Information Systems Security Professional)",
    "Uptime Institute AOS (Accredited Operations Specialist)",
    "",
    "## LANGUAGES",
    "Bahasa Indonesia (Native), English (Native/Bilingual), Mandarin (Conversational)",
]


def create_cv(filename: str, lines: list[str]) -> None:
    doc = fitz.open()
    add_page(doc, lines)
    doc.save(filename)
    doc.close()
    print(f"Created: {filename}")


if __name__ == "__main__":
    create_cv("sample_cv_bronze.pdf", cv1_lines)
    create_cv("sample_cv_silver.pdf", cv2_lines)
    create_cv("sample_cv_gold.pdf",   cv3_lines)
    print("\nDone! Upload each PDF to test different grade outcomes:")
    print("  sample_cv_bronze.pdf  → expected Bronze grade (~45% match)")
    print("  sample_cv_silver.pdf  → expected Silver grade (~70% match)")
    print("  sample_cv_gold.pdf    → expected Gold grade (~87% match)")
