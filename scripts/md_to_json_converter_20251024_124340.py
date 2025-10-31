#!/usr/bin/env python3
"""
Convert testing laboratories markdown table to JSON format.
Usage: python convert_labs.py input.md output.json
"""

import re
import json
import sys
from typing import Dict, List, Any


def parse_contact_info(contact_text: str) -> Dict[str, str]:
    """Parse contact information into structured fields."""
    contact = {}
    
    # Extract everything after "Contact:" if it exists
    contact_section = contact_text
    if 'Contact:' in contact_text:
        parts = contact_text.split('Contact:', 1)
        contact_section = parts[1] if len(parts) > 1 else contact_text
    
    # Extract email (multiple patterns)
    email_matches = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', contact_section)
    if email_matches:
        contact['email'] = ' / '.join(email_matches)
    
    # Extract phone numbers (various formats)
    phone_patterns = [
        r'\(\d{2,3}\)\s*\d{3,4}[-\s]?\d{3,4}(?:\s*(?:to|local|loc\.?|Loc\.?)\s*\d{2,4})?',  # (02) 7501-6995
        r'\+\d{1,3}[-\s]?\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,4}(?:\s*(?:local|loc\.?)\s*\d{2,4})?',  # +63 format
        r'\d{3,4}[-\s]\d{3,4}(?:\s*(?:to|local|loc\.?)\s*\d{2,4})?',  # Simple formats
        r'T/F\s+[\d/-]+',  # T/F format
        r'\d{2,3}\s+\d{3}\s+\d{3,4}',  # Space separated
    ]
    
    phones = []
    for pattern in phone_patterns:
        matches = re.findall(pattern, contact_section)
        phones.extend(matches)
    
    # Also catch mobile numbers
    mobile_matches = re.findall(r'09\d{9}', contact_section)
    phones.extend(mobile_matches)
    
    if phones:
        # Clean and deduplicate
        cleaned_phones = []
        for p in phones:
            p = p.strip()
            if p and p not in cleaned_phones:
                cleaned_phones.append(p)
        contact['phone'] = ' / '.join(cleaned_phones)
    
    # Extract website
    website_match = re.search(r'www\.[\w\.-]+\.[\w]+', contact_section)
    if website_match:
        contact['website'] = website_match.group(0)
    
    # Extract address (everything after removing contact details)
    address = contact_section
    
    # Remove emails
    for email in email_matches:
        address = address.replace(email, '')
    
    # Remove phones
    for phone in phones:
        address = address.replace(phone, '')
    
    # Remove website
    if website_match:
        address = address.replace(website_match.group(0), '')
    
    # Clean up address
    address = re.sub(r'T/F\s+[\d/-]+', '', address)
    address = re.sub(r'\s+', ' ', address).strip()
    address = re.sub(r'^[,\s/|]+|[,\s/|]+


def parse_scopes(scope_text: str) -> List[str]:
    """Parse scopes into a list."""
    if not scope_text or scope_text.strip() == '-':
        return []
    
    # Split by dash and clean
    scopes = []
    for scope in scope_text.split('-'):
        scope = scope.strip()
        if scope:
            scopes.append(scope)
    
    return scopes


def parse_certificates(cert_text: str) -> List[str]:
    """Parse certificates into a list."""
    if not cert_text or cert_text.strip() == '-':
        return []
    
    # Split by multiple dashes
    certs = []
    parts = re.split(r'\s*-\s*-\s*', cert_text)
    
    for cert in parts:
        cert = cert.strip()
        if cert and cert != '-':
            certs.append(cert)
    
    return certs


def parse_table_row(row: str) -> Dict[str, Any]:
    """Parse a single table row into a laboratory entry."""
    # Split by pipe
    cells = [cell.strip() for cell in row.split('|')]
    
    # Remove empty cells from start/end
    cells = [c for c in cells if c]
    
    if len(cells) < 4:
        return None
    
    # First cell contains lab name and contact info
    lab_name_contact = cells[0].strip()
    
    # Extract laboratory name (before "Contact:")
    name_match = re.split(r'\s+Contact:', lab_name_contact, maxsplit=1)
    lab_name = name_match[0].strip() if name_match else lab_name_contact
    
    lab_entry = {
        'name': lab_name,
        'contact': parse_contact_info(lab_name_contact),
        'scopes': parse_scopes(cells[1]),
        'status': cells[2].strip() if len(cells) > 2 else '',
        'certificates': parse_certificates(cells[3]) if len(cells) > 3 else []
    }
    
    return lab_entry


def extract_laboratories(markdown_content: str) -> List[Dict[str, Any]]:
    """Extract all laboratory entries from markdown table."""
    laboratories = []
    
    # Split into lines
    lines = markdown_content.split('\n')
    
    # Find table rows - look for lines with pipes
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
        
        # Skip header row (contains "Testing Laboratories")
        if 'Testing Laboratories' in line:
            continue
        
        # Skip separator lines (dashes and pipes)
        if re.match(r'^\|[\s\-:|]+\|', line):
            continue
        
        # Process data rows (must start with pipe and have at least 3 pipes)
        if line.startswith('|') and line.count('|') >= 4:
            lab = parse_table_row(line)
            if lab and lab['name'] and len(lab['name']) > 3:
                laboratories.append(lab)
    
    return laboratories


def main():
    """Main execution function."""
    if len(sys.argv) < 2:
        print("Usage: python convert_labs.py input.md [output.json]")
        print("If output file not specified, prints to stdout")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Read markdown file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    # Debug: Show first few lines
    lines = content.split('\n')
    print(f"Total lines in file: {len(lines)}", file=sys.stderr)
    print(f"Lines starting with '|': {sum(1 for line in lines if line.strip().startswith('|'))}", file=sys.stderr)
    
    # Extract laboratories
    laboratories = extract_laboratories(content)
    
    # Create output JSON
    output = {
        'total_laboratories': len(laboratories),
        'laboratories': laboratories
    }
    
    # Output results
    json_output = json.dumps(output, indent=2, ensure_ascii=False)
    
    if output_file:
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(json_output)
            print(f"Successfully converted {len(laboratories)} laboratories", file=sys.stderr)
            print(f"Output written to: {output_file}", file=sys.stderr)
        except Exception as e:
            print(f"Error writing output file: {e}")
            sys.exit(1)
    else:
        print(json_output)


if __name__ == '__main__':
    main()
, '', address)
    
    if address and len(address) > 3:
        contact['address'] = address
    
    return contact


def parse_scopes(scope_text: str) -> List[str]:
    """Parse scopes into a list."""
    if not scope_text or scope_text.strip() == '-':
        return []
    
    # Split by dash and clean
    scopes = []
    for scope in scope_text.split('-'):
        scope = scope.strip()
        if scope:
            scopes.append(scope)
    
    return scopes


def parse_certificates(cert_text: str) -> List[str]:
    """Parse certificates into a list."""
    if not cert_text or cert_text.strip() == '-':
        return []
    
    # Split by multiple dashes
    certs = []
    parts = re.split(r'\s*-\s*-\s*', cert_text)
    
    for cert in parts:
        cert = cert.strip()
        if cert and cert != '-':
            certs.append(cert)
    
    return certs


def parse_table_row(row: str) -> Dict[str, Any]:
    """Parse a single table row into a laboratory entry."""
    # Split by pipe
    cells = [cell.strip() for cell in row.split('|')]
    
    # Remove empty cells from start/end
    cells = [c for c in cells if c]
    
    if len(cells) < 4:
        return None
    
    # First cell contains lab name and contact info
    lab_name_contact = cells[0].strip()
    
    # Extract laboratory name (before "Contact:")
    name_match = re.split(r'\s+Contact:', lab_name_contact, maxsplit=1)
    lab_name = name_match[0].strip() if name_match else lab_name_contact
    
    lab_entry = {
        'name': lab_name,
        'contact': parse_contact_info(lab_name_contact),
        'scopes': parse_scopes(cells[1]),
        'status': cells[2].strip() if len(cells) > 2 else '',
        'certificates': parse_certificates(cells[3]) if len(cells) > 3 else []
    }
    
    return lab_entry


def extract_laboratories(markdown_content: str) -> List[Dict[str, Any]]:
    """Extract all laboratory entries from markdown table."""
    laboratories = []
    
    # Split into lines
    lines = markdown_content.split('\n')
    
    # Skip header and separator rows
    in_table = False
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
        
        # Check if this is a table separator line
        if re.match(r'^\|[\s\-:]+\|', line):
            in_table = True
            continue
        
        # Skip header row
        if 'Testing Laboratories' in line and 'Scopes' in line:
            continue
        
        # Parse data rows
        if in_table and line.startswith('|'):
            lab = parse_table_row(line)
            if lab and lab['name']:
                laboratories.append(lab)
    
    return laboratories


def main():
    """Main execution function."""
    if len(sys.argv) < 2:
        print("Usage: python convert_labs.py input.md [output.json]")
        print("If output file not specified, prints to stdout")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Read markdown file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    # Extract laboratories
    laboratories = extract_laboratories(content)
    
    # Create output JSON
    output = {
        'total_laboratories': len(laboratories),
        'laboratories': laboratories
    }
    
    # Output results
    json_output = json.dumps(output, indent=2, ensure_ascii=False)
    
    if output_file:
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(json_output)
            print(f"Successfully converted {len(laboratories)} laboratories")
            print(f"Output written to: {output_file}")
        except Exception as e:
            print(f"Error writing output file: {e}")
            sys.exit(1)
    else:
        print(json_output)


if __name__ == '__main__':
    main()
