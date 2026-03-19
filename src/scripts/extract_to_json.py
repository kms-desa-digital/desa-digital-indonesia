import json
import os
import re
import time
from typing import Union
import pdfplumber
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# LOAD ENV
load_dotenv(".env.local")
GOOGLE_API_KEY = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_GENERATIVE_AI_API_KEY tidak ditemukan di .env.local")


# CONFIG MODEL
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemma-3-27b-it")


# PYDANTIC SCHEMA
class InovatorSchema(BaseModel):
    nama: list[str] = Field(default_factory=list)
    status_paten: Union[str, list[str]] = ""

class InovasiSchema(BaseModel):
    judul: str = ""
    deskripsi: str = ""
    perspektif: str = ""
    keunggulan_inovasi: list[str] = Field(default_factory=list)
    potensi_aplikasi: Union[str, list[str]] = ""
    inovator: InovatorSchema = InovatorSchema()


# CLEAN JSON
def clean_json(text):
    text = text.strip()
    text = text.replace("```json", "")
    text = text.replace("```", "")
    match = re.search(r"\{.*\}", text, re.DOTALL)

    if match:
        return match.group()
    return text


# AI EXTRACTION
def ask_ai_to_extract(text):
    schema = InovasiSchema.model_json_schema()

    prompt = f"""
    Kamu adalah sistem ekstraksi dokumen inovasi.

    TUGAS:
    Ekstrak informasi dari teks dan masukkan ke JSON.

    ATURAN:
    1. Salin teks VERBATIM dari dokumen.
    2. Jangan merangkum.
    3. Jangan menambah informasi baru.
    4. Jika tidak ditemukan isi gunakan "" atau [].
    5. OUTPUT HARUS HANYA JSON.

    Schema JSON:
    {json.dumps(schema, indent=2)}

    TEKS DOKUMEN:
    {text}
    """

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0,
                    "top_p": 0.1,
                    "max_output_tokens": 2048
                }
            )

            raw_text = response.text
            cleaned = clean_json(raw_text)
            data = json.loads(cleaned)
            validated = InovasiSchema(**data)
            result = validated.model_dump()

            if isinstance(result["inovator"]["status_paten"], list):
                result["inovator"]["status_paten"] = ", ".join(result["inovator"]["status_paten"])
            if isinstance(result["potensi_aplikasi"], list):
                result["potensi_aplikasi"] = "\n".join(result["potensi_aplikasi"])
            return result

        except Exception as e:
            print(f"[Retry {attempt}] Gagal ekstraksi:", e)
            time.sleep(2)

    print("[ERROR] Ekstraksi gagal")
    return None


# EXTRACT PDF PER HALAMAN
def extract_pdf_to_json(pdf_path, output_json):
    if not os.path.exists(pdf_path):
        print("File tidak ditemukan:", pdf_path)
        return
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    all_nodes = []

    print("Memulai ekstraksi per halaman menggunakan Gemma 3 27B...")

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        for i in range(total_pages):
            page_number = i + 1
            print(f"Memproses halaman {page_number}")
            text = pdf.pages[i].extract_text() or ""
            if not text.strip():
                continue

            extracted = ask_ai_to_extract(text)

            if not extracted:
                continue

            node_id = f"INV-{len(all_nodes)+1:03d}"
            node_data = {
                "node_id": node_id,
                "page": page_number,
                "details": extracted
            }

            all_nodes.append(node_data)
            result = {
                "metadata": {
                    "source": os.path.basename(pdf_path),
                    "total_nodes": len(all_nodes)
                },
                "nodes": all_nodes
            }

            with open(output_json, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=4)

    print("\nSelesai ekstraksi.")
    print(f"{len(all_nodes)} inovasi tersimpan ke {output_json}")


# MAIN
if __name__ == "__main__":
    input_file = "public/documents/501-Inovasi-IPB-1-TIK-Inovasi.pdf"
    output_file = "public/documents/hasil_inovasi_ipb_tik2.json"
    extract_pdf_to_json(input_file, output_file)