import React, { useState } from 'react';
import './App.css';

const defaultColumns = [
  { key: 'pos', label: 'Pos.', required: true },
  { key: 'bezeichnung', label: 'Bezeichnung', required: true },
  { key: 'menge', label: 'Menge', required: true },
  { key: 'einheit', label: 'Einheit', required: true },
  { key: 'ep', label: 'EP', calc: true, required: true },
  { key: 'gp', label: 'GP', calc: true, required: true },
  { key: 'stoffe', label: 'Stoffe-Kosten', color: '#eafbe7', required: true },
  { key: 'zeit', label: 'Zeit in min', color: '#eaf6fb', required: true },
  { key: 'epLoehne', label: 'EP Löhne', color: '#f7f7f7', calc: true, required: true },
];

const defaultRows = [
  {
    pos: '1',
    bezeichnung: 'Erdaushub u entsorgen',
    menge: 100,
    einheit: 'm3',
    stoffe: 5.0,
    zeit: 0.0,
  },
  {
    pos: '2',
    bezeichnung: 'Schotter einbauen',
    menge: 75,
    einheit: 'to',
    stoffe: 0.0,
    zeit: 0.0,
  },
  {
    pos: '3',
    bezeichnung: 'Verbundsteine liefern und verlegen',
    menge: 20,
    einheit: 'm2',
    stoffe: 0.0,
    zeit: 0.0,
  },
];

const unitOptions = [
  'm2', 'm3', 'm', 'kg', 'to', 'pcs', 'l', 'cm', 'mm', 'ft', 'yd', 'in', 'km', 'g', 'mg', 'piece', 'set', 'pack', 'hour', 'day', 'week', 'month', 'year'
];

function App() {
  const [role, setRole] = useState('admin');
  const [rows, setRows] = useState(defaultRows);
  const [columns, setColumns] = useState(defaultColumns);
  const [stundensatz, setStundensatz] = useState(60);
  const [editingBezeichnung, setEditingBezeichnung] = useState({ row: null });
  const mwstRate = 0.19;

  // Calculate all derived values for each row
  const calcRows = rows.map((row, idx) => {
    const stoffe = parseFloat(row.stoffe) || 0;
    const zeit = parseFloat(row.zeit) || 0;
    const menge = parseFloat(row.menge) || 0;
    const epLoehne = (parseFloat(stundensatz) / 60) * zeit;
    const ep = stoffe + epLoehne;
    const gp = menge * ep;
    return {
      ...row,
      epLoehne,
      ep,
      gp,
    };
  });
  const netto = calcRows.reduce((sum, row) => sum + (row.gp || 0), 0);
  const mwst = netto * mwstRate;
  const brutto = netto + mwst;

  const handleRowChange = (idx, field, value) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    setRows(newRows);
  };

  // Row management
  const handleAddRow = () => {
    const newRow = {};
    columns.forEach(col => {
      if (col.key === 'pos') newRow[col.key] = (rows.length + 1).toString();
      else if (col.key === 'menge' || col.key === 'stoffe' || col.key === 'zeit') newRow[col.key] = 0;
      else if (col.key === 'einheit') newRow[col.key] = unitOptions[0];
      else newRow[col.key] = '';
    });
    setRows([...rows, newRow]);
  };
  const handleRemoveRow = idx => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  // Column management
  const handleAddColumn = () => {
    const newKey = window.prompt('Spaltenname (key):');
    if (!newKey) return;
    const newLabel = window.prompt('Spaltenname (Label):', newKey);
    if (!newLabel) return;
    if (columns.find(col => col.key === newKey)) return;
    setColumns([...columns, { key: newKey, label: newLabel }]);
    setRows(rows.map(row => ({ ...row, [newKey]: '' })));
  };
  const handleRemoveColumn = key => {
    if (columns.find(col => col.key === key && col.required)) return;
    setColumns(columns.filter(col => col.key !== key));
    setRows(rows.map(row => {
      const newRow = { ...row };
      delete newRow[key];
      return newRow;
    }));
  };

  // Render cell
  const renderCell = (row, col, rowIdx) => {
    if (col.calc) {
      // Calculated fields
      if (col.key === 'epLoehne') return <span style={{ whiteSpace: 'nowrap' }}>{row.epLoehne.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>;
      if (col.key === 'ep') return <span style={{ whiteSpace: 'nowrap' }}>{row.ep.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>;
      if (col.key === 'gp') return <span style={{ whiteSpace: 'nowrap' }}>{row.gp.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>;
      return row[col.key];
    }
    if (col.key === 'stoffe' || col.key === 'zeit') {
      return (
        <input
          type="number"
          value={row[col.key]}
          onChange={e => handleRowChange(rowIdx, col.key, e.target.value)}
          style={{ width: 60 }}
          min={0}
          disabled={role !== 'admin' && role !== 'customer'}
        />
      );
    }
    if (col.key === 'menge') {
      return role === 'admin' ? (
        <input
          type="number"
          value={row.menge}
          onChange={e => handleRowChange(rowIdx, 'menge', e.target.value)}
          style={{ width: 80 }}
          min={0}
        />
      ) : (
        row.menge
      );
    }
    if (col.key === 'einheit') {
      return role === 'admin' ? (
        <select
          value={row.einheit}
          onChange={e => handleRowChange(rowIdx, 'einheit', e.target.value)}
          style={{ width: 70 }}
        >
          <option value="">choose</option>
          {unitOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        row.einheit
      );
    }
    if (col.key === 'pos') {
      return row[col.key];
    }
    if (col.key === 'bezeichnung') {
      if (role === 'admin') {
        if (editingBezeichnung.row === rowIdx) {
          return (
            <input
              type="text"
              value={row.bezeichnung}
              autoFocus
              onChange={e => handleRowChange(rowIdx, 'bezeichnung', e.target.value)}
              onBlur={() => setEditingBezeichnung({ row: null })}
              onKeyDown={e => {
                if (e.key === 'Enter') setEditingBezeichnung({ row: null });
              }}
              style={{ width: 180 }}
            />
          );
        } else {
          return (
            <span
              style={{ cursor: 'pointer', display: 'inline-block', minWidth: 120 }}
              onClick={() => setEditingBezeichnung({ row: rowIdx })}
              title="Zum Bearbeiten klicken"
            >
              {row.bezeichnung || <span style={{ color: '#aaa' }}>Bezeichnung eingeben</span>}
            </span>
          );
        }
      }
      return row.bezeichnung;
    }
    // For dynamic columns
    return role === 'admin' ? (
      <input
        type="text"
        value={row[col.key] || ''}
        onChange={e => handleRowChange(rowIdx, col.key, e.target.value)}
        style={{ width: 80 }}
      />
    ) : (
      row[col.key]
    );
  };

  return (
    <div className="App">
      <h1>Kalkulation</h1>
      <div className="role-selector">
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="role"
            value="admin"
            checked={role === 'admin'}
            onChange={() => setRole('admin')}
          /> Admin
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="customer"
            checked={role === 'customer'}
            onChange={() => setRole('customer')}
          /> Customer
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <table style={{ minWidth: 320, maxWidth: 400, border: '1px solid #ccc', borderRadius: 8 }}>
            <tbody>
              <tr><td>Netto Angebotssumme</td><td style={{ textAlign: 'right', minWidth: 110 }}><span style={{ whiteSpace: 'nowrap' }}>{netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></td></tr>
              <tr><td>MwSt.: <span style={{ fontWeight: 500 }}>{mwstRate * 100}%</span></td><td style={{ textAlign: 'right', minWidth: 110 }}><span style={{ whiteSpace: 'nowrap' }}>{mwst.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></td></tr>
              <tr style={{ fontWeight: 600 }}><td>Brutto Angebotssumme</td><td style={{ textAlign: 'right', minWidth: 110 }}><span style={{ whiteSpace: 'nowrap' }}>{brutto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontWeight: 500 }}>
          Stundensatz: {role === 'admin' || role === 'customer' ? (
            <input
              type="number"
              value={stundensatz}
              onChange={e => setStundensatz(e.target.value)}
              style={{ width: 80, marginLeft: 8 }}
              min={0}
            />
          ) : (
            <span style={{ marginLeft: 8 }}>{stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
          )}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{ background: col.color, minWidth: col.key === 'ep' || col.key === 'gp' || col.key === 'epLoehne' ? 110 : undefined, position: 'relative' }}>
                  {col.label}
                  {role === 'admin' && !col.required && (
                    <button
                      className="delete-x-btn"
                      style={{ marginLeft: 4, color: '#d32f2f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1em', verticalAlign: 'middle' }}
                      title="Spalte entfernen"
                      onClick={() => handleRemoveColumn(col.key)}
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
              {role === 'admin' && (
                <th style={{ width: 32, textAlign: 'center' }}>
                  <button
                    className="add-btn"
                    style={{ color: '#1b8a3a', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.6em', verticalAlign: 'middle', opacity: 1 }}
                    title="Spalte hinzufügen"
                    onClick={handleAddColumn}
                  >
                    +
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {calcRows.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} style={{ background: col.color, minWidth: col.key === 'ep' || col.key === 'gp' || col.key === 'epLoehne' ? 110 : undefined }}>
                    {renderCell(row, col, i)}
                  </td>
                ))}
                {role === 'admin' && (
                  <td style={{ width: 32, textAlign: 'center' }}>
                    <button
                      className="delete-x-btn"
                      style={{ color: '#d32f2f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1em', verticalAlign: 'middle' }}
                      title="Zeile entfernen"
                      onClick={() => handleRemoveRow(i)}
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {role === 'admin' && (
          <button
            className="add-btn"
            style={{
              color: '#1b8a3a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.6em',
              position: 'absolute',
              left: 0,
              bottom: -36,
              zIndex: 2
            }}
            title="Zeile hinzufügen"
            onClick={handleAddRow}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
