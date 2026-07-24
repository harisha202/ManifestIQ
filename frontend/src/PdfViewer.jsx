import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfViewer = forwardRef(({ fileUrl }, ref) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  // Expose a method to navigate to a specific page
  useImperativeHandle(ref, () => ({
    goToPage: (page) => {
      if (page >= 1 && page <= (numPages || 1000)) {
        setPageNumber(page);
      }
    }
  }));

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error) {
    console.error("Failed to load PDF", error);
    setLoading(false);
  }

  if (!fileUrl) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
        No document selected.
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>
          Document Preview
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <button 
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            style={{ padding: '0.25rem 0.5rem', cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--white)' }}
          >
            Prev
          </button>
          <span>Page {pageNumber} of {numPages || '--'}</span>
          <button 
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))}
            disabled={pageNumber >= (numPages || 1)}
            style={{ padding: '0.25rem 0.5rem', cursor: pageNumber >= (numPages || 1) ? 'not-allowed' : 'pointer', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--white)' }}
          >
            Next
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
        <Document
          file={{
            url: fileUrl,
            httpHeaders: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div>Loading PDF...</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            width={500} // Set a fixed width or make it responsive
          />
        </Document>
      </div>
    </div>
  );
});

export default PdfViewer;
