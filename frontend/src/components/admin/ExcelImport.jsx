import React, { useState, useRef } from 'react';
import './ExcelImport.css';

function ExcelImport() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      alert('Only .xlsx or .xls files are allowed');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://backend-beryl-pi.vercel.app/api/excel/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      setResult({ ...data, ok: response.ok });
    } catch (err) {
      setResult({ ok: false, error: 'Network error. Is the backend running?' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="excel-import-container">
      <div className="excel-import-header">
        <h2>📥 Import Students from Excel</h2>
        <p>Bulk upload student data. Students will be required to reset their password on first login.</p>
      </div>

      {/* Template Info */}
      <div className="excel-template-info">
        <h4>📋 Required Excel Columns</h4>
        <div className="columns-grid">
          {[
            { col: 'enrollment_no', req: false },
            { col: 'name', req: true },
            { col: 'email', req: true },
            { col: 'password', req: true },
            { col: 'class', req: false },
            { col: 'division', req: false },
            { col: 'roll_no', req: false },
            { col: 'phone', req: false }
          ].map(({ col, req }) => (
            <span key={col} className={`col-badge ${req ? 'required' : 'optional'}`}>
              {col} {req ? '*' : ''}
            </span>
          ))}
        </div>
        <small>* Required fields. Template file: <code>database/students_import_template.xlsx</code></small>
      </div>

      {/* Drop Zone */}
      <div
        className={`excel-dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="file-selected">
            <span className="file-icon">📊</span>
            <div>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              className="remove-file"
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="drop-prompt">
            <span className="drop-icon">📂</span>
            <p>Drag & drop your Excel file here</p>
            <p className="drop-sub">or click to browse</p>
            <span className="drop-formats">.xlsx, .xls supported</span>
          </div>
        )}
      </div>

      {/* Import Button */}
      <button
        className="import-btn"
        onClick={handleImport}
        disabled={!file || loading}
      >
        {loading ? (
          <><span className="spinner-sm"></span> Importing...</>
        ) : (
          '⬆️ Import Students'
        )}
      </button>

      {/* Result */}
      {result && (
        <div className={`import-result ${result.ok ? 'success' : 'error'}`}>
          {result.ok ? (
            <>
              <div className="result-header">✅ Import Complete</div>
              <div className="result-stats">
                <div className="stat-item green">
                  <span className="stat-num">{result.imported}</span>
                  <span>Imported</span>
                </div>
                <div className="stat-item orange">
                  <span className="stat-num">{result.skipped}</span>
                  <span>Skipped</span>
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="result-errors">
                  <p>⚠️ Skipped rows:</p>
                  <ul>
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="result-header">❌ {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExcelImport;
