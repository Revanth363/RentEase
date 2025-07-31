const swaggerJsdoc = require('swagger-jsdoc');

// Swagger configuration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RentEase API',
      version: '1.0.0',
      description: `
        RentEase is a comprehensive property rental platform connecting tenants, property owners, and domestic workers.
        
        **Supported User Types:**
        - Tenant: Renters looking for properties
        - Owner: Property owners managing rentals
        - Worker: Service providers (maids, cooks, gardener, etc.)
        - Admin: System administrators
        - SuperAdmin: Platform super administrators
        
        **Key Features:**
        - Property Search & Listing
        - Booking & Reservation Management
        - User Verification & Authentication
        - Payment Processing
        - Maintenance Request Tracking
        - Worker Management
        - Admin Dashboard & Analytics
        
        **Authentication:** JWT Bearer Token (set in Authorization header)
      `,
      contact: {
        name: 'RentEase Development Team',
        email: 'support@rentease.com',
        url: 'https://rentease.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      },
      {
        url: 'https://api.rentease.com',
        description: 'Production Server'
      }
    ],
    components: {
      // ============================================
      // SECURITY SCHEMES
      // ============================================
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint. Add "Bearer <token>" to Authorization header.'
        }
      },

      // ============================================
      // REUSABLE SCHEMAS (Models)
      // ============================================
      schemas: {
        // ===== USER SCHEMAS =====
        Tenant: {
          type: 'object',
          required: ['email', 'firstName', 'lastName', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique tenant identifier',
              example: '507f1f77bcf86cd799439011'
            },
            firstName: {
              type: 'string',
              example: 'Raj'
            },
            lastName: {
              type: 'string',
              example: 'Kumar'
            },
            fullName: {
              type: 'string',
              example: 'Raj Kumar'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'tenant@example.com'
            },
            phone: {
              type: 'string',
              example: '9876543210'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecurePass123'
            },
            location: {
              type: 'string',
              example: 'Bangalore'
            },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive', 'Suspended'],
              example: 'Active'
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            profilePicture: {
              type: 'string',
              example: 'https://cloudinary.com/image.jpg'
            },
            notificationPreferences: {
              type: 'object',
              properties: {
                email: { type: 'boolean', example: true },
                sms: { type: 'boolean', example: false },
                payment: { type: 'boolean', example: true },
                complaint: { type: 'boolean', example: true },
                maintenance: { type: 'boolean', example: true }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Owner: {
          type: 'object',
          required: ['email', 'firstName', 'lastName', 'password'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            firstName: {
              type: 'string',
              example: 'Priya'
            },
            lastName: {
              type: 'string',
              example: 'Singh'
            },
            fullName: {
              type: 'string',
              example: 'Priya Singh'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'owner@example.com'
            },
            phone: {
              type: 'string',
              example: '9876543210'
            },
            password: {
              type: 'string',
              format: 'password'
            },
            location: {
              type: 'string',
              example: 'Bangalore'
            },
            numProperties: {
              type: 'integer',
              example: 5
            },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive'],
              example: 'Active'
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Worker: {
          type: 'object',
          required: ['email', 'firstName', 'lastName', 'password', 'serviceType'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            firstName: {
              type: 'string',
              example: 'Ramesh'
            },
            lastName: {
              type: 'string',
              example: 'Patel'
            },
            fullName: {
              type: 'string',
              example: 'Ramesh Patel'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'worker@example.com'
            },
            phone: {
              type: 'string',
              example: '9876543210'
            },
            password: {
              type: 'string',
              format: 'password'
            },
            serviceType: {
              type: 'string',
              example: 'Electrician'
            },
            experience: {
              type: 'string',
              example: '5 years'
            },
            location: {
              type: 'string',
              example: 'Bangalore'
            },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive'],
              example: 'Active'
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            rating: {
              type: 'number',
              example: 4.5
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Admin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439014'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@admin.com'
            },
            password: {
              type: 'string',
              format: 'password'
            },
            name: {
              type: 'string',
              example: 'Admin User'
            },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive'],
              example: 'Active'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        SuperAdmin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439015'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'superadmin@rentease.com'
            },
            password: {
              type: 'string',
              format: 'password'
            },
            name: {
              type: 'string',
              example: 'Super Administrator'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // ===== PROPERTY SCHEMAS =====
        Property: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439016'
            },
            name: {
              type: 'string',
              example: 'Luxury 2BHK Apartment'
            },
            description: {
              type: 'string',
              example: 'Beautiful apartment in prime location with modern amenities'
            },
            location: {
              type: 'string',
              example: 'Bangalore, Karnataka'
            },
            subtype: {
              type: 'string',
              enum: ['Apartment', 'House', 'Studio', 'Villa', 'Condo'],
              example: 'Apartment'
            },
            price: {
              type: 'number',
              example: 25000
            },
            bedrooms: {
              type: 'integer',
              example: 2
            },
            bathrooms: {
              type: 'integer',
              example: 2
            },
            size: {
              type: 'string',
              example: '1200 sqft'
            },
            amenities: {
              type: 'array',
              items: { type: 'string' },
              example: ['WiFi', 'AC', 'Parking', 'Gym']
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              example: ['https://cloudinary.com/img1.jpg', 'https://cloudinary.com/img2.jpg']
            },
            ownerId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            isRented: {
              type: 'boolean',
              example: false
            },
            is_popular: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // ===== BOOKING SCHEMA =====
        Booking: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439017'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            propertyId: {
              type: 'string',
              example: '507f1f77bcf86cd799439016'
            },
            ownerId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            startDate: {
              type: 'string',
              format: 'date',
              example: '2024-04-01'
            },
            endDate: {
              type: 'string',
              format: 'date',
              example: '2024-06-30'
            },
            rentAmount: {
              type: 'number',
              example: 25000
            },
            securityDeposit: {
              type: 'number',
              example: 50000
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled', 'Terminated'],
              example: 'Confirmed'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // ===== PAYMENT SCHEMA =====
        Payment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439018'
            },
            bookingId: {
              type: 'string',
              example: '507f1f77bcf86cd799439017'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            ownerId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            amount: {
              type: 'number',
              example: 25000
            },
            paymentMethod: {
              type: 'string',
              enum: ['Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'],
              example: 'UPI'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
              example: 'Paid'
            },
            paymentDate: {
              type: 'string',
              format: 'date-time'
            },
            transactionId: {
              type: 'string',
              example: 'TXN12345678'
            }
          }
        },

        // ===== VERIFICATION SCHEMA =====
        Verification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439019'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            userType: {
              type: 'string',
              enum: ['tenant', 'owner', 'worker'],
              example: 'tenant'
            },
            documentType: {
              type: 'string',
              enum: ['Aadhar', 'PAN', 'Driving License', 'Passport'],
              example: 'Aadhar'
            },
            documentNumber: {
              type: 'string',
              example: '1234 5678 9012'
            },
            documentImage: {
              type: 'string',
              example: 'https://cloudinary.com/doc.jpg'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Verified', 'Rejected'],
              example: 'Verified'
            },
            verifiedBy: {
              type: 'string',
              example: '507f1f77bcf86cd799439014'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // ===== MAINTENANCE REQUEST SCHEMA =====
        MaintenanceRequest: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd79943901a'
            },
            propertyId: {
              type: 'string',
              example: '507f1f77bcf86cd799439016'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            workerId: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            issueType: {
              type: 'string',
              enum: ['Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Other'],
              example: 'Plumbing'
            },
            description: {
              type: 'string',
              example: 'Water leakage from ceiling'
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              example: ['https://cloudinary.com/issue.jpg']
            },
            priority: {
              type: 'string',
              enum: ['Low', 'Medium', 'High', 'Urgent'],
              example: 'High'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
              example: 'In Progress'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            completedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // ===== NOTIFICATION SCHEMA =====
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd79943901b'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            message: {
              type: 'string',
              example: 'Your booking has been confirmed'
            },
            type: {
              type: 'string',
              enum: ['Booking', 'Payment', 'Maintenance', 'System', 'Alert'],
              example: 'Booking'
            },
            isRead: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // ===== RESPONSE SCHEMAS =====
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            }
          }
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Something went wrong'
            }
          }
        },

        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            redirectUrl: {
              type: 'string',
              example: '/tenant/tenant_dashboard'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },

        CurrentUserResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439011'
                },
                email: {
                  type: 'string',
                  example: 'tenant@example.com'
                },
                userType: {
                  type: 'string',
                  enum: ['tenant', 'owner', 'worker', 'admin', 'superadmin'],
                  example: 'tenant'
                },
                firstName: {
                  type: 'string',
                  example: 'Raj'
                },
                lastName: {
                  type: 'string',
                  example: 'Kumar'
                },
                isSuperAdmin: {
                  type: 'boolean',
                  example: false
                }
              }
            },
            admin: {
              type: 'boolean',
              example: false
            }
          }
        }
      }
    },

    tags: [
      {
        name: 'Authentication',
        description: 'Login, registration, and password management'
      },
      {
        name: 'Properties',
        description: 'Property search, listing, and details'
      },
      {
        name: 'Bookings',
        description: 'Booking and reservation management'
      },
      {
        name: 'Workers',
        description: 'Worker/service provider management'
      },
      {
        name: 'Tenants',
        description: 'Tenant profile and operations'
      },
      {
        name: 'Owner',
        description: 'Property owner operations'
      },
      {
        name: 'Users',
        description: 'User profile and account management'
      },
      {
        name: 'Admin',
        description: 'Admin dashboard and statistics'
      },
      {
        name: 'Admin - Bookings',
        description: 'Admin booking management'
      },
      {
        name: 'Admin - Worker Bookings',
        description: 'Admin worker booking management'
      },
      {
        name: 'Admin - Notifications',
        description: 'Admin notification management'
      },
      {
        name: 'Admin - Maintenance',
        description: 'Admin maintenance management'
      },
      {
        name: 'Admin - Messages',
        description: 'Admin contact message management'
      },
      {
        name: 'Admin - Properties',
        description: 'Admin property management'
      },
      {
        name: 'Admin - Users',
        description: 'Admin user management'
      },
      {
        name: 'Admin - Payments',
        description: 'Admin payment management'
      },
      {
        name: 'Admin - Worker Payments',
        description: 'Admin worker payment management'
      },
      {
        name: 'Admin - Verifications',
        description: 'Admin user verification management'
      },
      {
        name: 'SuperAdmin',
        description: 'SuperAdmin platform management'
      },
      {
        name: 'SuperAdmin - Executives',
        description: 'SuperAdmin executive management'
      },
      {
        name: 'SuperAdmin - Settings',
        description: 'SuperAdmin system settings'
      },
      {
        name: 'SuperAdmin - Audit',
        description: 'SuperAdmin audit logging'
      },
      {
        name: 'Verification',
        description: 'User verification and KYC'
      },
      {
        name: 'Public',
        description: 'Public endpoints (no authentication required)'
      },
      {
        name: 'Test',
        description: 'Test endpoints for development'
      }
    ]
  },

  // Files to scan for swagger comments
  apis: [
    './routes/property.js',
    './routes/workers.js',
    './routes/tenant.js',
    './routes/owner.js',
    './routes/bookingRoutes.js',
    './routes/admin.js',
    './routes/superadmin.js',
    './routes/verification.js',
    './routes/adminUserVerifications.js',
    './app.js'
  ]
};

module.exports = swaggerJsdoc(options);
