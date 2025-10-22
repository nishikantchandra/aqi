# 🔧 Troubleshooting Guide - CSV Upload Issues

## ❌ Error: "No valid data found. Please check your CSV format."

### Quick Fix Steps:

1. **Open Browser Console**
   - Press `F12` (Windows) or `Cmd+Option+I` (Mac)
   - Click on "Console" tab
   - Try uploading your file again
   - Look at the detailed logs

2. **Check Your CSV Format**

### ✅ Correct CSV Format Examples:

**Option 1: Standard Format**
```csv
Timestamp,PM2.5
2025-01-01 00:00:00,25.3
2025-01-01 01:00:00,23.7
2025-01-01 02:00:00,21.2
```

**Option 2: Alternative Column Names**
```csv
Date,PM25
2025-01-01 00:00:00,25.3
2025-01-01 01:00:00,23.7
```

**Option 3: Lowercase**
```csv
datetime,pm2.5
2025-01-01 00:00:00,25.3
2025-01-01 01:00:00,23.7
```

**Option 4: Different Date Format**
```csv
Date,PM2.5
01/01/2025 00:00,25.3
01/01/2025 01:00,23.7
```

### 🔍 What the App Looks For:

**For Date/Time Column:**
- Any column name containing: `timestamp`, `date`, `time`, `datetime`
- Case-insensitive (TIMESTAMP, Timestamp, timestamp all work)

**For PM2.5 Column:**
- Any column name containing: `pm`, `2.5`, `25`
- Examples: PM2.5, PM25, pm2.5, pm25, PM, pm

### ❌ Common Issues:

#### Issue 1: Wrong Column Names
**Bad:**
```csv
hour,pollution
00:00,25.3
```

**Good:**
```csv
datetime,PM2.5
2025-01-01 00:00:00,25.3
```

#### Issue 2: Missing Headers
**Bad:**
```csv
2025-01-01 00:00:00,25.3
2025-01-01 01:00:00,23.7
```

**Good:**
```csv
Timestamp,PM2.5
2025-01-01 00:00:00,25.3
2025-01-01 01:00:00,23.7
```

#### Issue 3: Invalid Date Format
**Bad:**
```csv
Date,PM2.5
not-a-date,25.3
```

**Good:**
```csv
Date,PM2.5
2025-01-01 00:00:00,25.3
```

#### Issue 4: Non-numeric PM2.5 Values
**Bad:**
```csv
Timestamp,PM2.5
2025-01-01 00:00:00,N/A
2025-01-01 01:00:00,--
```

**Good:**
```csv
Timestamp,PM2.5
2025-01-01 00:00:00,25.3
2025-01-01 01:00:00,23.7
```

#### Issue 5: Extra Columns (This is OK!)
```csv
Timestamp,City,PM2.5,Temperature
2025-01-01 00:00:00,Delhi,25.3,22
2025-01-01 01:00:00,Delhi,23.7,21
```
✅ The app will automatically find the right columns!

### 🛠️ How to Fix Your CSV:

#### Method 1: Using Excel/Google Sheets
1. Open your CSV file
2. Make sure you have these columns:
   - One column with dates/times
   - One column with PM2.5 values
3. Rename columns if needed:
   - Date column → "Timestamp" or "Date"
   - PM2.5 column → "PM2.5" or "PM25"
4. Save as CSV

#### Method 2: Using Text Editor
1. Open CSV in Notepad/TextEdit
2. Check first line (headers)
3. Make sure it looks like: `Timestamp,PM2.5`
4. Check data rows look like: `2025-01-01 00:00:00,25.3`
5. Save file

### 📊 Supported Date Formats:

The app accepts many date formats:
- `2025-01-01 00:00:00` ✅
- `2025/01/01 00:00:00` ✅
- `01-01-2025 00:00` ✅
- `01/01/2025 00:00` ✅
- `2025-01-01T00:00:00Z` ✅ (ISO format)
- `Jan 1, 2025 00:00` ✅

### 🔍 Debug Your File:

1. **Open Console (F12)**
2. **Upload your file**
3. **Look for these logs:**

```
Raw data received: X rows
First row sample: {Timestamp: "...", PM2.5: "..."}
Column names: ["Timestamp", "PM2.5"]
Found timestamp in column "Timestamp": 2025-01-01 00:00:00
Found PM2.5 in column "PM2.5": 25.3
Processed: X valid rows, Y skipped
```

4. **If you see "Skipping row":**
   - Check that row in your CSV
   - Fix the date or PM2.5 value
   - Try again

### 📝 Test with Sample Data:

Use the included `sample_data.csv` to test:
1. Click "Choose CSV File"
2. Select `sample_data.csv`
3. Should work perfectly!
4. Compare your CSV format with sample_data.csv

### 🎯 Quick Checklist:

- [ ] CSV file has headers (first row with column names)
- [ ] One column name contains "date" or "time"
- [ ] One column name contains "PM" or "2.5"
- [ ] Date values are valid dates
- [ ] PM2.5 values are numbers (not text)
- [ ] File is saved as .csv (not .xlsx or .txt)
- [ ] At least 24 rows of data (for good forecasts)

### 💡 Still Not Working?

1. **Check Console Logs** (F12)
   - Look for specific error messages
   - See which rows are being skipped

2. **Try Sample Data First**
   - Upload `sample_data.csv`
   - If it works, compare with your file

3. **Simplify Your CSV**
   - Keep only 2 columns: Timestamp and PM2.5
   - Remove extra columns
   - Remove special characters

4. **Check File Encoding**
   - Save as UTF-8 encoding
   - No BOM (Byte Order Mark)

### 📧 Example Working CSV:

Here's a minimal working example you can copy:

```csv
Timestamp,PM2.5
2025-01-01 00:00:00,25.3
2025-01-01 01:00:00,23.7
2025-01-01 02:00:00,21.2
2025-01-01 03:00:00,19.8
2025-01-01 04:00:00,18.5
2025-01-01 05:00:00,20.1
2025-01-01 06:00:00,28.4
2025-01-01 07:00:00,42.6
2025-01-01 08:00:00,55.3
2025-01-01 09:00:00,48.9
2025-01-01 10:00:00,38.2
2025-01-01 11:00:00,35.7
2025-01-01 12:00:00,32.4
2025-01-01 13:00:00,30.8
2025-01-01 14:00:00,29.6
2025-01-01 15:00:00,31.2
2025-01-01 16:00:00,35.8
2025-01-01 17:00:00,47.3
2025-01-01 18:00:00,58.6
2025-01-01 19:00:00,52.4
2025-01-01 20:00:00,45.1
2025-01-01 21:00:00,38.9
2025-01-01 22:00:00,32.5
2025-01-01 23:00:00,28.7
```

Save this as `test.csv` and try uploading it!

### 🚀 After Successful Upload:

You should see:
1. ✅ Green success message
2. Dataset information box with:
   - Number of records
   - Date range
   - Average PM2.5
   - Max PM2.5
3. "Use This Dataset" button

Then:
1. Click "Use This Dataset"
2. All charts will update
3. Scroll to top and click "Generate Forecast"
4. See predictions for your data!

---

**Need more help?** Check the console logs (F12) for detailed error messages!
