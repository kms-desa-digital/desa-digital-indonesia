import pandas as pd
from datasets import Dataset
from ragas import evaluate
import warnings
import os
from dotenv import load_dotenv 

# Menonaktifkan warning agar output lebih bersih
warnings.filterwarnings('ignore') 

# Import metric evaluasi dari Ragas
from ragas.metrics import (
    Faithfulness,
    AnswerRelevancy, 
    ContextPrecision,
    ContextRecall
)

# Konfigurasi eksekusi Ragas (misal jumlah worker)
from ragas.run_config import RunConfig

# Import LLM dan Embedding
from langchain_openai import ChatOpenAI
from langchain_ollama import OllamaEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper

# Load environment variables dari file .env.local
load_dotenv(dotenv_path=".env.local")

# Ambil API key Google GenAI dari environment
api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")

# Validasi API key
if not api_key:
    print("ERROR: GOOGLE_GENERATIVE_AI_API_KEY tidak ditemukan")
    exit()

# Set API key ke environment variable yang dibutuhkan
os.environ["GOOGLE_API_KEY"] = api_key 

# Inisialisasi LLM Gemma 3 27B Instruct via endpoint OpenAI-compatible
gemma_llm = ChatOpenAI(
    model="gemma-3-27b-it",
    api_key=api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    temperature=0.0  # deterministik untuk evaluasi
)

# Inisialisasi embedding lokal menggunakan Ollama
local_emb = OllamaEmbeddings(model="embeddinggemma:latest")

# Wrapper agar kompatibel dengan Ragas
evaluator_llm = LangchainLLMWrapper(gemma_llm)
evaluator_embeddings = LangchainEmbeddingsWrapper(local_emb)

# Path file Excel yang berisi data evaluasi
file_path = "public/documents/data_all_dokumen_1.xlsx" 
print(f"Membaca file {file_path}...")

# Membaca semua sheet dalam file Excel
try:
    all_sheets = pd.read_excel(file_path, sheet_name=None) 
except FileNotFoundError:
    print(f"ERROR: File {file_path} tidak ditemukan.")
    exit()

# Menyimpan hasil evaluasi dari semua sheet
all_results = []

# Membatasi eksekusi agar 1 request per waktu (hindari rate limit / overload)
custom_run_config = RunConfig(max_workers=1)

# Loop untuk setiap sheet dalam Excel
for sheet_name, df in all_sheets.items():
    print(f"\n[ Memulai evaluasi untuk Sheet: {sheet_name} dengan Gemma 3 27B... ]")
    
    # Pre-processing data
    # Kolom contexts harus berupa list of string
    df['contexts'] = df['contexts'].apply(
        lambda x: [str(x)] if pd.notnull(x) else [""]
    )

    # Pastikan semua kolom bertipe string
    df['question'] = df['question'].astype(str)
    df['answer'] = df['answer'].astype(str)
    df['ground_truth'] = df['ground_truth'].astype(str)
    
    # Konversi DataFrame ke format Dataset (HuggingFace)
    eval_dataset = Dataset.from_pandas(df)
    
    # Daftar metric yang digunakan dalam evaluasi
    metrics_list = [
        Faithfulness(), 
        AnswerRelevancy(strictness=1), 
        ContextPrecision(), 
        ContextRecall()
    ]
    
    try:
        # Eksekusi evaluasi menggunakan Ragas
        result = evaluate(
            dataset=eval_dataset,
            metrics=metrics_list, 
            llm=evaluator_llm,               
            embeddings=evaluator_embeddings,
            run_config=custom_run_config
        )
        
        # Konversi hasil ke DataFrame
        df_result = result.to_pandas()

        # Tambahkan informasi metode (nama sheet)
        df_result['metode'] = sheet_name 

        # Simpan ke list hasil
        all_results.append(df_result)
        print(f"Evaluasi {sheet_name} berhasil diselesaikan!")
        
    except Exception as e:
        # Menangani error per sheet agar tidak menghentikan seluruh proses
        print(f"Terjadi kendala pada sheet {sheet_name}. Error: {e}")

# Post-processing hasil
if all_results:
    # Gabungkan semua hasil evaluasi
    final_df = pd.concat(all_results, ignore_index=True)

    print("\nHasil Evaluasi per Metode:")
    print("===========================================")

    # Hitung rata-rata metric per metode
    summary = final_df.groupby('metode')[
        ['faithfulness', 'answer_relevancy', 'context_precision', 'context_recall']
    ].mean()

    print(summary)

    # Simpan hasil ke file Excel
    output_file = "hasil_ragas_all_dokumen_1.xlsx"
    final_df.to_excel(output_file, index=False)

    print(f"\nEvaluasi selesai! File '{output_file}' berhasil disimpan.")
else:
    print("\nEvaluasi gagal menghasilkan data.")