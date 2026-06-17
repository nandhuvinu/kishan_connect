# Kisan Connect API Documentation

## API Response Format

All API responses follow a consistent format:

```json
{
  "status": 200,
  "message": "Request successful",
  "data": {},
  "timestamp": "2026-05-15T10:00:00.000Z"
}
```

## HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for processing
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists or conflict occurred
- **422 Unprocessable Entity**: Validation failed
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error occurred
- **503 Service Unavailable**: Service temporarily unavailable

## Farmer Endpoints

### Register Farmer (New Format)
```
POST /api/farmers/register
Content-Type: application/json

{
  "farmerName": "John Doe",
  "password": "SecurePass123",
  "pinCode": "560001",
  "state": "Karnataka",
  "district": "Bangalore",
  "taluk": "Bangalore South",
  "village": "Jayanagar",
  "crops": [
    {
      "cropType": "wheat",
      "quantity": 100,
      "price": 25
    }
  ]
}
```

### Register Farmer (Legacy Format)
```
POST /api/farmers
Content-Type: application/json

{
  "farmerName": "John Doe",
  "villageDistrict": "Shivamoga",
  "phoneNumber": "9876543210",
  "cropType": "sugarcane",
  "quantity": 10,
  "price": 100
}
```

### Get All Farmers
```
GET /api/farmers
Response: [{ farmer objects }]
```

### Get Farmer by ID
```
GET /api/farmers/:id
Response: { farmer object }
```

### Update Farmer
```
PUT /api/farmers/:id
Content-Type: application/json

{
  "farmerName": "Updated Name",
  "phoneNumber": "9876543211",
  "price": 120
}
```

### Delete Farmer
```
DELETE /api/farmers/:id
Response: { message: "Farmer deleted successfully", id }
```

### Search Farmers
```
GET /api/search/farmers?q=John
Response: [{ matching farmer objects }]
```

### Query Farmers with Filters
```
GET /api/query/farmers?page=1&limit=20&cropType=wheat&state=Karnataka&minQuantity=50&maxPrice=30
Response: {
  data: [{ farmer objects }],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
    hasNextPage: true,
    hasPrevPage: false
  }
}
```

## Buyer Endpoints

### Register Buyer
```
POST /api/buyers
Content-Type: application/json

{
  "buyerName": "Fresh Markets Ltd",
  "password": "SecurePass123",
  "businessName": "Fresh Markets",
  "buyerPhone": "9876543210",
  "requiredCrop": "wheat",
  "quantityNeeded": 500
}
```

### Get All Buyers
```
GET /api/buyers
Response: [{ buyer objects }]
```

### Update Buyer
```
PUT /api/buyers/:id
Content-Type: application/json

{
  "businessName": "Updated Business Name",
  "quantityNeeded": 600
}
```

### Delete Buyer
```
DELETE /api/buyers/:id
Response: { message: "Buyer deleted successfully", id }
```

## Marketplace Endpoints

### Get Matching Farmers for a Buyer
```
GET /api/buyer/:buyerId/matching-farmers
Response: [{ farmer objects matching buyer's crop requirement }]
```

### Get Matching Buyers for a Farmer
```
GET /api/farmer/:farmerId/matching-buyers
Response: [{ buyer objects matching farmer's crop }]
```

### Get Sellers List (for Buyers)
```
GET /api/sellers
Response: [{ farmer objects with id, name, crop, quantity, price, location, phone }]
```

### Get Buyer Demands List (for Farmers)
```
GET /api/buyers/demands
Response: [{ buyer objects with demand details }]
```

## Authentication Endpoints

### Login (Username/Password)
```
POST /api/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

### Farmer Login
```
POST /api/farmer-login
Content-Type: application/json

{
  "farmerName": "John Doe",
  "password": "SecurePass123"
}
```

### Buyer Login
```
POST /api/buyer-login
Content-Type: application/json

{
  "buyerName": "Fresh Markets Ltd",
  "password": "SecurePass123"
}
```

### Register User
```
POST /api/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123",
  "role": "farmer"
}
```

### Auth Login (with Token)
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}

Response: {
  "message": "Login successful",
  "token": "hexadecimaltoken",
  "user": { id, username, role },
  "expiresAt": "2026-05-16T10:00:00.000Z"
}
```

### Verify Token
```
GET /api/auth/verify
Authorization: Bearer <token>
Response: { valid: true, user: { id, username, role } }
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
Response: { message: "Logged out successfully" }
```

## Contact Endpoints

### Submit Contact Form
```
POST /api/contact
Content-Type: application/json

{
  "contactName": "John Doe",
  "contactEmail": "john@example.com",
  "contactSubject": "Inquiry",
  "contactMessage": "I'm interested in your service"
}
```

### Get All Contacts (Admin)
```
GET /api/contacts
Response: [{ contact objects }]
```

### Delete Contact
```
DELETE /api/contacts/:id
Response: { message: "Contact deleted successfully", id }
```

## Utility Endpoints

### Get Database Statistics
```
GET /api/stats
Response: {
  farmers: 150,
  buyers: 45,
  contacts: 23,
  users: 50,
  activeSessions: 5
}
```

## Bulk Operations

### Bulk Insert Farmers
```
POST /api/farmers/bulk
Content-Type: application/json

{
  "farmers": [
    {
      "farmerName": "Farmer 1",
      "villageDistrict": "District 1",
      "phoneNumber": "9876543210",
      "cropType": "wheat",
      "quantity": 100,
      "price": 25
    },
    { ... }
  ]
}
```

### Bulk Delete Farmers
```
DELETE /api/farmers/bulk
Content-Type: application/json

{
  "ids": ["id1", "id2", "id3"]
}
```

## Error Responses

### Validation Error (422)
```json
{
  "status": 422,
  "message": "Validation failed",
  "errors": ["Field is required", "Invalid email format"],
  "timestamp": "2026-05-15T10:00:00.000Z"
}
```

### Not Found Error (404)
```json
{
  "status": 404,
  "message": "Farmer not found",
  "timestamp": "2026-05-15T10:00:00.000Z"
}
```

### Rate Limit Error (429)
```json
{
  "status": 429,
  "message": "Too many requests. Please try again later.",
  "timestamp": "2026-05-15T10:00:00.000Z"
}
```

## Rate Limiting

- Limit: 100 requests per 60 seconds per IP
- Status: 429 (Too Many Requests) when exceeded

## Pagination

All list endpoints support pagination:
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
