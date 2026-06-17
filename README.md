# Kisan Connect - Agricultural Marketplace Platform

A comprehensive platform connecting farmers directly with buyers, eliminating middlemen and ensuring fair pricing for agricultural produce.

## Features

- **Farmer Registration**: Farmers can list their crops with prices and contact details
- **Buyer Registration**: Buyers can specify their requirements and connect with farmers
- **Direct Communication**: Platform facilitates direct farmer-buyer connections
- **Gallery Showcase**: Visual representation of the platform's vision and concepts
- **Responsive Design**: Mobile-friendly interface for all users
- **Contact System**: Support and inquiry management

## Image Prompts for AI Generation

The platform includes a gallery section that should feature custom AI-generated images representing the core concepts. Use the following prompts with an AI image generator (like Midjourney, DALL-E, or Stable Diffusion) to create the gallery images:

### 1. Direct Market Connection
```
A rural Indian farmer wearing traditional clothes handing fresh vegetables to a customer in an open village market, baskets of tomatoes, onions, and green vegetables around, smiling faces, natural sunlight, realistic style, high detail, warm colors
```

### 2. Digital Agriculture Platform
```
An Indian farmer holding a smartphone showing a farming marketplace app while a customer selects fresh produce online, modern agriculture, digital farming concept, rural background mixed with technology, realistic illustration
```

### 3. Organic Farming Excellence
```
A happy organic farmer standing in a green farm field with a customer choosing fresh organic vegetables, eco-friendly farming, sustainable agriculture, bright daylight, realistic photography style
```

### 4. Trust & Fair Trade
```
Farmer and customer shaking hands in a farm, symbol of trust and fair trade, crops growing in background, Indian rural landscape, cinematic lighting, ultra-realistic
```

### 5. Family-to-Family Trading
```
Indian farmer selling farm-fresh fruits and vegetables directly to a family customer, traditional market setup, colorful produce, happy expressions, detailed realistic scene
```

## How to Add Images to Gallery

1. **Generate Images**: Use the prompts above with your preferred AI image generator
2. **Save Images**: Save the generated images as:
   - `gallery-1.jpg` (Direct Market Connection)
   - `gallery-2.jpg` (Digital Agriculture Platform)
   - `gallery-3.jpg` (Organic Farming Excellence)
   - `gallery-4.jpg` (Trust & Fair Trade)
   - `gallery-5.jpg` (Family-to-Family Trading)

3. **Place Images**: Put the images in an `images/` folder in your project root

4. **Update HTML**: The gallery section in `index.html` currently shows placeholder icons. To display actual images, replace the gallery image divs with:
   ```html
   <img src="images/gallery-1.jpg" alt="Direct Market Connection" style="width: 100%; height: 250px; object-fit: cover;">
   ```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation
1. Clone or download the project files
2. Navigate to the project directory in terminal
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## File Structure
```
kisan-connect/
├── index.html              # Main frontend application
├── server.js               # Express server (Node.js backend)
├── package.json            # Node.js dependencies
├── image-prompts.txt       # AI image generation prompts
├── kisan_connect.db        # SQLite database storage
├── images/                 # Gallery images (optional; add your own)
└── README.md               # This file
```

## API Endpoints

- `POST /api/farmers` - Register a farmer
- `POST /api/buyers` - Register a buyer
- `POST /api/contact` - Send contact message
- `GET /api/farmers` - Get all farmers
- `GET /api/buyers` - Get all buyers
- `GET /api/contacts` - Get all contact messages
- `GET /api/sellers` - Get all farmer sellers
- `GET /api/buyers/demands` - Get all buyer demands

## Code Quality & Performance Optimizations

### Frontend Performance
- **Double-submit prevention**: Form submit buttons are disabled during submission
- **GPU-accelerated animations**: CSS transforms use `will-change` and `transform: translateZ(0)` for smooth 60fps animations
- **Optimized DOM updates**: `requestAnimationFrame` used for message display rendering
- **Responsive forms**: All inputs include validation patterns and autocomplete attributes
- **Accessible UI**: Full ARIA support for screen readers, dynamic `aria-expanded` states

### Backend Performance
- **SQLite WAL mode**: Write-Ahead Logging for concurrent database access
- **Database indexing**: Indexes on frequently queried columns (farmerName, cropType, location, token, userId)
- **Rate limiting**: 100 requests per 60 seconds per IP to prevent abuse
- **Input validation**: Server-side validation for phone numbers, emails, and numeric fields
- **Connection pooling**: Better-sqlite3 with synchronous = NORMAL pragma for optimized throughput

### Code Organization
- **Comprehensive JSDoc comments**: All helper functions documented with parameter types and return values
- **Organized route sections**: Routes grouped by functionality with clear headers
- **Centralized validation**: Reusable validation helpers (`isValidEmail`, `isValidPhone`, `parsePositiveInt`, `parsePositiveFloat`)
- **Error handling**: Try-catch blocks on all routes with console logging for debugging

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Data Storage**: SQLite database (`kisan_connect.db`)
- **Icons**: Font Awesome
- **Styling**: CSS Grid, Flexbox, Custom CSS

## Development

For development with auto-restart (requires nodemon):
```bash
npm install -g nodemon
npm run dev
```

## Features Overview

### For Farmers
- Easy registration with crop details
- Direct connection with buyers
- Fair pricing without middlemen
- Location and contact information sharing

### For Buyers
- Search for specific crops and quantities
- Direct farmer contact
- Transparent pricing
- Quality assurance

### Gallery Section
- Visual representation of platform concepts
- AI-generated images showcasing the vision
- Responsive grid layout
- Hover effects and smooth transitions

## Contributing

1. Generate the gallery images using the provided prompts
2. Add them to the `images/` folder
3. Test the application functionality
4. Ensure all forms work correctly

## License

This project is open source and available under the MIT License.

## Support

For questions or support, please use the contact form on the website or reach out to the development team.
