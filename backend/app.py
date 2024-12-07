```python
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import pandas as pd
from datetime import datetime
from khayyam import JalaliDatetime
import os
import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
CORS(app)

# Configure logging
if not os.path.exists('logs'):
    os.makedirs('logs')

file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('Application startup')

# In-memory databases
orders_db = {}
logs_db = []

def add_log(message, status='info', details=None):
    """Add a log entry."""
    log_entry = {
        'id': str(len(logs_db) + 1),
        'timestamp': JalaliDatetime.now().strftime("%Y/%m/%d %H:%M:%S"),
        'message': message,
        'status': status,
        'details': str(details) if details else None
    }
    logs_db.append(log_entry)
    app.logger.info(f'{status.upper()}: {message} - {details}')
    return log_entry

@app.route('/api/ping', methods=['GET'])
def ping():
    """Simple ping endpoint for connection testing."""
    return jsonify({'success': True, 'message': 'pong'})

@app.route('/api/system/status', methods=['GET'])
def system_status():
    """Get system status and statistics."""
    return jsonify({
        'success': True,
        'data': {
            'status': 'operational',
            'message': 'System is running normally',
            'timestamp': JalaliDatetime.now().strftime("%Y/%m/%d %H:%M:%S"),
            'stats': {
                'total_orders': len(orders_db),
                'total_logs': len(logs_db)
            }
        }
    })

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Get all system logs."""
    return jsonify({
        'success': True,
        'data': logs_db,
        'message': 'Logs retrieved successfully'
    })

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders."""
    orders_list = []
    for order_id, order_data in orders_db.items():
        for sku, details in order_data['SKUs'].items():
            orders_list.append({
                'id': order_id,
                'sku': sku,
                'title': details['Title'],
                'color': details['Color'],
                'quantity': details['Quantity'],
                'scanned': details['Scanned'],
                'status': 'Fulfilled' if details['Scanned'] >= details['Quantity'] else 'Pending',
                'price': details['Price'],
                'scanTimestamp': details.get('ScanTimestamp'),
                'state': order_data.get('State'),
                'city': order_data.get('City'),
                'payment': order_data.get('Payment')
            })
    return jsonify({
        'success': True,
        'data': orders_list,
        'message': 'Orders retrieved successfully'
    })

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    """Get a specific order."""
    if order_id not in orders_db:
        return jsonify({
            'success': False,
            'message': 'Order not found'
        }), 404

    return jsonify({
        'success': True,
        'data': orders_db[order_id],
        'message': 'Order retrieved successfully'
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload and process Excel file."""
    try:
        if 'file' not in request.files:
            add_log('File upload failed', 'error', 'No file provided')
            return jsonify({
                'success': False,
                'message': 'فایل انتخاب نشده است'
            }), 400

        file = request.files['file']
        if not file.filename.endswith('.xlsx'):
            add_log('File upload failed', 'error', 'Invalid file format')
            return jsonify({
                'success': False,
                'message': 'فرمت فایل باید xlsx باشد'
            }), 400

        # Create uploads directory if it doesn't exist
        os.makedirs('uploads', exist_ok=True)

        # Save file
        file_path = os.path.join('uploads', file.filename)
        file.save(file_path)
        
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Column mapping (Persian to English)
        column_mapping = {
            'سریال': 'OrderID',
            'لیست سفارشات - کد محصول': 'SKU',
            'لیست سفارشات - شرح محصول': 'Title',
            'رنگ': 'Color',
            'تعداد درخواستی': 'Quantity',
            'لیست سفارشات - قیمت لیبل': 'Price',
            'استان': 'State',
            'شهر': 'City',
            'مبلغ پرداختی': 'Payment'
        }

        # Check required columns
        missing_columns = [col for col in column_mapping.keys() if col not in df.columns]
        if missing_columns:
            error_msg = f"ستون‌های ضروری یافت نشد: {', '.join(missing_columns)}"
            add_log('File processing failed', 'error', error_msg)
            return jsonify({
                'success': False,
                'message': error_msg
            }), 400

        # Process orders
        processed_count = 0
        for _, row in df.iterrows():
            order_id = str(row['سریال'])
            if order_id not in orders_db:
                orders_db[order_id] = {
                    'SKUs': {},
                    'State': row['استان'],
                    'City': row['شهر'],
                    'Payment': f"{int(float(row['مبلغ پرداختی'])):,}" if pd.notna(row['مبلغ پرداختی']) else None,
                    'Status': 'Pending'
                }
            
            sku = str(row['لیست سفارشات - کد محصول'])
            orders_db[order_id]['SKUs'][sku] = {
                'Title': row['لیست سفارشات - شرح محصول'],
                'Color': row['رنگ'],
                'Quantity': int(row['تعداد درخواستی']) if pd.notna(row['تعداد درخواستی']) else 0,
                'Scanned': 0,
                'Price': f"{int(float(row['لیست سفارشات - قیمت لیبل'])):,}" if pd.notna(row['لیست سفارشات - قیمت لیبل']) else "0",
            }
            processed_count += 1

        success_msg = f'فایل با موفقیت آپلود شد. {processed_count} سفارش پردازش شد.'
        add_log('File uploaded successfully', 'success', {'processed_count': processed_count})
        return jsonify({
            'success': True,
            'message': success_msg,
            'data': {
                'processed_count': processed_count
            }
        })

    except Exception as e:
        error_msg = str(e)
        add_log('File processing failed', 'error', error_msg)
        return jsonify({
            'success': False,
            'message': f'خطا در پردازش فایل: {error_msg}'
        }), 500

@app.route('/api/scan', methods=['POST'])
def scan_order():
    """Scan an order item."""
    data = request.json
    order_id = data.get('orderId')
    sku = data.get('sku')
    
    if not order_id or not sku:
        add_log('Scan failed', 'error', 'Missing required fields')
        return jsonify({
            'success': False,
            'message': 'اطلاعات ناقص است'
        }), 400
        
    if order_id not in orders_db or sku not in orders_db[order_id]['SKUs']:
        add_log('Scan failed', 'error', f'Order {order_id} or SKU {sku} not found')
        return jsonify({
            'success': False,
            'message': 'سفارش یا کد محصول یافت نشد'
        }), 404
        
    # Update scanned count
    orders_db[order_id]['SKUs'][sku]['Scanned'] += 1
    
    # Update scan timestamp
    current_time = JalaliDatetime.now()
    orders_db[order_id]['SKUs'][sku]['ScanTimestamp'] = current_time.strftime("%Y/%m/%d %H:%M")
    
    add_log('Item scanned successfully', 'success', {'order_id': order_id, 'sku': sku})
    return jsonify({
        'success': True,
        'message': 'اسکن با موفقیت انجام شد'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
```