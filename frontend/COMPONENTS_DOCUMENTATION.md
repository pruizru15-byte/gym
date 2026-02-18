# Client and Membership Management Components

This document describes the frontend components for client and membership management.

## Clientes (Client Management)

### ClientesList.jsx
**Location:** `/clientes`

**Features:**
- Lists all gym members with pagination
- Search by name, email, or phone
- Filter by membership status (all, active, inactive, expiring)
- Sort by name or expiration date
- Status badges showing active/inactive/expiring
- Click through to client details

**Usage:**
```jsx
import ClientesList from './components/Clientes/ClientesList'
```

### ClienteForm.jsx
**Location:** `/clientes/nuevo` and `/clientes/:id/editar`

**Features:**
- Create new client or edit existing
- Personal information (name, email, phone, birth date, address)
- Emergency contact information
- Additional notes field
- Form validation with error messages
- Auto-detects edit mode based on URL parameter

**Usage:**
```jsx
import ClienteForm from './components/Clientes/ClienteForm'
```

### ClienteDetalle.jsx
**Location:** `/clientes/:id`

**Features:**
- Complete client profile view
- Three tabs: General Info, Attendance History, Payment History
- Current membership status with alerts
- Quick actions: Edit, Renew/Assign Membership
- Emergency contact information
- Attendance and payment records

**Usage:**
```jsx
import ClienteDetalle from './components/Clientes/ClienteDetalle'
```

### CheckIn.jsx
**Location:** `/check-in`

**Features:**
- Quick check-in interface for gym entrance
- Real-time member search
- QR code scanner support (placeholder for integration)
- Membership status validation
- Recent check-ins list
- Statistics (today's check-ins, last hour)
- Visual feedback with toasts

**Usage:**
```jsx
import CheckIn from './components/Clientes/CheckIn'
```

## Membresias (Membership Management)

### MembresiasList.jsx
**Location:** `/membresias`

**Features:**
- Display all membership plans as cards
- Color-coded plan cards
- Plan details (price, duration, active members)
- Edit and delete actions
- Summary statistics
- Active/inactive status toggle

**Usage:**
```jsx
import MembresiasList from './components/Membresias/MembresiasList'
```

### MembresiaForm.jsx
**Location:** `/membresias/nuevo` and `/membresias/editar/:id`

**Features:**
- Create or edit membership plans
- Plan configuration (name, description, price, duration)
- Duration type selector (days, months, years)
- Active/inactive toggle
- Price per day calculator
- Plan preview/summary
- Form validation

**Usage:**
```jsx
import MembresiaForm from './components/Membresias/MembresiaForm'
```

### RenovarMembresia.jsx
**Location:** `/membresias/renovar/:id` and `/membresias/nueva/:id`

**Features:**
- Renew existing or create new membership for a client
- View current membership details
- Select from available plans
- Set start date (auto-suggests day after expiration)
- Calculate new expiration date automatically
- Payment method selection
- Custom amount option
- Summary sidebar with client info
- Creates membership and payment records

**Usage:**
```jsx
import RenovarMembresia from './components/Membresias/RenovarMembresia'
```

### VencimientosProximos.jsx
**Location:** `/membresias/vencimientos`

**Features:**
- Lists memberships expiring soon
- Color-coded urgency levels (urgent, next 7 days, etc.)
- Filter by timeframe (7, 15, 30, 60 days)
- Search by member name, email, or phone
- Quick renewal button for each membership
- Statistics cards showing urgent renewals
- Export functionality (placeholder)

**Usage:**
```jsx
import VencimientosProximos from './components/Membresias/VencimientosProximos'
```

## Routes Configuration

All routes are configured in `App.jsx`:

### Client Routes
- `/clientes` - List all clients
- `/clientes/nuevo` - Create new client
- `/clientes/:id` - View client details
- `/clientes/:id/editar` - Edit client
- `/check-in` - Check-in interface

### Membership Routes
- `/membresias` - List membership plans
- `/membresias/nuevo` - Create new plan
- `/membresias/editar/:id` - Edit plan
- `/membresias/renovar/:id` - Renew membership for client
- `/membresias/nueva/:id` - Assign new membership to client
- `/membresias/vencimientos` - View expiring memberships

## Navigation

The sidebar in `Sidebar.jsx` has been updated with:
- **Clientes** - Access to client list
- **Check-in** - Quick check-in interface
- **Membresías** - Membership plans management
- **Vencimientos** - Expiring memberships alert

## API Integration

All components use the centralized API service from `src/services/api.js`:

- `membersAPI` - Client operations
- `membershipsAPI` - Membership operations
- `plansAPI` - Membership plan operations
- `paymentsAPI` - Payment operations
- `attendanceAPI` - Attendance/check-in operations

## Utilities

Components leverage utility functions from:
- `src/utils/formatters.js` - Date, currency, phone formatting
- `src/hooks/useNotifications.js` - Toast notifications
- `react-hot-toast` - User feedback
- `lucide-react` - Icons
- `tailwindcss` - Styling

## Styling

All components use:
- Tailwind CSS utility classes
- Consistent color scheme with primary colors
- Responsive design (mobile-first approach)
- Loading states with spinners
- Error states with messages
- Empty states with helpful messages

## Best Practices

1. **Error Handling** - All API calls wrapped in try-catch
2. **Loading States** - Display spinners during data fetching
3. **Form Validation** - Client-side validation before submission
4. **User Feedback** - Toast notifications for all actions
5. **Responsive Design** - Works on mobile, tablet, and desktop
6. **Accessibility** - Proper labels, ARIA attributes
7. **Code Comments** - Helpful comments for complex logic

## Future Enhancements

- QR code scanner integration in CheckIn component
- Advanced filtering and sorting options
- Bulk operations (assign memberships, renewals)
- Export to CSV/PDF functionality
- Email/SMS notifications for expiring memberships
- Member photo upload
- Digital membership cards
