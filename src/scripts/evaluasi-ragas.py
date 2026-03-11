import pandas as pd
from datasets import Dataset
from ragas import evaluate
import warnings
import os
from dotenv import load_dotenv 
warnings.filterwarnings('ignore') 

# Import Metric Ragas
from ragas.metrics import (
    Faithfulness,
    AnswerRelevancy, 
    ContextPrecision,
    ContextRecall
)

from ragas.run_config import RunConfig

# Import (Google GenAI & Ollama Lokal)
from langchain_openai import ChatOpenAI
from langchain_ollama import OllamaEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper

# Memuat file .env.local
load_dotenv(dotenv_path=".env.local")

api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
if not api_key:
    print("ERROR: GOOGLE_GENERATIVE_AI_API_KEY tidak ditemukan")
    exit()
    
os.environ["GOOGLE_API_KEY"] = api_key 

# LLM menggunakan Gemma 3 27B Instruct (Kuota besar 14.400 per hari)
gemma_llm = ChatOpenAI(
    model="gemma-3-27b-it",
    api_key=api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    temperature=0.0
)

# Embedding menggunakan Ollama lokal Anda (Aman dari limit kuota harian)
local_emb = OllamaEmbeddings(model="nomic-embed-text:latest")
evaluator_llm = LangchainLLMWrapper(gemma_llm)
evaluator_embeddings = LangchainEmbeddingsWrapper(local_emb)

file_path = "public/documents/data_all_dokumen.xlsx" 
print(f"Membaca file {file_path}...")

try:
    all_sheets = pd.read_excel(file_path, sheet_name=None) 
except FileNotFoundError:
    print(f"ERROR: File {file_path} tidak ditemukan.")
    exit()

all_results = []

# Membatasi Ragas agar mengirim pertanyaan 1 per 1 
custom_run_config = RunConfig(max_workers=1)

# Eksekusi Evaluasi Per Sheet
for sheet_name, df in all_sheets.items():
    print(f"\n[ Memulai evaluasi untuk Sheet: {sheet_name} dengan Gemma 3 27B... ]")
    
    # Pre-processing
    df['contexts'] = df['contexts'].apply(lambda x: [str(x)] if pd.notnull(x) else [""])
    df['question'] = df['question'].astype(str)
    df['answer'] = df['answer'].astype(str)
    df['ground_truth'] = df['ground_truth'].astype(str)
    
    eval_dataset = Dataset.from_pandas(df)
    
    metrics_list = [
        Faithfulness(), 
        AnswerRelevancy(strictness=1), 
        ContextPrecision(), 
        ContextRecall()
    ]
    
    try:
        # Eksekusi Ragas dengan rem tangan aktif
        result = evaluate(
            dataset=eval_dataset,
            metrics=metrics_list, 
            llm=evaluator_llm,               
            embeddings=evaluator_embeddings,
            run_config=custom_run_config
        )
        
        df_result = result.to_pandas()
        df_result['metode'] = sheet_name 
        all_results.append(df_result)
        print(f"Evaluasi {sheet_name} berhasil diselesaikan!")
        
    except Exception as e:
        print(f"Terjadi kendala pada sheet {sheet_name}. Error: {e}")

# Gabungkan dan Simpan Hasil
if all_results:
    final_df = pd.concat(all_results, ignore_index=True)
    print("\nHasil Evaluasi per Metode:")
    print("===========================================")
    summary = final_df.groupby('metode')[['faithfulness', 'answer_relevancy', 'context_precision', 'context_recall']].mean()
    print(summary)

    output_file = "hasil_ragas_all_dokumen.xlsx"
    final_df.to_excel(output_file, index=False)
    print(f"\nEvaluasi selesai! File '{output_file}' berhasil disimpan.")
else:
    print("\nEvaluasi gagal menghasilkan data.")