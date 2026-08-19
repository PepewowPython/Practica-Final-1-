import React, { useState, useEffect } from 'react';
import { Shield, Users, UserCheck, UserX, Trash2, Edit, Plus, Search, ArrowLeft, Key, Lock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [actionSuccess, setActionSuccess] = useState('');

  // Register Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Usuario Ciudadano');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/api/admin/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axios.patch(`${getApiUrl()}/api/admin/users/${userId}`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showSuccessNotice(`Rol actualizado a "${newRole}"`);
    } catch (err) {
      alert('Error al actualizar el rol');
    }
  };

  const handleStatusToggle = async (user) => {
    const nextStatus = user.status === 'suspendido' ? 'activo' : 'suspendido';
    try {
      await axios.patch(`${getApiUrl()}/api/admin/users/${user.id}`, { status: nextStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      showSuccessNotice(`Estado del usuario cambiado a ${nextStatus.toUpperCase()}`);
    } catch (err) {
      alert('Error al cambiar el estado del usuario');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario ${user.name} (${user.email})?`)) return;
    try {
      await axios.delete(`${getApiUrl()}/api/admin/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showSuccessNotice('Usuario eliminado del sistema');
    } catch (err) {
      alert('Error al eliminar usuario');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${getApiUrl()}/api/auth/register`, {
        name: newName,
        email: newEmail,
        password: newPassword,
        phone: newPhone
      });
      // update role if created
      if (newRole !== 'Usuario Ciudadano') {
        await axios.patch(`${getApiUrl()}/api/admin/users/${res.data.user.id}`, { role: newRole });
      }
      setShowAddModal(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewPhone('');
      fetchUsers();
      showSuccessNotice('Usuario registrado exitosamente');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  const showSuccessNotice = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'todos' || (u.status || 'activo') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeCount = users.filter(u => (u.status || 'activo') === 'activo').length;
  const suspendedCount = users.filter(u => u.status === 'suspendido').length;
  const adminCount = users.filter(u => u.role === 'Administrador').length;

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 60px)', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{ backgroundColor: 'var(--navy-primary)', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px' }}>
            <ArrowLeft size={16} /> Volver al Mapa
          </Link>
          <h4 className="m-0 font-weight-bold" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} className="text-warning" /> Panel de Administración General y Control de Roles (RBAC)
          </h4>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn-custom btn-custom-ghost text-white border-white btn-custom-sm d-flex align-items-center gap-2"
        >
          <Plus size={16} /> Crear Nuevo Usuario
        </button>
      </div>

      <div className="container-fluid px-4 py-4" style={{ maxWidth: '1300px' }}>

        {actionSuccess && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4 animate-fade-in shadow-sm">
            <CheckCircle2 size={18} /> {actionSuccess}
          </div>
        )}

        {/* KPI Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--navy-primary)' }}>
              <span className="text-muted small font-weight-bold">Total Usuarios Registrados</span>
              <h3 className="m-0 text-navy mt-1 font-weight-bold">{totalUsers}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--green-success)' }}>
              <span className="text-muted small font-weight-bold">Cuentas Activas</span>
              <h3 className="m-0 text-success mt-1 font-weight-bold">{activeCount}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--maroon-danger)' }}>
              <span className="text-muted small font-weight-bold">Cuentas Suspendidas</span>
              <h3 className="m-0 text-danger mt-1 font-weight-bold">{suspendedCount}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--purple-info)' }}>
              <span className="text-muted small font-weight-bold">Administradores del Sistema</span>
              <h3 className="m-0 text-purple mt-1 font-weight-bold" style={{ color: 'var(--purple-info)' }}>{adminCount}</h3>
            </div>
          </div>
        </div>

        {/* Main User Management Table Box */}
        <div className="card border-0 shadow-sm bg-white overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-3 border-bottom bg-light d-flex flex-wrap gap-3 align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Users size={20} className="text-navy" />
              <h5 className="m-0 font-weight-bold text-navy">Gestión de Usuarios y Asignación de Roles</h5>
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="input-group input-group-sm" style={{ width: '260px' }}>
                <span className="input-group-text bg-white"><Search size={14} /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar usuario o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                className="form-select form-select-sm" 
                style={{ width: '180px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="todos">Todos los Roles</option>
                <option value="Administrador">Administrador</option>
                <option value="Moderador">Moderador</option>
                <option value="Analista de Seguridad">Analista de Seguridad</option>
                <option value="Usuario Ciudadano">Usuario Ciudadano</option>
              </select>

              <select 
                className="form-select form-select-sm" 
                style={{ width: '150px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos los Estados</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="bg-light text-muted">
                <tr>
                  <th className="ps-3 py-3">USUARIO</th>
                  <th>CORREO ELECTRÓNICO</th>
                  <th>TELÉFONO</th>
                  <th>ROL ASIGNADO</th>
                  <th>ESTADO</th>
                  <th className="text-end pe-4">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">Cargando usuarios del sistema...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No se encontraron usuarios con los filtros aplicados.</td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const isSuspended = u.status === 'suspendido';
                    let roleBadgeClass = 'badge bg-secondary';
                    if (u.role === 'Administrador') roleBadgeClass = 'badge style-badge-purple';
                    if (u.role === 'Moderador') roleBadgeClass = 'badge bg-warning text-dark';
                    if (u.role === 'Analista de Seguridad') roleBadgeClass = 'badge bg-info text-dark';
                    if (u.role === 'Usuario Ciudadano') roleBadgeClass = 'badge bg-light text-dark border';

                    return (
                      <tr key={u.id} style={{ opacity: isSuspended ? 0.6 : 1 }}>
                        <td className="ps-3 font-weight-bold">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--navy-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || 'No registrado'}</td>
                        <td>
                          <select
                            className="form-select form-select-sm border-0 bg-light font-weight-bold"
                            value={u.role || 'Usuario Ciudadano'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            style={{ width: '190px', fontSize: '12px' }}
                          >
                            <option value="Usuario Ciudadano">👤 Usuario Ciudadano</option>
                            <option value="Moderador">🛡️ Moderador</option>
                            <option value="Analista de Seguridad">📊 Analista de Seguridad</option>
                            <option value="Administrador">👑 Administrador</option>
                          </select>
                        </td>
                        <td>
                          {isSuspended ? (
                            <span className="badge bg-danger">SUSPENDIDO</span>
                          ) : (
                            <span className="badge bg-success">ACTIVO</span>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-inline-flex gap-2">
                            <button
                              onClick={() => handleStatusToggle(u)}
                              className={`btn btn-sm ${isSuspended ? 'btn-outline-success' : 'btn-outline-warning'}`}
                              style={{ fontSize: '11px' }}
                              title={isSuspended ? 'Activar Cuenta' : 'Suspender Cuenta'}
                            >
                              {isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                              {isSuspended ? ' Activar' : ' Suspender'}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="btn btn-outline-danger btn-sm"
                              style={{ fontSize: '11px' }}
                              title="Eliminar Usuario"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-top bg-light text-muted small d-flex justify-content-between">
            <span>Mostrando {filteredUsers.length} de {users.length} usuarios en la base de datos</span>
            <span>Rutas Inseguras System Admin v1.4</span>
          </div>
        </div>

      </div>

      {/* Modal Agregar Usuario */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bg-white rounded-3 p-4 shadow-lg" style={{ width: '420px' }}>
            <h5 className="font-weight-bold text-navy mb-3">Registrar Nuevo Usuario (Admin)</h5>
            <form onSubmit={handleCreateUser}>
              <div className="form-group-custom mb-2">
                <label className="form-label-custom">Nombre Completo *</label>
                <input type="text" className="form-input-custom" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="form-group-custom mb-2">
                <label className="form-label-custom">Correo Electrónico *</label>
                <input type="email" className="form-input-custom" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div className="form-group-custom mb-2">
                <label className="form-label-custom">Contraseña *</label>
                <input type="password" className="form-input-custom" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group-custom mb-2">
                <label className="form-label-custom">Teléfono</label>
                <input type="text" className="form-input-custom" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Ej: 3001234567" />
              </div>
              <div className="form-group-custom mb-3">
                <label className="form-label-custom">Rol Asignado *</label>
                <select className="form-input-custom form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="Usuario Ciudadano">Usuario Ciudadano</option>
                  <option value="Moderador">Moderador</option>
                  <option value="Analista de Seguridad">Analista de Seguridad</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn-custom btn-custom-primary flex-grow-1">Guardar Usuario</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-custom btn-custom-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
