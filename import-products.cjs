// Direct import script for pharmaceutical products
const fs = require('fs');

// Helper functions
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/"/g, ''));

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  return rows;
}

function cleanPrice(priceStr) {
  if (!priceStr || priceStr === '0') return 0;
  const cleaned = priceStr.replace(/[",]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

function mapCategory(collection) {
  const c = (collection || '').toLowerCase();
  if (c.includes('vitamin') || c.includes('supplement')) return 'vitamins_supplements';
  if (c.includes('prescription') || c.includes('rx')) return 'prescription_medicines';
  if (c.includes('first aid') || c.includes('emergency')) return 'first_aid';
  if (c.includes('baby') || c.includes('infant')) return 'baby_care';
  if (c.includes('device') || c.includes('equipment')) return 'medical_devices';
  if (c.includes('personal') || c.includes('hygiene')) return 'personal_care';
  return 'over_the_counter';
}

function extractDosage(productName) {
  const match = productName.match(/(\d+(?:\.\d+)?)\s?(mg|ml|g|mcg|iu|cc|%)/i);
  return match ? match[0] : 'N/A';
}

// Read and process CSV file
const csvPath = './attached_assets/Pharmacy Masterfile 3_1758793665828.csv';

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found at:', csvPath);
  process.exit(1);
}

const csvText = fs.readFileSync(csvPath, 'utf8');
const csvData = parseCSV(csvText);

console.log(`Loaded ${csvData.length} products from CSV`);

// Convert to SQL INSERT statements
const insertStatements = [];
let successCount = 0;

csvData.forEach((row, index) => {
  try {
    const productName = row['Product_Name'] || row['Product Name'];
    const price = row['Price'];
    
    if (!productName || !price) {
      console.log(`Skipping row ${index + 1}: missing name or price`);
      return;
    }

    const medicationName = productName.trim().replace(/'/g, "''"); // Escape quotes
    const dosage = extractDosage(productName);
    const description = (row['Description'] || '').trim().replace(/'/g, "''");
    const category = mapCategory(row['Collection'] || row['SuperCollection']);
    const imageUrl = row['Image'] || 'https://i.postimg.cc/s24h1HsW/pharma-1.png';
    const unitPrice = cleanPrice(price);

    const sql = `
INSERT INTO inventory (
  medication_name, 
  dosage, 
  description, 
  category, 
  image_url, 
  is_active, 
  requires_prescription, 
  current_stock, 
  minimum_stock, 
  unit_price, 
  original_price, 
  supplier
) VALUES (
  '${medicationName}',
  '${dosage}',
  '${description}',
  '${category}',
  '${imageUrl}',
  true,
  false,
  100,
  10,
  ${unitPrice},
  ${unitPrice},
  'Luton Hospital'
);`;

    insertStatements.push(sql);
    successCount++;
  } catch (error) {
    console.error(`Error processing row ${index + 1}:`, error.message);
  }
});

// Write SQL file
const sqlOutput = insertStatements.join('\n\n');
fs.writeFileSync('./import-products.sql', sqlOutput);

console.log(`\nGenerated SQL import file with ${successCount} products`);
console.log('Run: psql $DATABASE_URL -f import-products.sql');
console.log('Or use the execute_sql_tool to run the statements');

// Also create a JSON file for the API import
const jsonData = csvData.slice(0, 100).map(row => {
  const productName = row['Product_Name'] || row['Product Name'];
  const price = row['Price'];
  
  if (!productName || !price) return null;
  
  return {
    'Product_Name': productName,
    'Price': price,
    'Description': row['Description'] || '',
    'Image': row['Image'] || 'https://i.postimg.cc/s24h1HsW/pharma-1.png',
    'Collection': row['Collection'] || row['SuperCollection'] || 'Luton Hospital'
  };
}).filter(Boolean);

fs.writeFileSync('./sample-products.json', JSON.stringify(jsonData, null, 2));
console.log(`Also created sample-products.json with first 100 products for testing`);