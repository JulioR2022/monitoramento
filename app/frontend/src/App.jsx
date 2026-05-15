import { useState, useEffect } from 'react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentView, setCurrentView] = useState('detection');
  const [filterClasses, setFilterClasses] = useState('');
  const [confidence, setConfidence] = useState(0.5);
  const [stats, setStats] = useState(null);

  const fetchChatHistory = async() => {
    try {
      // Requisição para a rota History
      const response = await fetch('http://localhost:8000/History');
      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      console.error("Erro ao buscar o histórico:", error);
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/statistics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  useEffect(() => {
    fetchChatHistory();
    fetchStats();
  }, [])
  
  const handleUpload = async() => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    if (filterClasses.trim()) {
      formData.append('classes', filterClasses);
    }
    formData.append('conf', confidence);

    try {
      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      const blob = await response.blob();
      setResultImage(URL.createObjectURL(blob));
      fetchChatHistory();
      fetchStats();
    } catch (error) {
      console.error("Erro na detecção:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Tem certeza que deseja limpar todo o histórico? Essa ação não pode ser desfeita.")) return;
    try {
      await fetch('http://localhost:8000/History', { method: 'DELETE' });
      fetchChatHistory(); // Atualiza a tabela na tela
      fetchStats(); // Reseta os contadores do dashboard
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
    }
  };

  const handleExportCSV = () => {
    if (chatHistory.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = ["ID", "Data/Hora", "Arquivo", "Contagem"];
    const rows = chatHistory.map(item => [
      item.id,
      new Date(item.data_hora).toLocaleString(),
      item.arquivo,
      JSON.stringify(item.contagem_json).replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => `"${e[0]}","${e[1]}","${e[2]}","${e[3]}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "historico_deteccoes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', fontFamily: 'Arial, sans-serif' }}>
        
      {/* Barra Lateral (Sidebar) */}
      <div style={{ width: '250px', backgroundColor: '#2c3e50', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ borderBottom: '1px solid #4a627a', paddingBottom: '15px', marginBottom: '20px', marginTop: 0 }}>
           Monitoramento
        </h2>
        
        <button 
          onClick={() => setCurrentView('detection')}
          style={{ padding: '12px', backgroundColor: currentView === 'detection' ? '#34495e' : 'transparent', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '16px' }}
        >
           Nova Detecção
        </button>
        
        <button 
          onClick={() => setCurrentView('chatHistory')}
          style={{ padding: '12px', backgroundColor: currentView === 'chatHistory' ? '#34495e' : 'transparent', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '16px' }}
        >
           Histórico
        </button>
        
        <button 
          onClick={() => setCurrentView('dashboard')}
          style={{ padding: '12px', backgroundColor: currentView === 'dashboard' ? '#34495e' : 'transparent', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '16px' }}
        >
          Estatísticas
        </button>
      </div>

      <div style={{ flex: 1, padding: '30px', backgroundColor: '#ecf0f1', overflowY: 'auto' }}>
        
        {/* Tela 1: Nova Detecção */}
        {currentView === 'detection' && (
          <div>
            <h1 style={{ marginTop: 0 }}>Nova Detecção de Objetos</h1>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <input 
                type="text" 
                value={filterClasses} 
                onChange={(e) => setFilterClasses(e.target.value)}
                placeholder="Filtro (ex: person, car)"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7', width: '200px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', width: '150px' }}>
                <label style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '2px' }}>Confiança: {Math.round(confidence * 100)}%</label>
                <input 
                  type="range" 
                  min="0.05" max="1.0" step="0.05" 
                  value={confidence} 
                  onChange={(e) => setConfidence(parseFloat(e.target.value))} 
                />
              </div>
              <button onClick={handleUpload} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px' }}>
                {loading ? 'Processando...' : 'Detectar Objetos'}
              </button>
            </div>

            <div style={{ display: 'flex', marginTop: '20px', gap: '20px' }}>
              {selectedFile && (
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginTop: 0 }}>Original</h3>
                  <img src={URL.createObjectURL(selectedFile)} width="400" alt="Original" style={{ borderRadius: '4px' }} />
                </div>
              )}
              {resultImage && (
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginTop: 0 }}>Resultado</h3>
                  <img src={resultImage} width="400" alt="Resultado" style={{ borderRadius: '4px' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tela 2: Histórico */}
        {currentView === 'chatHistory' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ marginTop: 0, marginBottom: 0 }}>Histórico de Detecções</h1>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleExportCSV} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  ⬇️ Exportar CSV
                </button>
                <button onClick={handleClearHistory} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  🗑️ Limpar Histórico
                </button>
              </div>
            </div>
            
            <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: 'none' }}>
              <thead style={{ backgroundColor: '#bdc3c7' }}>
                <tr>
                  <th>ID</th>
                  <th>Data/Hora</th>
                  <th>Arquivo</th>
                  <th>Contagem</th>
                </tr>
              </thead>
              <tbody>
                {chatHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td>{item.id}</td>
                    <td>{new Date(item.data_hora).toLocaleString()}</td>
                    <td>{item.arquivo}</td>
                    <td><pre style={{ margin: 0, fontSize: '13px' }}>{JSON.stringify(item.contagem_json, null, 2)}</pre></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tela 3: Dashboard */}
        {currentView === 'dashboard' && (
          <div>
            <h1 style={{ marginTop: 0, marginBottom: '20px' }}>Dashboard de Estatísticas</h1>
            {stats ? (
              <>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ flex: 1, backgroundColor: '#3498db', color: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Imagens Processadas</h3>
                    <p style={{ fontSize: '36px', margin: 0, fontWeight: 'bold' }}>{stats.total_images}</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#2ecc71', color: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Objetos Detectados</h3>
                    <p style={{ fontSize: '36px', margin: 0, fontWeight: 'bold' }}>{stats.total_objects}</p>
                  </div>
                </div>

                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Objetos por Classe</h3>
                  {Object.keys(stats.classes_count).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                      {Object.entries(stats.classes_count).map(([classe, contagem]) => (
                        <div key={classe} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{classe}</span>
                          <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '14px' }}>{contagem}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#7f8c8d' }}>Nenhum objeto detectado ainda.</p>
                  )}
                </div>
              </>
            ) : (
              <p>Carregando estatísticas...</p>
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
}

export default App;