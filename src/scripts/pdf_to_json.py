import json
import os
import sys
import re
import pdfplumber

# Folder default untuk semua dokumen (public/documents/)
DOCS_DIR = os.path.join(os.getcwd(), "public", "documents")


def normalize_text(text: str) -> str:
    """Membersihkan teks dari spasi berlebih dan karakter tidak perlu"""
    text = text.strip()  # hapus spasi di awal & akhir
    text = re.sub(r'\s+', ' ', text)  # ganti multiple whitespace jadi satu spasi
    return text


def pdf_to_json(filename: str):
    # Menentukan path PDF (absolute atau relatif ke DOCS_DIR)
    pdf_path = os.path.join(DOCS_DIR, filename) if not os.path.isabs(filename) else filename
    
    # Validasi file ada atau tidak
    if not os.path.exists(pdf_path):
        print(f"[ERROR] File tidak ditemukan: {pdf_path}")
        return

    # Menentukan nama file output JSON
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    output_path = os.path.join(DOCS_DIR, f"{base_name}.json")

    nodes = []  # list untuk menyimpan konten per halaman
    source_name = os.path.basename(pdf_path)

    print(f"Membaca: {pdf_path}")

    # Membuka PDF menggunakan pdfplumber
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total halaman: {total_pages}")

        # Iterasi setiap halaman
        for i, page in enumerate(pdf.pages):
            page_number = i + 1

            # Ekstrak teks mentah dari halaman
            raw_text = page.extract_text() or ""

            # Normalisasi teks
            text = normalize_text(raw_text)

            # Skip halaman kosong atau terlalu pendek
            if not text or len(text) < 10:
                print(f"  Halaman {page_number}: skip (kosong/terlalu pendek)")
                continue

            # Simpan hasil ke dalam nodes
            nodes.append({
                "page": page_number,
                "content": text
            })

            print(f"  Halaman {page_number}: {len(text)} chars")

    # Struktur JSON final
    result = {
        "source": source_name,
        "type": "document",
        "total_pages": len(nodes),  # jumlah halaman yang berhasil diambil
        "nodes": nodes
    }

    # Simpan ke file JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nSelesai! {len(nodes)} halaman disimpan ke: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python src/scripts/pdf_to_json.py <nama_file.pdf>")
        print("File harus berada di public/documents/")
        sys.exit(1)

    pdf_to_json(sys.argv[1])