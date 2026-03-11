import pdfplumber
import os

def debug_koordinat(pdf_path, page_num, bbox, output_filename):
    print(f"Memproses Halaman {page_num}...")
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[page_num - 1] 
        
        im = page.to_image(resolution=100)
        # Menggunakan warna hijau dan garis agak tebal agar terlihat jelas
        im.draw_rect(bbox, stroke="green", stroke_width=4)
        im.save(output_filename)
        print(f"Selesai! Cek {output_filename}")

file_pdf = "public/documents/501-Inovasi-IPB-1-TIK.pdf"

if not os.path.exists(file_pdf):
    print("File PDF tidak ditemukan!")
else:
    # Halaman 1
    hal_1 = (845, 200, 1250, 700) 
    debug_koordinat(file_pdf, 1, hal_1, "hal_1.png")

    # Halaman 2
    hal_2 = (100, 100, 800, 850)
    debug_koordinat(file_pdf, 2, hal_2, "hal_2.png")