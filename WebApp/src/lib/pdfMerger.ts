import { PDFDocument } from 'pdf-lib';

/**
 * Merges multiple PDF files into a single PDF document
 * @param files - Array of PDF File objects to merge
 * @returns Merged PDF as Uint8Array
 */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
    // Sort files by name (assuming chronological naming like YYYY-MM-DD_...)
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    for (const file of sortedFiles) {
        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Load the PDF
            const pdf = await PDFDocument.load(arrayBuffer);

            // Copy all pages from this PDF to the merged PDF
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });

            console.log(`Merged: ${file.name}`);
        } catch (error) {
            console.error(`Failed to merge ${file.name}:`, error);
            throw new Error(`Failed to merge ${file.name}: ${error}`);
        }
    }

    // Serialize  the merged PDF to bytes
    const mergedPdfBytes = await mergedPdf.save();

    console.log(`Successfully merged ${sortedFiles.length} PDF files`);

    return mergedPdfBytes;
}
