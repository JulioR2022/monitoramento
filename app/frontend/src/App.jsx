import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AVAILABLE_CLASSES = [
  { value: '', label: 'Todas as classes' },
  { value: 'person', label: 'Pessoa' },
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'bus', label: 'Ônibus' },
  { value: 'truck', label: 'Caminhão' },
  { value: 'bicycle', label: 'Bicicleta' },
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
  { value: 'bird', label: 'Pássaro' },
  { value: 'horse', label: 'Cavalo' },
  { value: 'cell phone', label: 'Celular' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'bottle', label: 'Garrafa' },
  { value: 'cup', label: 'Copo' },
  { value: 'chair', label: 'Cadeira' },
  { value: 'tv', label: 'TV' }
];

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentView, setCurrentView] = useState('detection');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confidence, setConfidence] = useState(0.5);
  const [stats, setStats] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
 
  const fetchChatHistory = async() => {
    try {
      // Requisição para a rota History
      const response = await fetch(`${API_URL}/History`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        return;
      }
      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      console.error("Erro ao buscar o histórico:", error);
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        return;
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchChatHistory();
      fetchStats();
    }
  }, [isAuthenticated]);

  const toggleClass = (classValue) => {
    if (classValue === '') {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(prev => 
        prev.includes(classValue) 
          ? prev.filter(c => c !== classValue) 
          : [...prev, classValue]
      );
    }
  };

  const removeClass = (e, classValue) => {
    e.stopPropagation();
    setSelectedClasses(prev => prev.filter(c => c !== classValue));
  };

  const handleUpload = async() => {
    if (!selectedFile) return;
    setLoading(true);
    setResultImage(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    formData.append('classes', selectedClasses.join(','));
    formData.append('conf', confidence);

    try {
      const response = await fetch(`${API_URL}/detect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        return;
      }

      const blob = await response.blob();
      setResultImage(URL.createObjectURL(blob));
      fetchChatHistory();
      fetchStats();
      setSelectedClasses([]);
    } catch (error) {
      console.error("Erro na detecção:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async() => {
    if(!window.confirm("Tem certeza que deseja excluir o usuario ? Essa ação não pode ser desfeita.")) return;
    try {
      const response = await fetch(`${API_URL}/deleteUser`,{
        method: 'DELETE',
        headers: {
          'Authorization':`Bearer ${localStorage.getItem('token')}`
        }
      });

      if(response.status === 401) { // token expirado
        handleLogout();
        return;
      };
      
      if(response.status === 403) { // token expirado
        alert('Essa conta não pode ser apagada');
        return;
      };
      
      if(response.ok) {
        alert('Sua conta foi excluída com sucesso');
        handleLogout();
        return;
      };
    } catch (error) {
      console.error("Erro ao apagar usuario:", error);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Tem certeza que deseja limpar todo o histórico? Essa ação não pode ser desfeita.")) return;
    try {
      const response = await fetch(`${API_URL}/History`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        return;
      }

      fetchChatHistory();
      fetchStats(); 
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResultImage(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new URLSearchParams();
    form.append('username',username);
    form.append('password',password);

    try{
      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form
      });

      if (response.ok){
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setIsAuthenticated(true);
      } else {
        setLoginError('Usuario ou senha incorretos');
      };

    } catch (error) {
      setLoginError('Error ao conectar ao servidor');
    };

  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form
      });

      if (response.ok) {
        alert('Usuário registrado com sucesso! Agora você pode fazer login.');
        setIsRegistering(false);
        setPassword(''); 
      } else {
        const data = await response.json();
        setLoginError(data.detail || 'Erro ao registrar usuário');
      }
    } catch (error) {
      setLoginError('Erro ao conectar ao servidor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <>
      {!isAuthenticated ? (
        <div className="login-container">
          <form className="login-form" onSubmit={isRegistering ? handleRegister : handleLogin}>
            <h2>{isRegistering ? 'Criar Nova Conta' : 'Entrar no Sistema'}</h2>
            {loginError && <p style={{ color: '#ef4444', textAlign: 'center', margin: 0 }}>{loginError}</p>}
            <input 
              type="text" 
              placeholder="Usuário" 
              required 
              className="filter-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Senha" 
              required 
              className="filter-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              {isRegistering ? 'Registrar' : 'Entrar'}
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--accent-blue)', marginTop: '10px' }} 
               onClick={() => { setIsRegistering(!isRegistering); setLoginError(''); }}>
              {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Registre-se'}
            </p>
          </form>
        </div>
      ) : (
      <div className="app-container">

      {/* Barra Lateral (Sidebar) */}
      <div className="sidebar">
        <h2>Monitoramento IA</h2>

        <button
          onClick={() => setCurrentView('detection')}
          className={`sidebar-item ${currentView === 'detection' ? 'active' : ''}`}
        >
            Nova Detecção
        </button>

        <button
          onClick={() => setCurrentView('chatHistory')}
          className={`sidebar-item ${currentView === 'chatHistory' ? 'active' : ''}`}
        >
            Histórico
        </button>

        <button
          onClick={() => setCurrentView('dashboard')}
          className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
        >
           Estatísticas
        </button>

        <div style={{ flexGrow: 1 }}></div>
        <button onClick={handleDeleteUser} className="sidebar-item" style={{ color: '#ef4444' }}>
          🗑️ Apagar Conta
        </button>
        <button onClick={handleLogout} className="sidebar-item logout-btn">
          🚪 Sair
        </button>
      </div>

      <div className="main-content">

        {/* Tela 1: Detecção */}
        {currentView === 'detection' && (
          <div className="view-container">
            <div className="view-header">
              <h1>Detecção de Objetos</h1>
              <p>Faça upload de uma imagem para que a IA identifique os objetos.</p>
            </div>

            <div className="controls-container">
              <div className="upload-area">
                <label htmlFor="file-upload" className="upload-box">
                  <input id="file-upload" type="file" onChange={handleFileChange} />
                  {selectedFile ? `Arquivo selecionado: ${selectedFile.name}` : "Clique ou arraste uma imagem aqui"}
                </label>
              </div>
              <div className="custom-multiselect">
                <div 
                  className="multiselect-header filter-input" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {selectedClasses.length === 0 ? (
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Todas as classes</span>
                  ) : (
                    <div className="selected-tags">
                      {selectedClasses.map(val => {
                        const classObj = AVAILABLE_CLASSES.find(c => c.value === val);
                        return classObj ? (
                          <span key={val} className="filter-tag">
                            {classObj.label}
                            <button 
                              type="button" 
                              className="remove-tag" 
                              onClick={(e) => removeClass(e, val)}
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                </div>

                {isDropdownOpen && (
                  <div className="multiselect-options">
                    {AVAILABLE_CLASSES.map(cls => {
                      const isSelected = cls.value === '' ? selectedClasses.length === 0 : selectedClasses.includes(cls.value);
                      return (
                        <div
                          key={cls.value === '' ? 'all' : cls.value}
                          className={`multiselect-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleClass(cls.value)}
                        >
                          <div className="checkbox-custom">
                            {isSelected && '✓'}
                          </div>
                          {cls.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="confidence-slider">
                <label>Confiança: {Math.round(confidence * 100)}%</label>
                <input
                  type="range"
                  min="0.05" max="1.0" step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                />
              </div>
              <button onClick={handleUpload} disabled={loading || !selectedFile} className="btn btn-primary">
                {loading ? <div className="spinner"></div> : 'Detectar Objetos'}
              </button>
            </div>

            <div className="image-grid">
              {selectedFile && (
                <div className="image-card">
                  <h3>Original</h3>
                  <img src={URL.createObjectURL(selectedFile)} alt="Original" />
                </div>
              )}
              {loading && !resultImage && (
                <div className="image-card placeholder">
                  <h3>Resultado</h3>
                  <div className="processing-indicator">
                    <div className="spinner-large"></div>
                    <p>Analisando imagem...</p>
                  </div>
                </div>
              )}
              {resultImage && (
                <div className="image-card">
                  <h3>Resultado</h3>
                  <img src={resultImage} alt="Resultado" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tela 2: Vizualizar Historico */}
        {currentView === 'chatHistory' && (
          <div className="view-container">
            <div className="view-header">
              <h1>Histórico de Detecções</h1>
              <div className="history-actions">
                <button onClick={handleExportCSV} className="btn btn-secondary">
                  ⬇️ Exportar CSV
                </button>
                <button onClick={handleClearHistory} className="btn btn-danger">
                  🗑️ Limpar Histórico
                </button>
              </div>
            </div>

            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data/Hora</th>
                  <th>Arquivo</th>
                  <th>Contagem</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {chatHistory.length > 0 ? chatHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{new Date(item.data_hora).toLocaleString()}</td>
                    <td>{item.arquivo}</td>
                    <td>
                      <div className="history-tags">
                        {Object.entries(item.contagem_json || {}).map(([cls, count]) => (
                          <span key={cls} className="history-tag">
                            <span className="history-tag-name">{cls}</span>
                            <span className="history-tag-count">{count}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedHistoryItem(item)}>
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="empty-table">Nenhum registro encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tela 3: Tela de estatisticas */}
        {currentView === 'dashboard' && (
          <div className="view-container">
            <div className="view-header">
              <h1>Dashboard de Estatísticas</h1>
            </div>
            {stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card blue">
                    <h3>Imagens Processadas</h3>
                    <p>{stats.total_images}</p>
                  </div>
                  <div className="stat-card green">
                    <h3>Objetos Detectados</h3>
                    <p>{stats.total_objects}</p>
                  </div>
                </div>

                <div className="class-count-card" style={{ marginTop: '20px', height: '400px', paddingBottom: '40px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Distribuição de Objetos por Classe</h3>
                  {Object.keys(stats.classes_count).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(stats.classes_count)
                          .sort(([, a], [, b]) => b - a)
                          .map(([name, count]) => ({ name, count }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        <Bar dataKey="count" name="Quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="empty-message">Nenhum objeto detectado ainda.</p>
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
      )}

     
      {selectedHistoryItem && (
        <div className="modal-overlay" onClick={() => setSelectedHistoryItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedHistoryItem(null)}>×</button>
            <h2>Detalhes da Detecção</h2>
            <p><strong>Arquivo:</strong> {selectedHistoryItem.arquivo}</p>
            <img 
              src={`${API_URL}/images/${selectedHistoryItem.username}/${selectedHistoryItem.arquivo}`} 
              alt={selectedHistoryItem.arquivo} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/800x400?text=Imagem+nao+encontrada+no+servidor';
              }}
            />
            <div className="history-tags mt-4">
              {Object.entries(selectedHistoryItem.contagem_json || {}).map(([cls, count]) => (
                <span key={cls} className="history-tag">
                  <span className="history-tag-name">{cls}</span>
                  <span className="history-tag-count">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;