/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Check, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AccountRecord } from '../types';

interface FileCardProps {
  fileName: string;
  rowCount: number;
  onFileLoaded: (records: AccountRecord[], fileName: string) => void;
  onShowNotification: (message: string, isError?: boolean) => void;
}

export default function FileCard({ fileName, rowCount, onFileLoaded, onShowNotification }: FileCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);
    onShowNotification(`Reading spreadsheet: ${file.name}...`);

    try {
      const reader = new FileReader();
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            if (!data) throw new Error("Could not read file binary stream");
            
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON array of arrays
            const jsonRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            
            const firstRow = jsonRows[0] || [];
            const col0Str = String(firstRow[0] || '').toLowerCase().trim();
            const col1Str = String(firstRow[1] || '').toLowerCase().trim();
            const isHeader = col0Str.includes('id') || col0Str.includes('user') || col0Str.includes('account') || 
                             col1Str.includes('pass') || col1Str.includes('pw') || col1Str.includes('password');
            
            const dataRows = isHeader ? jsonRows.slice(1) : jsonRows;

            const parsedRecords: AccountRecord[] = dataRows
              .filter(row => row && row.length > 0 && row[0] !== undefined && row[0] !== null)
              .map((row, idx) => {
                const idValue = String(row[0]).trim();
                const pwValue = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : idValue;
                
                // Read every column starting from index 2 (Column C) onward to courses[] array
                const coursesList: string[] = [];
                for (let k = 2; k < row.length; k++) {
                  if (row[k] !== undefined && row[k] !== null) {
                    const strVal = String(row[k]).trim();
                    if (strVal) {
                      coursesList.push(strVal);
                    }
                  }
                }
                
                if (coursesList.length === 0) {
                  coursesList.push("HSC ICT Full Course [HSC'27] New Batch");
                }

                return {
                  id: idValue,
                  password: pwValue,
                  courses: coursesList
                };
              });

            if (parsedRecords.length === 0) {
              throw new Error("No valid accounts structure could be extracted from spreadsheet.");
            }

            onFileLoaded(parsedRecords, file.name);
            onShowNotification(`✓ Successfully loaded ${parsedRecords.length} accounts from ${file.name}!`);
          } catch (err: any) {
            onShowNotification(`Upload Error: ${err?.message || "Invalid file content"}`, true);
          } finally {
            setIsProcessing(false);
          }
        };

        reader.readAsBinaryString(file);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            if (!text) throw new Error("File empty");

            const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
            if (lines.length < 1) throw new Error("No content lines found.");

            const isHeader = lines[0] && (
              lines[0].toLowerCase().includes('id') || 
              lines[0].toLowerCase().includes('password') || 
              lines[0].toLowerCase().includes('user')
            );
            const dataLines = isHeader ? lines.slice(1) : lines;

            const parsedRecords: AccountRecord[] = [];
            dataLines.forEach((line, index) => {
              // Try comma-separated, tab-separated, space-separated, colon-separated
              let parts = line.split(',');
              if (parts.length < 2) parts = line.split('\t');
              if (parts.length < 2) parts = line.split(':');
              if (parts.length < 2) parts = line.split('|');

              const id = parts[0]?.trim() || `ID_${index + 1}`;
              const password = parts[1]?.trim() || id;
              const courses: string[] = [];
              for (let k = 2; k < parts.length; k++) {
                const val = parts[k]?.trim();
                if (val) {
                  courses.push(val);
                }
              }

              if (courses.length === 0) {
                courses.push("General Course Batch");
              }

              parsedRecords.push({ id, password, courses });
            });

            onFileLoaded(parsedRecords, file.name);
            onShowNotification(`✓ Loaded ${parsedRecords.length} records from ${file.name}`);
          } catch (err: any) {
            onShowNotification(`Upload Error: ${err?.message || "Invalid file content"}`, true);
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsText(file);
      } else {
        throw new Error("Unsupported file format. Please upload .xlsx, .xls, .csv, or .txt");
      }
    } catch (err: any) {
      onShowNotification(err.message, true);
      setIsProcessing(false);
    }

    // Reset input value to allow uploading same file again
    event.target.value = '';
  };

  return (
    <div 
      className="rounded-[20px] p-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.85)] backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col gap-3 group transition-transform duration-300 hover:scale-[1.01]" 
      id="file-status-card"
    >
      <div className="flex items-center justify-between" id="file-card-top">
        <div className="flex items-center gap-3.5" id="file-card-info">
          {/* Circular Glass Folder Icon Badge */}
          <div className="w-[45px] h-[45px] rounded-xl bg-purple-600/15 flex items-center justify-center border border-purple-500/20 text-[#A855F7] shadow-inner" id="file-icon-badge">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#A0AEC0] tracking-wider uppercase" id="selected-file-label">
              Selected File
            </div>
            <div className="text-lg font-bold text-white tracking-tight mt-0.5" id="selected-file-name">
              {fileName}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="change-file-btn"
          disabled={isProcessing}
          onClick={handleButtonClick}
          className="px-4 py-2 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-600/20 hover:border-purple-500/50 active:scale-95 disabled:opacity-50 transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(109,59,255,0.1)]"
        >
          {isProcessing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          {isProcessing ? 'Processing...' : 'Change File'}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv,.txt"
        className="hidden"
        id="hidden-file-picker"
      />

      <div className="h-[px] w-full bg-[rgba(255,255,255,0.06)]" />

      {/* Bottom status labels */}
      <div className="flex items-center justify-between text-xs text-[#A0AEC0] font-medium" id="file-card-bottom-status">
        <div className="flex items-center gap-1.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" id="success-status-indicator">
          <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>File loaded successfully</span>
        </div>
        <div className="flex items-center gap-1.5" id="row-count-status">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
          <span>{rowCount.toLocaleString()} rows</span>
        </div>
      </div>
    </div>
  );
}
