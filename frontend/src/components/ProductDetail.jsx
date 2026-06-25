import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import axios from 'axios';

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`http://localhost:3001/api/items/${id}`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('No se pudo cargar la información detallada del artículo.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 flex-grow-1" style={{ minHeight: '400px' }}>
        <Loader2 className="animate-spin text-primary-navy mb-3" size={36} />
        <p className="text-muted">Cargando detalles del equipamiento...</p>
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

  if (!data || !data.item) return null;

  const { item, author } = data;

  return (
    <div className="ml-detail-container animate-fade-in">
      <div className="mb-4">
        <button 
          onClick={() => window.history.back()} 
          className="btn btn-link text-muted p-0 text-decoration-none small d-inline-flex align-items-center gap-1"
        >
          <ArrowLeft size={14} /> Volver a resultados
        </button>
      </div>

      <div className="ml-detail-main">
        {/* Left Side: Big Image */}
        <div className="ml-detail-gallery">
          <img 
            src={item.picture} 
            alt={item.title} 
            className="ml-detail-img" 
          />
        </div>

        {/* Right Side: Product Panel */}
        <div className="ml-detail-panel">
          <div className="ml-detail-condition">
            {item.condition === 'nuevo' ? 'Nuevo' : 'Usado'} - {item.sold_quantity} vendidos
          </div>
          
          <h1 className="ml-detail-title">{item.title}</h1>
          
          <div className="ml-detail-price">
            {item.price.currency === 'ARS' ? '$' : item.price.currency === 'COP' ? '$' : item.price.currency} {item.price.amount.toLocaleString('es-ES')}
            <span className="ml-detail-price-decimals">
              {item.price.decimals.toString().padStart(2, '0')}
            </span>
          </div>

          {item.free_shipping && (
            <div className="alert alert-success py-2 px-3 small border-0 d-inline-block mb-4" style={{ backgroundColor: 'rgba(81, 133, 85, 0.1)', color: 'var(--green-success)' }}>
              🚚 Este producto cuenta con Envío Gratis
            </div>
          )}

          <button 
            onClick={() => alert('¡Gracias por tu compra simulada! Este artículo te ayudará a movilizarte seguro.')} 
            className="btn-custom btn-custom-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2"
          >
            <ShoppingCart size={18} /> Comprar Ahora
          </button>
        </div>
      </div>

      {/* Description Section */}
      <div className="ml-detail-description-section">
        <h3 className="ml-detail-description-title text-navy-primary font-weight-bold">
          Descripción del producto
        </h3>
        <p className="ml-detail-description-text">
          {item.description}
        </p>
      </div>

      {/* Author signature */}
      <div className="text-center text-muted small mt-5 pt-4 border-top">
        Ficha técnica certificada por el desarrollador: <strong>{author.name} {author.lastname}</strong>
      </div>
    </div>
  );
}
