/**
 * EHR Data Management Page
 * 
 * View and manage Electronic Health Records
 * Import data, view history, track admissions/discharges
 */

import { useState, useEffect, useRef } from 'react';
import { Database, Upload, Calendar, TrendingUp, TrendingDown, Activity, Download, X, AlertCircle, CheckCircle } from 'lucide-react';
import { getHospitals, getEHRRecords, createEHRRecord } from '../services/api';

const EHRData = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospitalId) {
      loadRecords(selectedHospitalId);
    }
  }, [selectedHospitalId, dateRange]); // Add dateRange dependency

  const loadHospitals = async () => {
    try {
      const data = await getHospitals();
      setHospitals(data);
      if (data.length > 0) {
        setSelectedHospitalId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load hospitals:', error);
    }
  };

  const loadRecords = async (hospitalId) => {
    setLoading(true);
    try {
      const data = await getEHRRecords(hospitalId);
      
      // Filter records by date range
      if (data && data.length > 0) {
        const days = parseInt(dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const filteredData = data.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= cutoffDate;
        });
        
        console.log(`Filtered ${data.length} records to ${filteredData.length} records for last ${days} days`);
        setRecords(filteredData);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Failed to load EHR records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (records.length === 0) return { totalAdmissions: 0, totalDischarges: 0, avgOccupancy: 0 };
    
    const totalAdmissions = records.reduce((sum, r) => sum + (r.admissions || 0), 0);
    const totalDischarges = records.reduce((sum, r) => sum + (r.discharges || 0), 0);
    const avgOccupancy = Math.round(records.reduce((sum, r) => sum + (r.occupied_beds || 0), 0) / records.length);
    
    return { totalAdmissions, totalDischarges, avgOccupancy };
  };

  const handleExport = () => {
    if (records.length === 0) {
      alert('No data to export');
      return;
    }

    // Convert records to CSV format
    const headers = ['Date', 'Admissions', 'Discharges', 'Occupied Beds', 'ICU Occupied', 'Emergency Cases'];
    const csvRows = [headers.join(',')];

    records.forEach(record => {
      const row = [
        record.date,
        record.admissions,
        record.discharges,
        record.occupied_beds,
        record.icu_occupied,
        record.emergency_cases
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const hospitalName = hospitals.find(h => h.id === selectedHospitalId)?.hospital_name || 'hospital';
    link.download = `${hospitalName.replace(/\s+/g, '_')}_EHR_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    const isCsv = file && file.name.toLowerCase().endsWith('.csv');
    if (isCsv) {
      setImportFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDownloadTemplate = () => {
    const templateHeaders = 'Date,Admissions,Discharges,Occupied Beds,ICU Occupied,Emergency Cases';
    const templateRows = [
      '2026-02-12,28,24,172,19,11',
      '2026-02-13,30,26,176,20,12'
    ];
    const csvContent = [templateHeaders, ...templateRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehr_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record = {};
      
      headers.forEach((header, index) => {
        if (header.includes('date')) record.date = values[index];
        else if (header.includes('admission')) record.admissions = parseInt(values[index]) || 0;
        else if (header.includes('discharge')) record.discharges = parseInt(values[index]) || 0;
        else if (header.includes('occupied') && !header.includes('icu')) record.occupied_beds = parseInt(values[index]) || 0;
        else if (header.includes('icu')) record.icu_occupied = parseInt(values[index]) || 0;
        else if (header.includes('emergency')) record.emergency_cases = parseInt(values[index]) || 0;
      });
      
      if (record.date) {
        records.push(record);
      }
    }
    
    return records;
  };

  const handleImport = async () => {
    if (!importFile || !selectedHospitalId) {
      alert('Please select a hospital and file');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const text = await importFile.text();
      const parsedRecords = parseCSV(text);
      
      let successful = 0;
      let failed = 0;
      const errors = [];

      for (const record of parsedRecords) {
        try {
          await createEHRRecord({
            hospital_id: selectedHospitalId,
            date: record.date,
            admissions: record.admissions || 0,
            discharges: record.discharges || 0,
            occupied_beds: record.occupied_beds || 0,
            icu_occupied: record.icu_occupied || 0,
            emergency_cases: record.emergency_cases || 0
          });
          successful++;
        } catch (error) {
          failed++;
          errors.push(`${record.date}: ${error.response?.data?.detail || error.message}`);
        }
      }

      setImportResults({ successful, failed, errors, total: parsedRecords.length });
      
      if (successful > 0) {
        // Reload records
        await loadRecords(selectedHospitalId);
      }
    } catch (error) {
      alert('Failed to parse CSV file: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = calculateStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">EHR Data</h1>
          <p className="text-gray-600">Electronic Health Records and patient flow data</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={records.length === 0}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Export Data
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Import Data
          </button>
        </div>
      </div>

      {/* Hospital Selector and Date Range */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital</label>
            <select
              value={selectedHospitalId || ''}
              onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.hospital_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Total Admissions</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalAdmissions}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Total Discharges</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalDischarges}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Avg Occupancy</div>
              <div className="text-3xl font-bold text-gray-900">{stats.avgOccupancy}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Records</div>
              <div className="text-3xl font-bold text-gray-900">{records.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* EHR Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Records</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-600 mb-6">Start by importing EHR data for this hospital</p>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Import Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admissions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discharges</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Occupancy</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.slice(0, 20).map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-900">{record.admissions}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900">{record.discharges}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{record.occupied_beds}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.occupied_beds > 200 ? 'bg-red-100 text-red-800' :
                        record.occupied_beds > 150 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {record.occupied_beds > 200 ? 'Critical' : record.occupied_beds > 150 ? 'High' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Import EHR Data</h2>
                <p className="text-sm text-gray-600 mt-1">Upload CSV file with patient records</p>
              </div>
              <button
                onClick={closeImportModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Hospital Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Hospital <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedHospitalId || ''}
                  onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  disabled={importing}
                >
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.hospital_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CSV File <span className="text-red-600">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-sky-500 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={importing}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Click to upload
                  </label>
                  <span className="text-gray-600"> or drag and drop</span>
                  <p className="text-sm text-gray-500 mt-2">CSV files only</p>
                  {importFile && (
                    <div className="mt-4 p-3 bg-sky-50 rounded-lg inline-flex items-center gap-2">
                      <Database className="w-5 h-5 text-sky-600" />
                      <span className="text-sm font-medium text-sky-900">{importFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CSV Format Info */}
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-4 border border-sky-100">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-gray-900">CSV Format Requirements</h3>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-sky-300 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Template
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-2">Your CSV file should have these columns:</p>
                <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-800">
                  Date, Admissions, Discharges, Occupied Beds, ICU Occupied, Emergency Cases
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-semibold">Example:</span> 2026-01-30, 15, 12, 180, 25, 8
                </p>
              </div>

              {/* Import Results */}
              {importResults && (
                <div className={`rounded-xl p-4 border-2 ${
                  importResults.failed === 0 
                    ? 'bg-green-50 border-green-200' 
                    : importResults.successful === 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {importResults.failed === 0 ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">Import Results</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">
                          <span className="font-semibold">Total records:</span> {importResults.total}
                        </p>
                        <p className="text-green-700">
                          <span className="font-semibold">Successful:</span> {importResults.successful}
                        </p>
                        {importResults.failed > 0 && (
                          <>
                            <p className="text-red-700">
                              <span className="font-semibold">Failed:</span> {importResults.failed}
                            </p>
                            {importResults.errors.length > 0 && (
                              <div className="mt-2 max-h-32 overflow-y-auto">
                                <p className="font-semibold text-gray-700 mb-1">Errors:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                  {importResults.errors.slice(0, 5).map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                  ))}
                                  {importResults.errors.length > 5 && (
                                    <li>... and {importResults.errors.length - 5} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeImportModal}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                disabled={importing}
              >
                {importResults ? 'Close' : 'Cancel'}
              </button>
              {!importResults && (
                <button
                  onClick={handleImport}
                  disabled={!importFile || !selectedHospitalId || importing}
                  className="px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Import Data
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EHRData;
