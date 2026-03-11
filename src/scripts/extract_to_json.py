import json
import os
import pdfplumber
import ollama
from pydantic import BaseModel, Field

# 1. Definisikan Schema Pydantic
class InovatorSchema(BaseModel):
    nama: str = Field(description="Nama inovator, gabungkan jika lebih dari satu. Kosongkan jika tidak ada.")
    status_paten: str = Field(description="Status paten, kosongkan jika tidak ada.")

class InovasiSchema(BaseModel):
    judul: str
    deskripsi: str
    perspektif: str
    keunggulan_inovasi: str
    potensi_aplikasi: str
    inovator: InovatorSchema

def ask_ollama_to_extract(text):
    """
    Menggunakan Ollama lokal (llama3.2:3b) untuk mengekstrak data dari teks PDF.
    """
    prompt = f"""
    Ekstrak data inovasi dari teks dokumen di bawah ini.
    Ambil informasi yang relevan dan masukkan ke dalam struktur JSON yang diminta.
    Jika informasi untuk suatu bagian tidak ditemukan dalam teks, isi dengan string kosong "".

    TEKS DOKUMEN:
    {text}
    """
    
    try:
        # Memanggil Ollama dan memaksa output mengikuti skema Pydantic
        response = ollama.chat(
            model='llama3.2:3b',
            messages=[{'role': 'user', 'content': prompt}],
            format=InovasiSchema.model_json_schema(), # Fitur Structured Output Ollama
            options={'temperature': 0.0} # Dibuat 0 agar tidak berhalusinasi
        )
        
        # Output dari Ollama sudah berupa string JSON yang valid sesuai skema
        return json.loads(response['message']['content'])
    except Exception as e:
        print(f"Gagal memanggil Ollama: {str(e)}")
        return None

def extract_pdf_to_pageindex_ollama(pdf_path, output_json, max_pages=None):
    if not os.path.exists(pdf_path):
        print(f"File {pdf_path} tidak ditemukan!")
        return

    all_nodes = []
    
    # Kita kembali menggunakan bbox karena Llama 3.2 3B tidak bisa melihat gambar
    bbox_title_desc = (845, 200, 1250, 700)
    bbox_details = (100, 100, 800, 850)    

    print("--- Memulai Ekstraksi dengan OLLAMA (llama3.2:3b) ---")

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        limit = max_pages if max_pages else total_pages
        
        for i in range(0, limit, 2):
            if i + 1 >= total_pages: break
            
            try:
                page_odd = pdf.pages[i]
                page_even = pdf.pages[i+1]

                # Ekstrak Teks menggunakan layout mode
                txt_right = page_odd.crop(bbox_title_desc).extract_text(layout=True) or ""
                txt_left = page_even.crop(bbox_details).extract_text(layout=True) or ""
                
                raw_full_text = f"{txt_right}\n\n{txt_left}"

                if len(raw_full_text.strip()) < 50:
                    continue

                print(f"Memproses Inovasi {(i // 2) + 1} (Halaman {i+1} & {i+2})...")
                
                # Lempar teks mentah ke Llama 3.2
                extracted = ask_ollama_to_extract(raw_full_text)
                
                if not extracted:
                    print("  ⚠ Gagal ekstraksi, skip node ini.")
                    continue

                # Susun data PageIndex
                node_id = f"INV-{(i // 2) + 1:03d}"
                node_data = {
                    "node_id": node_id,
                    "summary": {
                        "judul": extracted.get("judul", "Tanpa Judul"),
                        "overview": extracted.get("deskripsi", "")[:200] + "..."
                    },
                    "details": extracted
                }
                
                all_nodes.append(node_data)
                print(f"  ✓ Berhasil: {node_data['summary']['judul'][:30]}")

            except Exception as e:
                print(f"  ⚠ Terjadi kesalahan di halaman {i+1}-{i+2}: {str(e)}")

    page_index_tree = {
        "metadata": {
            "source": os.path.basename(pdf_path),
            "total_nodes": len(all_nodes),
            "engine": "Ollama (llama3.2:3b)"
        },
        "nodes": all_nodes
    }

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(page_index_tree, f, ensure_ascii=False, indent=4)
    
    print(f"\nSelesai! {len(all_nodes)} node tersimpan ke {output_json}")

# --- JALANKAN ---
if __name__ == "__main__":
    input_file = "public/documents/501-Inovasi-IPB-1-TIK-Inovasi.pdf"
    output_file = "public/documents/hasil_inovasi_ipb_ollama.json"
    
    extract_pdf_to_pageindex_ollama(input_file, output_file, max_pages=10)