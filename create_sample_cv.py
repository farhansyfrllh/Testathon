"""
Generate a simple sample_cv.pdf for the Talent Bridge demo.
Run: python create_sample_cv.py
Requires: PyMuPDF (pip install pymupdf)
"""
import sys

def create_pdf():
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("PyMuPDF not found. Creating plain text fallback...")
        create_text_cv()
        return

    doc = fitz.open()
    page = doc.new_page()

    cv_text = """
BUDI SANTOSO
Email: budi.santoso@email.com | LinkedIn: linkedin.com/in/budi-santoso
Batam, Kepulauan Riau, Indonesia

PROFESSIONAL SUMMARY
Experienced IT professional with 4 years in data center operations and networking.
Strong background in Data Center Operations, Power Systems, and Networking.
Certified in Linux Administration and Cybersecurity fundamentals.

TECHNICAL SKILLS
- Data Center Operations: 4 years experience managing Tier II data centers
- Networking: TCP/IP, VLAN, BGP, OSPF, Cisco IOS, network monitoring
- Power Systems: UPS maintenance, PDU management, generator operation
- Cooling Systems: CRAC/CRAH units, hot/cold aisle containment, DCIM
- Linux Administration: Ubuntu, CentOS, RHEL, shell scripting, automation
- Cybersecurity: Firewall configuration, IDS/IPS, vulnerability scanning
- Virtualization: VMware vSphere, Hyper-V
- Cloud Computing: AWS fundamentals, Azure basics
- Python: scripting, automation, monitoring tools
- DCIM tools: Schneider EcoStruxure, Nlyte

WORK EXPERIENCE
Data Center Engineer | PT Equinix Batam | 2021 - Present
- Managed 200+ rack servers in a Tier III data center facility
- Implemented hot/cold aisle containment reducing PUE from 1.8 to 1.5
- Led network infrastructure upgrade supporting 10Gbps backbone
- Maintained 99.99% uptime for critical customer environments

IT Infrastructure Technician | PT NTT Batam | 2020 - 2021
- Performed preventive maintenance on UPS and cooling systems
- Configured and monitored network switches and routers
- Responded to 24/7 on-call incidents for critical infrastructure

EDUCATION
Bachelor of Computer Science | Universitas Putera Batam | 2016 - 2020
GPA: 3.4/4.0

CERTIFICATIONS
- CompTIA Network+ (2021)
- Cisco CCNA (2022)
- VMware VCP-DCV (2023)
- Linux Professional Institute LPIC-1 (2022)

LANGUAGES
Indonesian (Native), English (Professional Working Proficiency)
"""

    page.insert_text((50, 50), cv_text, fontsize=10, fontname="helv")
    doc.save("sample_cv.pdf")
    doc.close()
    print("Created sample_cv.pdf successfully!")


def create_text_cv():
    """Fallback: create a text file if PyMuPDF not available."""
    cv_text = """BUDI SANTOSO
Data Center Engineer

SKILLS: Data Center Operations, Power Systems, Cooling Systems, Networking,
Linux Administration, Cybersecurity, Virtualization, Cloud Computing, Python, DCIM

EXPERIENCE:
- 4 years in Data Center Operations at Equinix Batam
- Network Switch configuration and management
- UPS and Power Systems maintenance
- CRAC Cooling Systems operation
- Server Rack installation and management
- Cybersecurity monitoring with IDS/IPS tools
- Linux Administration for server management
- VMware Virtualization platform management
"""
    with open("sample_cv.txt", "w") as f:
        f.write(cv_text)
    print("Created sample_cv.txt (PDF generation requires PyMuPDF)")


if __name__ == "__main__":
    create_pdf()
