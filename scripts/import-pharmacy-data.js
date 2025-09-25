// Script to import pharmaceutical data from CSV
const fs = require('fs');
const path = require('path');

// Function to parse CSV data
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
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
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/"/g, '') || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

// Function to clean price and convert to decimal
function cleanPrice(priceStr) {
  if (!priceStr || priceStr === '0') return 0;
  const cleaned = priceStr.replace(/[",]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

// Function to map category
function mapCategory(collection) {
  const collectionLower = (collection || '').toLowerCase();
  if (collectionLower.includes('vitamin') || collectionLower.includes('supplement')) {
    return 'vitamins_supplements';
  }
  if (collectionLower.includes('prescription') || collectionLower.includes('rx')) {
    return 'prescription_medicines';
  }
  if (collectionLower.includes('first aid') || collectionLower.includes('emergency')) {
    return 'first_aid';
  }
  if (collectionLower.includes('baby') || collectionLower.includes('infant')) {
    return 'baby_care';
  }
  if (collectionLower.includes('device') || collectionLower.includes('equipment')) {
    return 'medical_devices';
  }
  if (collectionLower.includes('personal') || collectionLower.includes('hygiene')) {
    return 'personal_care';
  }
  return 'over_the_counter';
}

// Function to extract dosage from product name
function extractDosage(productName) {
  const dosageMatch = productName.match(/(\d+(?:\.\d+)?)\s?(mg|ml|g|mcg|iu|cc|%)/i);
  return dosageMatch ? dosageMatch[0] : 'N/A';
}

// Function to send data to API in batches
async function uploadBatch(csvData, batchSize = 50) {
  const batches = [];
  for (let i = 0; i < csvData.length; i += batchSize) {
    batches.push(csvData.slice(i, i + batchSize));
  }

  console.log(`Uploading ${csvData.length} products in ${batches.length} batches...`);

  let totalImported = 0;
  let totalErrors = 0;

  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1}/${batches.length}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/admin/import-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'connect.sid=your-session-id' // You'll need to get this from browser
        },
        body: JSON.stringify({ csvData: batches[i] })
      });

      if (response.ok) {
        const result = await response.json();
        totalImported += result.results.imported;
        totalErrors += result.results.errors.length;
        console.log(`Batch ${i + 1}: ${result.results.imported} imported, ${result.results.errors.length} errors`);
      } else {
        console.error(`Batch ${i + 1} failed: ${response.statusText}`);
        totalErrors += batches[i].length;
      }
    } catch (error) {
      console.error(`Batch ${i + 1} error:`, error.message);
      totalErrors += batches[i].length;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nImport completed:`);
  console.log(`Total imported: ${totalImported}`);
  console.log(`Total errors: ${totalErrors}`);
}

// Main function
async function main() {
  try {
    const csvPath = path.join(__dirname, '../attached_assets/Pharmacy Masterfile 3_1758793665828.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at:', csvPath);
      return;
    }

    const csvText = fs.readFileSync(csvPath, 'utf8');
    console.log('CSV file loaded successfully');

    const csvData = parseCSV(csvText);
    console.log(`Parsed ${csvData.length} products from CSV`);

    if (csvData.length === 0) {
      console.error('No valid data found in CSV');
      return;
    }

    // Sample the first few rows for validation
    console.log('\nFirst few products:');
    csvData.slice(0, 3).forEach((row, index) => {
      console.log(`${index + 1}. ${row.Product_Name} - KES ${cleanPrice(row.Price)}`);
    });

    console.log('\nStarting upload...');
    await uploadBatch(csvData);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseCSV, cleanPrice, mapCategory, extractDosage };