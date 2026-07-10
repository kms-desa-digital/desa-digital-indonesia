import json
import os
import sys
import re
import shutil
import opendataloader_pdf

# Folder default untuk semua dokumen (public/documents/)
DOCS_DIR = os.path.join(os.getcwd(), "public", "documents")
TEMP_DIR = os.path.join(os.getcwd(), "public", "temp_docs")


def normalize_text(text: str) -> str:
    """Membersihkan teks dari spasi berlebih dan karakter tidak perlu"""
    text = text.strip()  # hapus spasi di awal & akhir
    text = re.sub(r'\s+', ' ', text)  # ganti multiple whitespace jadi satu spasi
    return text


def extract_text_from_element(element):
    """Fungsi rekursif untuk mengekstrak teks dari elemen, termasuk tabel"""
    text = ""
    if "content" in element and element["content"]:
        text += element["content"].strip() + " "
    elif "kids" in element:
        for child in element["kids"]:
            text += extract_text_from_element(child)
    elif "rows" in element:
        # Format tabel menjadi teks baris demi baris
        for row in element["rows"]:
            row_text = []
            for cell in row.get("cells", []):
                row_text.append(extract_text_from_element(cell).strip())
            text += " | ".join(row_text) + "\n"
    return text


def chunk_with_min_size(doc, min_chars=500, max_chars=1500):
    """Chunking dokumen berdasarkan semantic element dengan minimum size (menghindari chunk terlalu kecil)"""
    chunks = []
    buffer_text = ""
    buffer_pages = []
    
    if "kids" not in doc:
        return chunks

    for element in doc["kids"]:
        if element.get("type") == "image":
            continue
            
        elem_text = extract_text_from_element(element).strip()
        if not elem_text:
            continue
            
        page = element.get("page number")
        is_heading = element.get("type") == "heading"
        
        # Semantic chunking: potong chunk sebelum heading baru JIKA buffer sudah cukup besar
        if is_heading and len(buffer_text) >= min_chars:
            chunks.append({
                "page": buffer_pages[0] if buffer_pages else 1,
                "content": normalize_text(buffer_text)
            })
            buffer_text = ""
            buffer_pages = []
            
        buffer_text += elem_text + "\n"
        if page and page not in buffer_pages:
            buffer_pages.append(page)
            
        # Potong chunk jika sudah melebihi batas maksimum (mencegah payload LLM terlalu besar)
        if len(buffer_text) >= max_chars:
            chunks.append({
                "page": buffer_pages[0] if buffer_pages else 1,
                "content": normalize_text(buffer_text)
            })
            buffer_text = ""
            buffer_pages = []

    # Sisa buffer yang belum masuk chunk
    if buffer_text.strip():
        chunks.append({
            "page": buffer_pages[0] if buffer_pages else 1,
            "content": normalize_text(buffer_text)
        })
        
    return chunks


def pdf_to_json(filename: str):
    # Menentukan path PDF (absolute atau relatif ke DOCS_DIR)
    pdf_path = os.path.join(DOCS_DIR, filename) if not os.path.isabs(filename) else filename
    
    # Validasi file ada atau tidak
    if not os.path.exists(pdf_path):
        print(f"[ERROR] File tidak ditemukan: {pdf_path}")
        return

    # Buat temp dir untuk output opendataloader-pdf
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)

    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    output_path = os.path.join(DOCS_DIR, f"{base_name}.json")
    temp_json_path = os.path.join(TEMP_DIR, f"{base_name}.json")

    print(f"Membaca & mengekstrak struktur PDF: {pdf_path}")

    # Ekstrak PDF menggunakan opendataloader-pdf
    opendataloader_pdf.convert(
        input_path=[pdf_path],
        output_dir=TEMP_DIR,
        format="json",
        use_struct_tree=True, # Menggunakan tags PDF jika ada (Semantic Chunking)
        quiet=True
    )

    if not os.path.exists(temp_json_path):
        print(f"[ERROR] Ekstraksi gagal, file {temp_json_path} tidak ditemukan.")
        return

    print("Memproses hasil ekstraksi dan melakukan chunking...")
    
    with open(temp_json_path, "r", encoding="utf-8") as f:
        doc_json = json.load(f)

    # Lakukan chunking cerdas berbasis ukuran minimum 500 karakter
    chunks = chunk_with_min_size(doc_json, min_chars=500)
    
    nodes = []
    for chunk in chunks:
        # Skip jika terlalu pendek
        if not chunk["content"] or len(chunk["content"]) < 10:
            continue
            
        nodes.append({
            "page": chunk["page"],
            "content": chunk["content"]
        })

    # Struktur JSON final
    result = {
        "source": os.path.basename(pdf_path),
        "type": "document",
        "total_chunks": len(nodes),  
        "nodes": nodes
    }

    # Simpan ke file JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        
    # Bersihkan temporary files
    try:
        shutil.rmtree(TEMP_DIR)
        print(f"Membersihkan folder temporary: {TEMP_DIR}")
    except Exception as e:
        print(f"[WARN] Gagal membersihkan folder temporary: {e}")

    print(f"\nSelesai! {len(nodes)} chunks (node) disimpan ke: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python src/scripts/pdf_to_json.py <nama_file.pdf>")
        print("File harus berada di public/documents/")
        sys.exit(1)

    pdf_to_json(sys.argv[1])