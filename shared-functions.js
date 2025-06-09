// FUNCIÓN AUXILIAR para extraer y formatear fecha (versión cliente)
function extractAndFormatDate_ddMMyyyy(dateStringWithText) {
  if (!dateStringWithText || typeof dateStringWithText !== "string")
    return null;
  const match = dateStringWithText.match(
    /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/
  );
  if (match) {
    const dia = match[1].padStart(2, "0");
    const mes = match[2].padStart(2, "0");
    let anio = match[3];
    if (anio.length === 2) {
      anio = "20" + anio;
    } else if (anio.length === 3 && !isNaN(parseInt(anio))) {
      anio = "2" + anio;
    }
    const diaInt = parseInt(dia, 10);
    const mesInt = parseInt(mes, 10);
    const anioInt = parseInt(anio, 10);
    if (
      diaInt > 0 &&
      diaInt <= 31 &&
      mesInt > 0 &&
      mesInt <= 12 &&
      anioInt >= 2000 &&
      anioInt <= 2100
    ) {
      const diasEnMes = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (diaInt <= diasEnMes[mesInt]) {
        return `${dia}/${mes}/${anio}`;
      }
    }
  }
  return null;
}

// FUNCIÓN AUXILIAR para convertir string de fecha a objeto Date (versión cliente)
function parseDateStringHelper(dateStringWithPossibleText) {
  const extractedDateStr = extractAndFormatDate_ddMMyyyy(
    dateStringWithPossibleText
  );
  if (!extractedDateStr) return null;
  const parts = extractedDateStr.split("/");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mes en JS es 0-indexado
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const dateObj = new Date(year, month, day);
  if (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month &&
    dateObj.getDate() === day
  ) {
    dateObj.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones
    return dateObj;
  }
  return null;
}
