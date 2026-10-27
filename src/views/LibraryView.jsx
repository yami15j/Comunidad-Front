import React, { useState } from 'react';
import { FolderDown, Search, FileSpreadsheet, FileText, Download, Star, Filter } from 'lucide-react';

export function LibraryView({ resources }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Ventas & Outbound', 'Finanzas & Métricas', 'Operaciones & Procesos', 'Liderazgo & Talento'];

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                          r.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-emerald">
              <FolderDown size={14} />
              <span>Caja de Herramientas Operativas</span>
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
            Biblioteca de Recursos & Plantillas Ejecutivas
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Modelos de Excel, Notion docs y marcos de trabajo listos para duplicar e implementar en tu negocio.
          </p>
        </div>

        {/* Buscador */}
        <div style={{ width: '300px' }}>
          <input 
            type="text"
            placeholder="Buscar plantillas, modelos o guías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Categorías */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: selectedCategory === cat ? '1px solid var(--brand-celeste)' : '1px solid var(--border-subtle)',
              backgroundColor: selectedCategory === cat ? 'var(--brand-celeste-subtle)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? 'var(--brand-celeste)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat === 'all' ? 'Todos los Recursos' : cat}
          </button>
        ))}
      </div>

      {/* Grid de Recursos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredResources.map((res) => {
          const isExcel = res.fileType === 'xlsx' || res.fileType === 'sheets';
          return (
            <div 
              key={res.id}
              className="card card-interactive"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isExcel ? 'var(--brand-celeste-subtle)' : 'var(--bg-surface-elevated)',
                  color: isExcel ? 'var(--brand-celeste)' : 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isExcel ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                </div>

                <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                  {res.category}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.3' }}>
                {res.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '18px' }}>
                {res.description}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {res.type} • {res.size} • ★ {res.rating}
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => alert(`Descargando recurso: ${res.title}`)}
                >
                  <Download size={14} />
                  <span>Obtener</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LibraryView;
