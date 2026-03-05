import { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, TrendingUp, Clock, Search, X, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { attendanceAPI } from '../../services/api';
import { formatDate, formatTime } from '../../utils/formatters';
import './AsistenciasList.css';

const AsistenciasList = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resumen, setResumen] = useState({
        totalClientes: 0,
        asistenciasHoy: 0,
        promedioAsistencias: 0,
        duracionPromedio: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    // Filters
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        busqueda: '',
        fecha_inicio: firstOfMonth,
        fecha_fin: today
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.busqueda);
        }, 400);
        return () => clearTimeout(timer);
    }, [filters.busqueda]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };

            if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
            if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
            if (debouncedSearch) params.busqueda = debouncedSearch;

            const res = await attendanceAPI.getAll(params);
            const data = res.data;

            setAsistencias(data.asistencias || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                pages: data.pagination?.pages || 0
            }));
            if (data.resumen) {
                setResumen(data.resumen);
            }
        } catch (err) {
            console.error('Error loading attendance:', err);
            setAsistencias([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters.fecha_inicio, filters.fecha_fin, debouncedSearch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [debouncedSearch, filters.fecha_inicio, filters.fecha_fin]);

    const handleClearFilters = () => {
        setFilters({
            busqueda: '',
            fecha_inicio: firstOfMonth,
            fecha_fin: today
        });
    };

    const getInitials = (nombre, apellido) => {
        return `${(nombre || '')[0] || ''}${(apellido || '')[0] || ''}`.toUpperCase();
    };

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    return (
        <div className="asistencias-page">
            {/* Header */}
            <div className="asistencias-header">
                <div>
                    <h1>Asistencias</h1>
                    <p>Control y seguimiento de asistencias del gimnasio</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="asistencias-cards">
                <div className="stat-card blue">
                    <div className="icon-wrapper">
                        <Users />
                    </div>
                    <div className="stat-info">
                        <h3>Total Clientes</h3>
                        <div className="stat-value">{resumen.totalClientes}</div>
                        <div className="stat-sub">Clientes activos registrados</div>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="icon-wrapper">
                        <Calendar />
                    </div>
                    <div className="stat-info">
                        <h3>Asistencias Hoy</h3>
                        <div className="stat-value">{resumen.asistenciasHoy}</div>
                        <div className="stat-sub">Personas que asistieron hoy</div>
                    </div>
                </div>

                <div className="stat-card amber">
                    <div className="icon-wrapper">
                        <TrendingUp />
                    </div>
                    <div className="stat-info">
                        <h3>Promedio Diario</h3>
                        <div className="stat-value">{resumen.promedioAsistencias}</div>
                        <div className="stat-sub">Asistencias promedio por día</div>
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="icon-wrapper">
                        <Clock />
                    </div>
                    <div className="stat-info">
                        <h3>Duración Promedio</h3>
                        <div className="stat-value">{resumen.duracionPromedio}h</div>
                        <div className="stat-sub">Horas promedio por persona</div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="asistencias-filters">
                <div className="filter-search">
                    <Search />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={filters.busqueda}
                        onChange={(e) => setFilters(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>

                <div className="filter-dates">
                    <label>Desde</label>
                    <input
                        type="date"
                        value={filters.fecha_inicio}
                        onChange={(e) => setFilters(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    />
                </div>

                <div className="filter-dates">
                    <label>Hasta</label>
                    <input
                        type="date"
                        value={filters.fecha_fin}
                        onChange={(e) => setFilters(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    />
                </div>

                <button className="btn-clear-filters" onClick={handleClearFilters}>
                    <X size={14} />
                    Limpiar
                </button>
            </div>

            {/* Table */}
            <div className="asistencias-table-container">
                <div className="asistencias-table-scroll">
                    <table className="asistencias-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Código</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Registrado por</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="asistencias-loading">
                                            <div className="spinner"></div>
                                            Cargando asistencias...
                                        </div>
                                    </td>
                                </tr>
                            ) : asistencias.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="asistencias-empty">
                                            <Calendar />
                                            <p>No se encontraron asistencias</p>
                                            <span>Intenta cambiar los filtros o el rango de fechas</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                asistencias.map((a) => (
                                    <tr key={a.id}>
                                        <td>
                                            <div className="client-cell">
                                                {a.cliente_foto ? (
                                                    <img
                                                        src={`${API_URL}${a.cliente_foto}`}
                                                        alt=""
                                                        className="client-avatar"
                                                    />
                                                ) : (
                                                    <div className="client-avatar-placeholder">
                                                        {getInitials(a.cliente_nombre, a.cliente_apellido)}
                                                    </div>
                                                )}
                                                <span className="client-name">
                                                    {a.cliente_nombre} {a.cliente_apellido}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{a.codigo}</td>
                                        <td>
                                            <span className={`badge-tipo ${a.tipo || 'entrada'}`}>
                                                {a.tipo === 'salida' ? (
                                                    <><LogOut size={12} /> Salida</>
                                                ) : (
                                                    <><LogIn size={12} /> Entrada</>
                                                )}
                                            </span>
                                        </td>
                                        <td>{formatDate(a.fecha_hora)}</td>
                                        <td>{formatTime(a.fecha_hora)}</td>
                                        <td>{a.usuario_nombre || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && asistencias.length > 0 && (
                    <div className="asistencias-pagination">
                        <div className="pagination-info">
                            Mostrando {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                            {pagination.total} registros
                        </div>
                        <div className="pagination-controls">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                                let pageNum;
                                if (pagination.pages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.pages - 2) {
                                    pageNum = pagination.pages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        className={pagination.page === pageNum ? 'active' : ''}
                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                <ChevronRight size={14} />
                            </button>

                            <select
                                value={pagination.limit}
                                onChange={(e) => setPagination(prev => ({
                                    ...prev,
                                    limit: parseInt(e.target.value),
                                    page: 1
                                }))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AsistenciasList;
