// src/utils/csvExport.js
export const exportToCSV = (data, headers, filename) => {
  // Preparar los encabezados
  const headerRow = headers.map((h) => `"${h.label}"`).join(",");

  // Preparar las filas de datos
  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value = header.getter(item);
        // Envolver en comillas y escapar las comillas dentro del valor
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  // Combinar encabezados y filas
  const csv = [headerRow, ...rows].join("\n");

  // Crear Blob y descargar
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
