import os
from pypdf import PdfWriter
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

ARCHIVE_DIR = "./EESZT_Archive"
OUTPUT_FILE = "merged_medical_history.pdf"

def merge_pdfs():
    if not os.path.exists(ARCHIVE_DIR):
        logging.error(f"Archive directory not found: {ARCHIVE_DIR}")
        return

    # Get all PDF files
    files = [f for f in os.listdir(ARCHIVE_DIR) if f.lower().endswith('.pdf')]
    
    if not files:
        logging.warning("No PDF files found to merge.")
        return

    # Sort files to ensure chronological order if filenames start with YYYY-MM-DD
    # Our downloader names them: YYYY-MM-DD_Institution_Type.pdf
    files.sort()
    
    logging.info(f"Found {len(files)} PDF files to merge.")
    
    merger = PdfWriter()

    for filename in files:
        filepath = os.path.join(ARCHIVE_DIR, filename)
        try:
            logging.info(f"Adding: {filename}")
            merger.append(filepath)
        except Exception as e:
            logging.error(f"Failed to add {filename}: {e}")

    try:
        logging.info(f"Writing merged PDF to {OUTPUT_FILE}...")
        merger.write(OUTPUT_FILE)
        merger.close()
        logging.info("Merge completed successfully!")
    except Exception as e:
        logging.error(f"Failed to write merged PDF: {e}")

if __name__ == "__main__":
    merge_pdfs()
