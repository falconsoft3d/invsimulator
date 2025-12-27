"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, Settings, RefreshCw, Eye, ChevronLeft, ChevronRight, Download, Upload, EyeOff, ArrowUp, ArrowDown, ArrowUpDown, Trash2 } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"

interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  searchable?: boolean
}

interface TableTemplateProps<T> {
  title: string
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  newRecordUrl?: string
  newRecordLabel?: string
  onRefresh?: () => void
  itemsPerPage?: number
  getItemId: (item: T) => string
  getEditUrl?: (item: T) => string
  onCreate?: () => void
  onEdit?: (item: T) => void
  isServerSide?: boolean
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onSearch?: (term: string) => void
  actions?: (item: T) => React.ReactNode
  onRowClick?: (item: T) => void
  onBulkDelete?: (selectedIds: string[]) => Promise<void>
}

export default function TableTemplate<T>({
  title,
  data,
  columns,
  searchPlaceholder = "Buscar...",
  newRecordUrl,
  newRecordLabel = "New record",
  onRefresh,
  itemsPerPage = 10,
  getItemId,
  getEditUrl,
  onCreate,
  onEdit,
  isServerSide = false,
  totalItems = 0,
  currentPage: propCurrentPage = 1,
  onPageChange,
  onSearch,
  actions,
  onRowClick,
  onBulkDelete,
}: TableTemplateProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(propCurrentPage)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(c => c.key))
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const columnSettingsRef = useRef<HTMLDivElement>(null)

  // Sync propCurrentPage with state
  useEffect(() => {
    setCurrentPage(propCurrentPage)
  }, [propCurrentPage])

  // Limpiar selección cuando cambian los datos o pagina
  useEffect(() => {
    setSelectedIds([])
  }, [data, currentPage, searchTerm])

  // Cargar columnas visibles desde localStorage
  useEffect(() => {
    const storageKey = `tableColumns_${title.replace(/\s+/g, '_')}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const validColumns = parsed.filter((key: string) => columns.some(c => c.key === key))
        if (validColumns.length > 0) {
          setVisibleColumns(validColumns)
        }
      } catch (e) {
        console.error('Error parsing saved columns:', e)
      }
    }
  }, [title, columns])

  // Guardar columnas visibles en localStorage
  useEffect(() => {
    const storageKey = `tableColumns_${title.replace(/\s+/g, '_')}`
    localStorage.setItem(storageKey, JSON.stringify(visibleColumns))
  }, [visibleColumns, title])

  // Cerrar dropdown de columnas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSettingsRef.current && !columnSettingsRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false)
      }
    }

    if (showColumnSettings) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnSettings])

  // Filtrar datos según búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    return data.filter((item) => {
      return columns.some((column) => {
        if (column.searchable === false) return false
        const value = (item as any)[column.key]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })
    })
  }, [data, searchTerm, columns])

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortColumn]
      const bValue = (b as any)[sortColumn]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortDirection === "asc") {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
      }
    })
  }, [filteredData, sortColumn, sortDirection])

  // Ensure itemsPerPage is a number
  const safeItemsPerPage = Number(itemsPerPage) || 10

  // Clacular paginación
  const totalPages = isServerSide
    ? Math.ceil(totalItems / safeItemsPerPage)
    : Math.ceil(sortedData.length / safeItemsPerPage)

  const startIndex = (currentPage - 1) * safeItemsPerPage
  const endIndex = startIndex + safeItemsPerPage
  const paginatedData = isServerSide ? data : sortedData.slice(startIndex, endIndex)

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (isServerSide && onSearch) {
      onSearch(value)
    } else {
      setCurrentPage(1)
    }
  }

  const goToPage = (page: number) => {
    const targetPage = Number(page)
    if (targetPage >= 1 && targetPage <= totalPages) {
      if (isServerSide && onPageChange) {
        onPageChange(targetPage)
      } else {
        setCurrentPage(targetPage)
      }
    }
  }

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => {
      const row: any = {}
      columns.forEach((column) => {
        if (visibleColumns.includes(column.key)) {
          const value = (item as any)[column.key]
          row[column.label] = value !== null && value !== undefined ? String(value) : ""
        }
      })
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, title)
    XLSX.writeFile(workbook, `${title}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result
        const workbook = XLSX.read(binaryStr, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        alert(`Se importaron ${jsonData.length} registros. Revisa la consola.`)
      } catch (error) {
        console.error("Error al importar:", error)
        alert("Error al importar el archivo Excel")
      }
    }
    reader.readAsBinaryString(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((k) => k !== columnKey) : [...prev, columnKey]
    )
  }

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = paginatedData.map(item => getItemId(item))
      setSelectedIds(ids)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedIds.length > 0) {
      if (confirm(`¿Estás seguro de eliminar ${selectedIds.length} elementos seleccionados?`)) {
        await onBulkDelete(selectedIds)
        setSelectedIds([])
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Collections</h1>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-2">

          {/* Botón de Borrado Masivo */}
          {onBulkDelete && selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors mr-2"
            >
              <Trash2 size={16} />
              Eliminar ({selectedIds.length})
            </button>
          )}

          <div className="relative" ref={columnSettingsRef}>
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Configurar columnas"
            >
              <Settings size={18} />
            </button>

            {showColumnSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Columnas visibles</h3>
                </div>
                <div className="p-2 max-h-96 overflow-y-auto">
                  {columns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">{column.label}</span>
                      {visibleColumns.includes(column.key) ? (
                        <Eye size={14} className="ml-auto text-gray-400" />
                      ) : (
                        <EyeOff size={14} className="ml-auto text-gray-400" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExportExcel}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Exportar a Excel"
          >
            <Download size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Importar desde Excel"
          >
            <Upload size={18} />
          </button>

          {onCreate ? (
            <button
              onClick={onCreate}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              {newRecordLabel}
            </button>
          ) : newRecordUrl ? (
            <Link
              href={newRecordUrl}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              {newRecordLabel}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-900"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    onChange={handleSelectAll}
                    checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                  />
                </th>
                {columns.filter(col => visibleColumns.includes(col.key)).map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {sortColumn === column.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((item) => {
                const itemId = getItemId(item)
                const isSelected = selectedIds.includes(itemId)
                const editUrl = getEditUrl ? getEditUrl(item) : undefined

                return (
                  <tr
                    key={itemId}
                    className={`hover:bg-gray-50 transition-colors group cursor-pointer ${isSelected ? 'bg-purple-50' : ''}`}
                    onClick={() => {
                      if (onRowClick) {
                        onRowClick(item)
                      } else if (onEdit) {
                        onEdit(item)
                      } else if (editUrl) {
                        window.location.href = editUrl
                      }
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        checked={isSelected}
                        onChange={() => handleSelectRow(itemId)}
                      />
                    </td>
                    {columns.filter(col => visibleColumns.includes(col.key)).map((column) => (
                      <td key={column.key} className="px-4 py-3 text-gray-900">
                        {column.render(item)}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 text-right">
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {paginatedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {searchTerm ? "No se encontraron resultados" : "No hay registros"}
            </p>
          </div>
        )}

        {/* Footer with pagination */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
          <span>
            {isServerSide
              ? `Total found: ${totalItems}`
              : `Total found: ${filteredData.length} ${searchTerm && `(filtrado de ${data.length})`}`
            }
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  goToPage(currentPage - 1)
                }}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {totalPages <= 10 ? (
                  // Show all pages if 10 or fewer
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        goToPage(page)
                      }}
                      className={`px-2 py-1 rounded text-xs ${currentPage === page
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-200"
                        }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  // Truncate if more than 10
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            goToPage(page)
                          }}
                          className={`px-2 py-1 rounded text-xs ${currentPage === page
                            ? "bg-gray-900 text-white"
                            : "hover:bg-gray-200"
                            }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={`dots-${page}`} className="px-1 text-gray-400">...</span>
                    }
                    return null
                  })
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  goToPage(currentPage + 1)
                }}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div >
  )
}
