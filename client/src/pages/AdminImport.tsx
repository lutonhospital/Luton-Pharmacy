import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileCheck, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: any[];
}

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.replace(/"/g, '') || '';
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);
      setProgress(10);

      const csvText = await file.text();
      setProgress(30);

      const csvData = parseCSV(csvText);
      setProgress(50);

      if (csvData.length === 0) {
        throw new Error("No valid data found in CSV file");
      }

      console.log(`Parsed ${csvData.length} rows from CSV`);
      setProgress(70);

      const response = await apiRequest("POST", "/api/admin/import-products", { csvData });
      const data = await response.json();

      setProgress(100);
      setResult(data.results);

      toast({
        title: "Import completed",
        description: data.message,
      });

    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Pharmaceutical Products
            </CardTitle>
            <CardDescription>
              Upload a CSV file with pharmaceutical product data to bulk import into the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importing}
                data-testid="input-csv-file"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileCheck className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {importing && (
              <div className="space-y-2">
                <Label>Import Progress</Label>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">Processing CSV data...</p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full"
                data-testid="button-import"
              >
                {importing ? "Importing..." : "Import Products"}
              </Button>

              {result && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import Summary:</p>
                      <ul className="text-sm space-y-1">
                        <li>✅ {result.imported} products imported successfully</li>
                        <li>⏭️ {result.skipped} products skipped</li>
                        <li>❌ {result.errors.length} errors encountered</li>
                      </ul>
                      {result.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-red-600">
                            View errors ({result.errors.length})
                          </summary>
                          <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                            {result.errors.slice(0, 5).map((error, index) => (
                              <div key={index} className="p-2 bg-red-50 rounded text-red-700">
                                Row {index + 1}: {error.error}
                              </div>
                            ))}
                            {result.errors.length > 5 && (
                              <p className="text-gray-500 mt-1">
                                And {result.errors.length - 5} more errors...
                              </p>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Expected CSV Format:</p>
                <div className="text-sm mt-1 space-y-1">
                  <p>Required columns: <code>Product_Name</code>, <code>Price</code></p>
                  <p>Optional columns: <code>Description</code>, <code>Image</code>, <code>Collection</code></p>
                  <p>The system will automatically extract dosage information and categorize products.</p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}