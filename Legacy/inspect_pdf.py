import sys
import os

def inspect_pdf(path):
    print(f"Inspecting {path}...")
    
    # Try pdfplumber
    try:
        import pdfplumber
        print("Using pdfplumber...")
        with pdfplumber.open(path) as pdf:
            print(f"Total pages: {len(pdf.pages)}")
            for i, page in enumerate(pdf.pages[:2]): 
                print(f"--- Page {i+1} ---")
                text = page.extract_text()
                if text:
                    print(text[:1000])
                else:
                    print("[No text extracted]")
                print("\n")
        return
    except ImportError:
        print("pdfplumber not found.")
    except Exception as e:
        print(f"pdfplumber error: {e}")

    # Try pypdf
    try:
        from pypdf import PdfReader
        print("Using pypdf...")
        reader = PdfReader(path)
        print(f"Total pages: {len(reader.pages)}")
        for i, page in enumerate(reader.pages[:2]):
            print(f"--- Page {i+1} ---")
            text = page.extract_text()
            if text:
                print(text[:1000])
            else:
                 print("[No text extracted]")
            print("\n")
        return
    except ImportError:
        print("pypdf not found.")
    except Exception as e:
        print(f"pypdf error: {e}")

    print("Could not extract text. Install pdfplumber or pypdf.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
    else:
        target_file = "EESZT_Archive/2024-07-12- - 2024-07-12_Synlab Hungary Kft. (113030)_Általános laboratóriumi ellátá.pdf"

    if not os.path.exists(target_file):
        print(f"File not found: {target_file}")
        # Try finding *any* PDF in EESZT_Archive
        pdfs = [f for f in os.listdir("EESZT_Archive") if f.endswith(".pdf")] if os.path.exists("EESZT_Archive") else []
        if pdfs:
            target_file = os.path.join("EESZT_Archive", pdfs[0])
            print(f"Using alternate file: {target_file}")
        else:
            # Fallback to merged if spec file missing and no other PDFs found
            if os.path.exists("merged_medical_history.pdf"):
                target_file = "merged_medical_history.pdf"
                print(f"Using fallback file: {target_file}")
            else:
                print("No PDF found to inspect.")
                sys.exit(1) # Exit if no file can be found
    
    inspect_pdf(target_file)
