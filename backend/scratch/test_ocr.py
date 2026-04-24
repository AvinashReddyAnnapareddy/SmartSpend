import re

def parse_receipt_text(text):
    # Remove commas to handle numbers like 1,234.56
    clean_text = text.replace(',', '')
    
    # List of keywords and their regex patterns
    # Support: Total, Grand Total, Net Amount, Payable, Amount, Sum, Rs, ₹
    keywords = [
        r'Total', r'Grand\s*Total', r'Net\s*Amount', r'Amount\s*Payable', 
        r'Total\s*Due', r'Amount', r'Total\s*Rs', r'Total\s*₹', r'Net\s*Payable'
    ]
    
    found_amounts = []
    
    for kw in keywords:
        # Match keyword followed by optional symbols and then the number
        pattern = rf'{kw}[:\s]*[₹$Rs.]*\s*([\d\.]+)'
        matches = re.findall(pattern, clean_text, re.IGNORECASE)
        for m in matches:
            try:
                found_amounts.append(float(m))
            except ValueError:
                continue
    
    if found_amounts:
        # If we found multiple "totals", the largest one is usually the most correct one
        return max(found_amounts)
    
    # Fallback: Find all numbers and pick the largest one
    # We look for things that look like prices: digits with optional . and 2 decimals
    all_numbers = re.findall(r'[\d]+\.[\d]{2}', clean_text)
    if not all_numbers:
        # Try finding any numbers with a decimal
        all_numbers = re.findall(r'[\d]+\.[\d]+', clean_text)
    
    if all_numbers:
        floats = []
        for n in all_numbers:
            try:
                val = float(n)
                # Filter out things that are likely years or long ID numbers
                if 0.01 <= val < 1000000: # Reasonable range for a receipt
                    floats.append(val)
            except ValueError:
                continue
        if floats:
            return max(floats)
            
    return 0.0

# Test cases
test_cases = [
    "STORE NAME 123 Main St Total: $45.67 Thank you",
    "RESTAURANT BILL Net Payable 1250.00 GST included",
    "Items 10.00 20.00 Grand Total Rs. 30.00",
    "Receipt #12345 Date: 2023-10-10 Total ₹ 500.50",
    "No keyword here but 99.99 is the price",
    "Multiple numbers 10.50, 20.30, Total 30.80",
    "Large number 1,234.56 Total: 1234.56"
]

for tc in test_cases:
    print(f"Text: {tc}")
    print(f"Extracted: {parse_receipt_text(tc)}")
    print("-" * 20)
