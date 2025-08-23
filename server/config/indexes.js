/**
 * MongoDB Indexes Configuration
 * 
 * This file defines all the critical database indexes for performance optimization.
 * Priority levels:
 * - P0: CRITICAL - Must have for basic performance
 * - P1: HIGH - Important for frequently accessed data
 * - P2: MEDIUM - Nice to have for edge cases
 */

const indexConfig = {
  // ============================================
  // PROPERTY COLLECTION INDEXES (P0 - Critical)
  // ============================================
  property: [
    {
      name: "idx_property_ownerId",
      spec: { ownerId: 1 },
      priority: "P0",
      expectedImpact: "30-40% owner query speedup",
      description: "Single index for owner dashboard queries"
    },
    {
      name: "idx_property_tenantId",
      spec: { tenantId: 1 },
      priority: "P0",
      expectedImpact: "30-40% tenant status queries",
      description: "Single index for tenant property lookups"
    },
    {
      name: "idx_property_status",
      spec: { status: 1 },
      priority: "P0",
      expectedImpact: "25-35% status filters",
      description: "Single index for property status filtering"
    },
    {
      name: "idx_property_isRented",
      spec: { isRented: 1 },
      priority: "P0",
      expectedImpact: "20-30% available property listing",
      description: "Single index for filtering rented/available properties"
    },
    {
      name: "idx_property_ownerId_status",
      spec: { ownerId: 1, status: 1 },
      priority: "P1",
      expectedImpact: "40-50% compound owner queries",
      description: "Compound index for owner + status filtering"
    },
    {
      name: "idx_property_location",
      spec: { location: 1 },
      priority: "P1",
      expectedImpact: "Location-based search speedup",
      description: "Single index for property location searches"
    }
  ],

  // ============================================
  // TENANT COLLECTION INDEXES (P0 - Critical)
  // ============================================
  tenant: [
    {
      name: "idx_tenant_email",
      spec: { email: 1 },
      priority: "P0",
      expectedImpact: "Auth queries speedup",
      description: "Unique index for email-based authentication"
    },
    {
      name: "idx_tenant_status",
      spec: { status: 1 },
      priority: "P1",
      expectedImpact: "Status filtering",
      description: "Single index for tenant status filtering"
    },
    {
      name: "idx_tenant_location",
      spec: { location: 1 },
      priority: "P2",
      expectedImpact: "Location-based tenant queries",
      description: "Single index for location filtering"
    }
  ],

  // ============================================
  // OWNER COLLECTION INDEXES (P0 - Critical)
  // ============================================
  owner: [
    {
      name: "idx_owner_email",
      spec: { email: 1 },
      priority: "P0",
      expectedImpact: "Auth queries speedup",
      description: "Unique index for email-based authentication"
    },
    {
      name: "idx_owner_status",
      spec: { status: 1 },
      priority: "P1",
      expectedImpact: "Status filtering",
      description: "Single index for owner status filtering"
    }
  ],

  // ============================================
  // WORKER COLLECTION INDEXES (P0 - Critical)
  // ============================================
  worker: [
    {
      name: "idx_worker_email",
      spec: { email: 1 },
      priority: "P0",
      expectedImpact: "Auth queries speedup",
      description: "Unique index for email-based authentication"
    },
    {
      name: "idx_worker_location_serviceType",
      spec: { location: 1, serviceType: 1 },
      priority: "P1",
      expectedImpact: "50-60% worker search speedup",
      description: "Compound index for worker search and filtering"
    },
    {
      name: "idx_worker_status",
      spec: { status: 1 },
      priority: "P1",
      expectedImpact: "Status filtering",
      description: "Single index for worker status filtering"
    },
    {
      name: "idx_worker_area",
      spec: { area: 1 },
      priority: "P2",
      expectedImpact: "Area-based worker queries",
      description: "Single index for worker area filtering"
    }
  ],

  // ============================================
  // PAYMENT COLLECTION INDEXES (P0 - Critical)
  // ============================================
  payment: [
    {
      name: "idx_payment_tenantId_status",
      spec: { tenantId: 1, status: 1 },
      priority: "P0",
      expectedImpact: "50% payment filtering",
      description: "Compound index for tenant payment queries with status"
    },
    {
      name: "idx_payment_propertyId",
      spec: { propertyId: 1 },
      priority: "P0",
      expectedImpact: "40-50% owner earnings queries",
      description: "Single index for property revenue calculations"
    },
    {
      name: "idx_payment_ownerId",
      spec: { ownerId: 1 },
      priority: "P0",
      expectedImpact: "Owner payment history",
      description: "Single index for owner payment lookups"
    },
    {
      name: "idx_payment_status",
      spec: { status: 1 },
      priority: "P1",
      expectedImpact: "Dashboard aggregations",
      description: "Single index for payment status filtering"
    },
    {
      name: "idx_payment_propertyId_status",
      spec: { propertyId: 1, status: 1 },
      priority: "P1",
      expectedImpact: "Property-specific status queries",
      description: "Compound index for property payment status"
    },
    {
      name: "idx_payment_createdAt",
      spec: { createdAt: -1 },
      priority: "P2",
      expectedImpact: "Time-based queries",
      description: "Descending index for date-based sorting"
    }
  ],

  // ============================================
  // BOOKING COLLECTION INDEXES (P0 - Critical)
  // ============================================
  booking: [
    {
      name: "idx_booking_tenantId_status",
      spec: { tenantId: 1, status: 1 },
      priority: "P0",
      expectedImpact: "40% booking queries",
      description: "Compound index for tenant booking lookups"
    },
    {
      name: "idx_booking_propertyId",
      spec: { propertyId: 1 },
      priority: "P0",
      expectedImpact: "Property booking queries",
      description: "Single index for property booking lookups"
    },
    {
      name: "idx_booking_status",
      spec: { status: 1 },
      priority: "P1",
      expectedImpact: "Status-based filtering",
      description: "Single index for booking status filtering"
    },
    {
      name: "idx_booking_ownerId",
      spec: { ownerId: 1 },
      priority: "P1",
      expectedImpact: "Owner booking management",
      description: "Single index for owner's bookings"
    }
  ],

  // ============================================
  // MAINTENANCE REQUEST INDEXES (P1 - High)
  // ============================================
  maintenanceRequest: [
    {
      name: "idx_maintenance_propertyId_tenantId",
      spec: { propertyId: 1, tenantId: 1 },
      priority: "P0",
      expectedImpact: "35-40% maintenance queries",
      description: "Compound index for property and tenant maintenance lookups"
    },
    {
      name: "idx_maintenance_status",
      spec: { status: 1 },
      priority: "P1",
      expectedImpact: "Status filtering",
      description: "Single index for maintenance status filtering"
    },
    {
      name: "idx_maintenance_assignedWorker",
      spec: { assignedWorker: 1 },
      priority: "P1",
      expectedImpact: "Worker maintenance tracking",
      description: "Single index for worker's maintenance requests"
    }
  ],

  // ============================================
  // NOTIFICATION COLLECTION INDEXES (P1 - High)
  // ============================================
  notification: [
    {
      name: "idx_notification_recipient_type",
      spec: { recipient: 1, recipientType: 1 },
      priority: "P0",
      expectedImpact: "30% notification retrieval",
      description: "Compound index for user notifications with type"
    },
    {
      name: "idx_notification_read",
      spec: { read: 1 },
      priority: "P1",
      expectedImpact: "Unread notifications queries",
      description: "Single index for read/unread status"
    },
    {
      name: "idx_notification_createdAt",
      spec: { createdAt: -1 },
      priority: "P2",
      expectedImpact: "Recent notifications",
      description: "Descending index for notification ordering"
    }
  ],

  // ============================================
  // WORKER BOOKING COLLECTION INDEXES (P1 - High)
  // ============================================
  workerBooking: [
    {
      name: "idx_workerBooking_workerId",
      spec: { workerId: 1 },
      priority: "P1",
      expectedImpact: "40-50% worker schedule queries",
      description: "Single index for worker's bookings"
    },
    {
      name: "idx_workerBooking_tenantId",
      spec: { tenantId: 1 },
      priority: "P1",
      expectedImpact: "Tenant booking management",
      description: "Single index for tenant's worker bookings"
    },
    {
      name: "idx_workerBooking_workerId_status",
      spec: { workerId: 1, status: 1 },
      priority: "P1",
      expectedImpact: "Worker status-based queries",
      description: "Compound index for worker bookings by status"
    },
    {
      name: "idx_workerBooking_status",
      spec: { status: 1 },
      priority: "P2",
      expectedImpact: "Booking status filtering",
      description: "Single index for booking status"
    }
  ],

  // ============================================
  // WORKER PAYMENT COLLECTION INDEXES (P1 - High)
  // ============================================
  workerPayment: [
    {
      name: "idx_workerPayment_workerId",
      spec: { workerId: 1 },
      priority: "P1",
      expectedImpact: "50-60% worker payment history",
      description: "Single index for worker's payments"
    },
    {
      name: "idx_workerPayment_tenantId",
      spec: { tenantId: 1 },
      priority: "P1",
      expectedImpact: "Tenant payment tracking",
      description: "Single index for tenant-worker payments"
    },
    {
      name: "idx_workerPayment_workerId_tenantId",
      spec: { workerId: 1, tenantId: 1 },
      priority: "P1",
      expectedImpact: "Combined lookups",
      description: "Compound index for worker-tenant payment history"
    }
  ],

  // ============================================
  // AGREEMENT COLLECTION INDEXES (P2 - Medium)
  // ============================================
  agreement: [
    {
      name: "idx_agreement_ownerId",
      spec: { ownerId: 1 },
      priority: "P2",
      expectedImpact: "Owner agreement lookups",
      description: "Single index for owner's agreements"
    }
  ]
};

/**
 * Helper function to get all indexes in a specific format
 */
const getIndexesByPriority = (priority) => {
  const result = {};
  for (const [collection, indexes] of Object.entries(indexConfig)) {
    const filtered = indexes.filter(idx => idx.priority === priority);
    if (filtered.length > 0) {
      result[collection] = filtered;
    }
  }
  return result;
};

/**
 * Helper function to generate Mongoose index definitions
 */
const getMongooseIndexDefinitions = (collectionName) => {
  return indexConfig[collectionName]?.map(idx => ({
    spec: idx.spec,
    options: { name: idx.name, sparse: false }
  })) || [];
};

/**
 * Summary statistics
 */
const getIndexStatistics = () => {
  let totalIndexes = 0;
  let p0Count = 0;
  let p1Count = 0;
  let p2Count = 0;

  for (const indexes of Object.values(indexConfig)) {
    indexes.forEach(idx => {
      totalIndexes++;
      if (idx.priority === "P0") p0Count++;
      else if (idx.priority === "P1") p1Count++;
      else if (idx.priority === "P2") p2Count++;
    });
  }

  return {
    totalIndexes,
    p0Count,
    p1Count,
    p2Count,
    distribution: {
      critical: `${p0Count} (${((p0Count/totalIndexes)*100).toFixed(1)}%)`,
      high: `${p1Count} (${((p1Count/totalIndexes)*100).toFixed(1)}%)`,
      medium: `${p2Count} (${((p2Count/totalIndexes)*100).toFixed(1)}%)`
    }
  };
};

module.exports = {
  indexConfig,
  getIndexesByPriority,
  getMongooseIndexDefinitions,
  getIndexStatistics
};
