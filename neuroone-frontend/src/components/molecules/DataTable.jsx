import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Box,
  Typography,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Card } from '../atoms/Card';
import LoadingOverlay from '../atoms/LoadingOverlay';
import EmptyState from '../layout/EmptyState';

/**
 * DataTable - Tabela universal responsiva
 *
 * Features:
 * - Configuração flexível de colunas
 * - Paginação opcional
 * - Busca/filtro opcional
 * - Ordenação opcional
 * - Loading state
 * - Empty state customizável
 * - Mobile responsive (cards em mobile, table em desktop)
 * - Action buttons configuráveis
 *
 * @param {Object} props
 * @param {Array} props.columns - Configuração das colunas
 *   [{ id: 'name', label: 'Nome', sortable: true, align: 'left', render: (value, row) => ReactNode, format: 'date'|'datetime'|'currency' }]
 * @param {Array} props.data - Array de dados
 * @param {Array} props.actions - Ações disponíveis para cada linha
 *   [{ icon: ReactNode, onClick: (row) => void, label: string, color: string, disabled: (row) => boolean }]
 * @param {boolean} props.loading - Estado de loading
 * @param {Object} props.emptyState - Configuração do empty state
 *   { icon: ReactNode, title: string, description: string, actionLabel: string, onAction: () => void }
 * @param {boolean} props.pagination - Habilitar paginação (default: true)
 * @param {number} props.rowsPerPageOptions - Opções de linhas por página (default: [5, 10, 25])
 * @param {boolean} props.searchable - Habilitar busca (default: false)
 * @param {string} props.searchPlaceholder - Placeholder do campo de busca
 * @param {Function} props.onSearch - Callback quando busca muda (se não fornecido, usa busca local)
 * @param {string} props.defaultSortBy - Coluna padrão para ordenação
 * @param {string} props.defaultSortOrder - Ordem padrão ('asc' ou 'desc')
 */
export default function DataTable({
  columns = [],
  data = [],
  actions = [],
  loading = false,
  emptyState,
  pagination = true,
  rowsPerPageOptions = [5, 10, 25],
  searchable = false,
  searchPlaceholder = 'Buscar...',
  onSearch,
  defaultSortBy,
  defaultSortOrder = 'asc',
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [orderBy, setOrderBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultSortOrder);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(0); // Reset to first page on search

    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle sort
  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Local search if no onSearch callback
    if (searchTerm && !onSearch) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.id];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Sort
    if (orderBy) {
      result.sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (typeof aValue === 'string') {
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return order === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return result;
  }, [data, searchTerm, orderBy, order, columns, onSearch]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    return processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [processedData, page, rowsPerPage, pagination]);

  // Format cell value
  const formatValue = (value, format) => {
    if (value == null) return '-';

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
      case 'datetime':
        return new Date(value).toLocaleString('pt-BR');
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      default:
        return value;
    }
  };

  // Render cell content
  const renderCell = (column, row) => {
    const value = row[column.id];

    if (column.render) {
      return column.render(value, row);
    }

    return formatValue(value, column.format);
  };

  // Empty state
  if (!loading && processedData.length === 0) {
    return (
      <Card>
        <EmptyState
          variant={searchTerm ? 'noResults' : 'noData'}
          {...emptyState}
        />
      </Card>
    );
  }

  // Mobile view (Cards)
  if (isMobile) {
    return (
      <Box sx={{ position: 'relative' }}>
        {/* Search */}
        {searchable && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {/* Loading Overlay */}
        {loading && <LoadingOverlay variant="section" />}

        {/* Cards */}
        <Stack spacing={2}>
          {paginatedData.map((row, index) => (
            <Card key={row.id || index} variant="outlined">
              <Box sx={{ p: 2 }}>
                {columns.map((column) => (
                  <Box key={column.id} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {column.label}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {renderCell(column, row)}
                    </Typography>
                  </Box>
                ))}

                {/* Actions */}
                {actions.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {actions.map((action, actionIndex) => (
                        <IconButton
                          key={actionIndex}
                          size="small"
                          onClick={() => action.onClick(row)}
                          color={action.color || 'default'}
                          disabled={action.disabled ? action.disabled(row) : false}
                          title={action.label}
                        >
                          {action.icon}
                        </IconButton>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </Card>
          ))}
        </Stack>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            component="div"
            count={processedData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{ mt: 2 }}
          />
        )}
      </Box>
    );
  }

  // Desktop view (Table)
  return (
    <Box sx={{ position: 'relative' }}>
      {/* Search */}
      {searchable && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </Box>
      )}

      {/* Table */}
      <TableContainer component={Card} sx={{ position: 'relative' }}>
        {/* Loading Overlay */}
        {loading && <LoadingOverlay variant="section" />}

        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 600 }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Ações
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow
                key={row.id || index}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {renderCell(column, row)}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      {actions.map((action, actionIndex) => (
                        <IconButton
                          key={actionIndex}
                          size="small"
                          onClick={() => action.onClick(row)}
                          color={action.color || 'default'}
                          disabled={action.disabled ? action.disabled(row) : false}
                          title={action.label}
                        >
                          {action.icon}
                        </IconButton>
                      ))}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            component="div"
            count={processedData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>
    </Box>
  );
}
