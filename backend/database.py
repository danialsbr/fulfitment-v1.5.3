```python
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
    return log_entry
```