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
    
    # Extract email (multiple patterns)
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', contact_text)
    if email_match:
        contact['email'] = email_match.group(0)
    
    # Extract phone numbers (various formats)
    phone_patterns = [
        r'\(\d{2,3}\)\s*\d{3,4}[-\s]?\d{3,4}',  # (02) 7501-6995
        r'\+?\d{2,3}[-\s]?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4}',  # Various formats
        r'\d{3,4}[-\s]?\d{3,4}',  # Simple formats
        r'T/F\s+[\d/-]+',  # T/F format
    ]
    
    phones = []
    for pattern in phone_patterns:
        matches = re.findall(pattern, contact_text)
        phones.extend(matches)
    
    if phones:
        contact['phone'] = ' / '.join(set(phones))
    
    # Extract website
    website_match = re.search(r'www\.[\w\.-]+\.[\w]+', contact_text)
    if website_match:
        contact['website'] = website_match.group(0)
    
    # Extract address (everything after contact details)
    # Remove emails, phones, websites first
    address = contact_text
    for key in ['email', 'phone', 'website']:
        if key in contact:
            address = address.replace(contact[key], '')
    
    # Clean up address
    address = re.sub(r'Contact:\s*', '', address)
    address = re.sub(r'T/F\s+[\d/-]+', '', address)
    address = re.sub(r'\s+', ' ', address).strip()
    address = re.sub(r'^[,\s]+|[,\s]+$', '', address)
    
    if address:
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
    # Split by pipe, handling escaped content
    cells = [cell.strip() for cell in row.split('|')]
    
    # Remove empty cells from start/end
    cells = [c for c in cells if c]
    
    if len(cells) < 4:
        return None
    
    lab_entry = {
        'name': cells[0].strip(),
        'contact': parse_contact_info(cells[0]),
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
