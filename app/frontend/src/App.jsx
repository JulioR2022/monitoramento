import { useState } from 'react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
     
      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      const blob = await response.blob();
      setResultImage(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Erro na detecção:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚦 Monitoramento Urbano</h1>
      <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Processando...' : 'Detectar Objetos'}
      </button>

      <div style={{ display: 'flex', marginTop: '20px', gap: '20px' }}>
        {selectedFile && (
          <div>
            <h3>Original</h3>
            <img src={URL.createObjectURL(selectedFile)} width="400" alt="Original" />
          </div>
        )}
        {resultImage && (
          <div>
            <h3>Resultado</h3>
            <img src={resultImage} width="400" alt="Resultado" />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;