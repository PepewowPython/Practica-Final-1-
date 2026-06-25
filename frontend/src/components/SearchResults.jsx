import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Truck, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('search');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`http://localhost:3001/api/items?q=${encodeURIComponent(query)}`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('No se pudo establecer conexión con el servidor. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 flex-grow-1" style={{ minHeight: '400px' }}>
        <Loader2 className="animate-spin text-primary-navy mb-3" size={36} />
        <p className="text-muted">Buscando en catálogo de seguridad...</p>
        <style>{`
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-5 text-center">
        <div className="alert alert-danger d-inline-block shadow-sm">
          {error}
        </div>
        <div className="mt-3">
          <Link to="/" className="btn-custom btn-custom-secondary btn-custom-sm">
            <ArrowLeft size={16} /> Volver al Mapa
          </Link>
        </div>
      </div>
    );
  }

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="container p-5 text-center">
        <h4 className="text-muted">No se encontraron artículos para "{query}"</h4>
        <p className="small text-muted mb-4">Intenta buscar términos como "casco", "linterna", "chaleco" o "alarma".</p>
        <Link to="/" className="btn-custom btn-custom-primary">
          <ArrowLeft size={16} /> Volver al Mapa
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-results-container animate-fade-in">
      {/* Category Breadcrumbs */}
      {data.categories && data.categories.length > 0 && (
        <div className="ml-breadcrumb">
          {data.categories.join('  >  ')}
        </div>
      )}

      {/* Back Button */}
      <div className="mb-3">
        <Link to="/" className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1">
          <ArrowLeft size={14} /> Volver al Mapa
        </Link>
      </div>

      {/* Products List */}
      <div className="ml-product-list shadow-sm">
        {data.items.map((item) => (
          <Link to={`/items/${item.id}`} key={item.id} className="ml-product-item">
            <img 
              src={item.picture} 
              alt={item.title} 
              className="ml-product-img" 
            />
            
            <div className="ml-product-info">
              <div className="ml-product-price-row">
                <span className="ml-product-price">
                  {item.price.currency === 'ARS' ? '$' : item.price.currency === 'COP' ? '$' : item.price.currency} {item.price.amount.toLocaleString('es-ES')}
                  {item.price.decimals > 0 && <span style={{ fontSize: '0.9rem', verticalAlign: 'super', marginLeft: '2px' }}>{item.price.decimals.toString().padStart(2, '0')}</span>}
                </span>
                
                {item.free_shipping && (
                  <span className="ml-shipping-badge" title="Envío Gratis">
                    <Truck size={18} className="me-1" />
                    <small className="font-weight-bold" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Envío Gratis</small>
                  </span>
                )}
              </div>
              
              <h2 className="ml-product-title">{item.title}</h2>
              <span className="text-muted small">Estado: {item.condition}</span>
              
              <span className="ml-product-location">
                {item.address}
              </span>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Author Signature (SENA requirement) */}
      <div className="text-center text-muted small mt-4">
        Búsqueda provista por: <strong>{data.author.name} {data.author.lastname}</strong>
      </div>
    </div>
  );
}
