"""
Utility functions for the events app.
"""
import qrcode
from uuid import uuid4
from io import BytesIO
from django.core.files import File


def generate_unique_ticket_code():
    """
    Generate unique ticket code using UUID.
    
    Returns:
        str: 32-character hexadecimal ticket code
    """
    return uuid4().hex


def generate_qr_code_image(ticket_code: str) -> File:
    """
    Generate QR code image from ticket code.
    
    Args:
        ticket_code: The unique ticket code to encode in the QR code
        
    Returns:
        File: Django File object containing the QR code PNG image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(ticket_code)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return File(buffer, name=f'qr_{ticket_code}.png')
