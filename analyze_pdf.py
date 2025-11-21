import pypdf
import re

def analyze_pdf(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")
    
    full_text = ""
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        print(f"--- Page {i+1} ---")
        # print(text[:200]) # Print first 200 chars
        
        if "11. Sınıf / D Şubesi" in text:
            print(f"FOUND '11. Sınıf / D Şubesi' on page {i+1}")
            print("Context:")
            # Find the index and print surrounding text
            idx = text.find("11. Sınıf / D Şubesi")
            start = max(0, idx - 100)
            end = min(len(text), idx + 500)
            print(text[start:end])
            
        full_text += text + "\n"

    # Look for students in 11D
    # We don't know the student names, but we can see what follows the class header
    
if __name__ == "__main__":
    analyze_pdf("OOG01001R020_1121.PDF")
