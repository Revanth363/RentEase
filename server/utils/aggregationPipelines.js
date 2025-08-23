/**
 * Aggregation Pipeline Utilities for Query Optimization
 * 
 * This file contains reusable aggregation pipeline builders that replace
 * N+1 queries with efficient single-query aggregations.
 * 
 * Benefits:
 * - Single database query instead of multiple queries
 * - Data fetching and joining done at database level
 * - Reduced network overhead
 * - Better memory efficiency
 */

const mongoose = require('mongoose');

/**
 * Build owner dashboard aggregation pipeline
 * Combines: owner, properties, tenants, payments, maintenance, complaints, agreements
 * Replaces ~15-20 separate queries with 1 aggregation
 */
function buildOwnerDashboardPipeline(ownerId) {
  return [
    // Stage 1: Match the owner
    {
      $match: {
        _id: new mongoose.Types.ObjectId(ownerId)
      }
    },
    // Stage 2: Lookup properties
    {
      $lookup: {
        from: 'properties',
        localField: '_id',
        foreignField: 'ownerId',
        as: 'properties'
      }
    },
    // Stage 3: Lookup tenants from properties
    {
      $lookup: {
        from: 'tenants',
        localField: 'properties.tenantId',
        foreignField: '_id',
        as: 'tenants'
      }
    },
    // Stage 4: Lookup payments by property
    {
      $lookup: {
        from: 'payments',
        localField: 'properties._id',
        foreignField: 'propertyId',
        as: 'payments'
      }
    },
    // Stage 5: Lookup maintenance requests
    {
      $lookup: {
        from: 'maintenancerequests',
        localField: 'tenants._id',
        foreignField: 'tenantId',
        as: 'maintenanceRequests'
      }
    },
    // Stage 6: Lookup complaints
    {
      $lookup: {
        from: 'complaints',
        localField: 'tenants._id',
        foreignField: 'tenantId',
        as: 'complaints'
      }
    },
    // Stage 7: Lookup agreements
    {
      $lookup: {
        from: 'agreements',
        localField: '_id',
        foreignField: 'ownerId',
        as: 'agreements'
      }
    },
    // Stage 8: Lookup notifications
    {
      $lookup: {
        from: 'notifications',
        localField: 'notificationIds',
        foreignField: '_id',
        as: 'notificationDetails'
      }
    },
    // Stage 9: Project only required fields
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        location: 1,
        properties: 1,
        tenants: 1,
        payments: 1,
        maintenanceRequests: 1,
        complaints: 1,
        agreements: 1,
        notificationDetails: 1
      }
    }
  ];
}

/**
 * Build tenant dashboard aggregation pipeline
 * Combines: tenant, properties, payments, maintenance, complaints, ratings, workers
 * Replaces ~15-20 separate queries with 1 aggregation
 */
function buildTenantDashboardPipeline(tenantId) {
  return [
    // Stage 1: Match the tenant
    {
      $match: {
        _id: new mongoose.Types.ObjectId(tenantId)
      }
    },
    // Stage 2: Lookup current property
    {
      $lookup: {
        from: 'properties',
        localField: '_id',
        foreignField: 'tenantId',
        as: 'currentProperty'
      }
    },
    // Stage 3: Lookup saved properties
    {
      $lookup: {
        from: 'properties',
        localField: 'savedListings',
        foreignField: '_id',
        as: 'savedListingsDetails'
      }
    },
    // Stage 4: Lookup maintenance requests
    {
      $lookup: {
        from: 'maintenancerequests',
        localField: 'maintenanceRequestIds',
        foreignField: '_id',
        as: 'maintenanceDetails'
      }
    },
    // Stage 5: Lookup complaints
    {
      $lookup: {
        from: 'complaints',
        localField: 'complaintIds',
        foreignField: '_id',
        as: 'complaintDetails'
      }
    },
    // Stage 6: Lookup payments
    {
      $lookup: {
        from: 'payments',
        localField: 'paymentIds',
        foreignField: '_id',
        as: 'paymentDetails'
      }
    },
    // Stage 7: Lookup domestic workers
    {
      $lookup: {
        from: 'workers',
        localField: 'domesticWorkerId',
        foreignField: '_id',
        as: 'domesticWorkerDetails'
      }
    },
    // Stage 8: Lookup worker ratings
    {
      $lookup: {
        from: 'ratings',
        localField: 'ratingIds',
        foreignField: '_id',
        as: 'ratingDetails'
      }
    },
    // Stage 9: Lookup notifications
    {
      $lookup: {
        from: 'notifications',
        localField: 'notificationIds',
        foreignField: '_id',
        as: 'notificationDetails'
      }
    },
    // Stage 10: Project required fields
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        location: 1,
        currentProperty: 1,
        savedListingsDetails: 1,
        maintenanceDetails: 1,
        complaintDetails: 1,
        paymentDetails: 1,
        domesticWorkerDetails: 1,
        ratingDetails: 1,
        notificationDetails: 1
      }
    }
  ];
}

/**
 * Build owner earnings aggregation pipeline
 * Replaces nested loops with single aggregation
 * Current: 400-600 queries, After: 1 query
 */
function buildOwnerEarningsPipeline() {
  return [
    // Stage 1: Lookup all properties for each owner
    {
      $lookup: {
        from: 'properties',
        localField: '_id',
        foreignField: 'ownerId',
        as: 'properties'
      }
    },
    // Stage 2: Unwind properties to process each property separately
    {
      $unwind: {
        path: '$properties',
        preserveNullAndEmptyArrays: true
      }
    },
    // Stage 3: Lookup active bookings for tenant info
    {
      $lookup: {
        from: 'bookings',
        let: { propertyId: '$properties._id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$propertyId', '$$propertyId'] },
              status: { $in: ['Active', 'Approved'] }
            }
          },
          { $limit: 1 }
        ],
        as: 'activeBooking'
      }
    },
    // Stage 4: Lookup tenant details from bookings
    {
      $lookup: {
        from: 'tenants',
        let: { tenantId: { $arrayElemAt: ['$activeBooking.tenantId', 0] } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$tenantId'] } } },
          { $project: { _id: 1, firstName: 1, lastName: 1 } }
        ],
        as: 'tenants'
      }
    },
    // Stage 5: Lookup all payments for this property
    {
      $lookup: {
        from: 'payments',
        localField: 'properties._id',
        foreignField: 'propertyId',
        as: 'payments'
      }
    },
    // Stage 6: Group by owner and rebuild properties array
    {
      $group: {
        _id: '$_id',
        firstName: { $first: '$firstName' },
        lastName: { $first: '$lastName' },
        email: { $first: '$email' },
        phone: { $first: '$phone' },
        status: { $first: '$status' },
        accountNo: { $first: '$accountNo' },
        upiid: { $first: '$upiid' },
        properties: {
          $push: {
            _id: '$properties._id',
            name: '$properties.name',
            price: '$properties.price',
            address: '$properties.address',
            location: '$properties.location',
            isRented: '$properties.isRented',
            tenants: '$tenants',
            payments: '$payments'
          }
        },
        payments: { $push: { $arrayElemAt: ['$payments', 0] } }
      }
    },
    // Stage 7: Project final output
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        status: 1,
        accountNo: 1,
        upiid: 1,
        properties: 1,
        payments: 1
      }
    }
  ];
}

/**
 * Build platform statistics aggregation pipeline
 * Combines multiple stat queries into single aggregation
 * Current: 8-10 queries, After: 1 query
 */
function buildPlatformStatsPipeline() {
  return [
    {
      $facet: {
        // Total users by type
        userStats: [
          { $match: { userType: { $in: ['owner', 'tenant', 'worker'] } } },
          {
            $group: {
              _id: '$userType',
              count: { $sum: 1 }
            }
          }
        ],
        // Payment statistics
        paymentStats: [
          { $match: {} },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' }
            }
          }
        ],
        // Property statistics
        propertyStats: [
          { $match: { userType: 'owner' } },
          {
            $group: {
              _id: null,
              totalProperties: { $sum: '$numProperties' },
              averageProperties: { $avg: '$numProperties' }
            }
          }
        ],
        // Booking statistics
        bookingStats: [
          { $match: {} },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ],
        // Revenue statistics
        revenueStats: [
          { $match: { status: 'Paid' } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              averageTransaction: { $avg: '$amount' },
              transactionCount: { $sum: 1 }
            }
          }
        ]
      }
    }
  ];
}

/**
 * Build maintenance requests aggregation pipeline
 * Combines maintenance with tenant and property details
 * Replaces nested populates with single query
 */
function buildMaintenanceRequestsPipeline(filters = {}) {
  return [
    // Stage 1: Match filters
    {
      $match: filters
    },
    // Stage 2: Lookup tenants
    {
      $lookup: {
        from: 'tenants',
        localField: 'tenantId',
        foreignField: '_id',
        as: 'tenant'
      }
    },
    // Stage 3: Unwind tenant (keep null if no match)
    {
      $unwind: {
        path: '$tenant',
        preserveNullAndEmptyArrays: true
      }
    },
    // Stage 4: Lookup properties
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'property'
      }
    },
    // Stage 5: Unwind property
    {
      $unwind: {
        path: '$property',
        preserveNullAndEmptyArrays: true
      }
    },
    // Stage 6: Lookup assigned worker
    {
      $lookup: {
        from: 'workers',
        localField: 'assignedWorker',
        foreignField: '_id',
        as: 'worker'
      }
    },
    // Stage 7: Unwind worker
    {
      $unwind: {
        path: '$worker',
        preserveNullAndEmptyArrays: true
      }
    },
    // Stage 8: Project final output
    {
      $project: {
        _id: 1,
        issueType: 1,
        description: 1,
        status: 1,
        dateReported: 1,
        scheduledDate: 1,
        completionDate: 1,
        tenantName: {
          $concat: [
            { $ifNull: ['$tenant.firstName', ''] },
            ' ',
            { $ifNull: ['$tenant.lastName', ''] }
          ]
        },
        propertyName: '$property.name',
        workerName: {
          $concat: [
            { $ifNull: ['$worker.firstName', ''] },
            ' ',
            { $ifNull: ['$worker.lastName', ''] }
          ]
        },
        tenant: 1,
        property: 1,
        worker: 1
      }
    },
    // Stage 9: Sort by date
    {
      $sort: { dateReported: -1 }
    }
  ];
}

/**
 * Build financial analytics aggregation pipeline
 * Single query for all financial metrics
 */
function buildFinancialAnalyticsPipeline(startDate, endDate) {
  return [
    {
      $facet: {
        // Daily revenue
        dailyRevenue: [
          {
            $match: {
              paymentDate: { $gte: startDate, $lte: endDate },
              status: 'Paid'
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
              revenue: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ],
        // Revenue by property
        revenueByProperty: [
          {
            $match: {
              paymentDate: { $gte: startDate, $lte: endDate },
              status: 'Paid'
            }
          },
          {
            $lookup: {
              from: 'properties',
              localField: 'propertyId',
              foreignField: '_id',
              as: 'property'
            }
          },
          {
            $group: {
              _id: '$propertyId',
              propertyName: { $first: { $arrayElemAt: ['$property.name', 0] } },
              revenue: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { revenue: -1 } }
        ],
        // Payment status breakdown
        paymentStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              amount: { $sum: '$amount' }
            }
          }
        ],
        // Commission analytics
        commissionAnalytics: [
          {
            $match: {
              paymentDate: { $gte: startDate, $lte: endDate },
              status: 'Paid'
            }
          },
          {
            $group: {
              _id: null,
              totalCommission: { $sum: '$commission' },
              totalAmount: { $sum: '$amount' },
              avgCommissionPercent: { $avg: '$commissionPercent' }
            }
          }
        ]
      }
    }
  ];
}

/**
 * Build worker dashboard aggregation pipeline
 * Combines worker stats, bookings, payments, ratings
 */
function buildWorkerDashboardPipeline(workerId) {
  return [
    // Stage 1: Match worker
    {
      $match: {
        _id: new mongoose.Types.ObjectId(workerId)
      }
    },
    // Stage 2: Lookup bookings
    {
      $lookup: {
        from: 'workerbookings',
        localField: '_id',
        foreignField: 'workerId',
        as: 'bookings'
      }
    },
    // Stage 3: Lookup payments
    {
      $lookup: {
        from: 'workerpayments',
        localField: '_id',
        foreignField: 'workerId',
        as: 'payments'
      }
    },
    // Stage 4: Lookup ratings
    {
      $lookup: {
        from: 'ratings',
        localField: '_id',
        foreignField: 'workerId',
        as: 'ratings'
      }
    },
    // Stage 5: Lookup clients (tenants)
    {
      $lookup: {
        from: 'tenants',
        localField: 'clientIds',
        foreignField: '_id',
        as: 'clients'
      }
    },
    // Stage 6: Lookup notifications
    {
      $lookup: {
        from: 'notifications',
        localField: 'notificationIds',
        foreignField: '_id',
        as: 'notifications'
      }
    },
    // Stage 7: Project with calculations
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        location: 1,
        serviceType: 1,
        price: 1,
        bookings: 1,
        payments: 1,
        ratings: 1,
        clients: 1,
        notifications: 1,
        totalBookings: { $size: '$bookings' },
        completedBookings: {
          $size: {
            $filter: {
              input: '$bookings',
              as: 'booking',
              cond: { $eq: ['$$booking.status', 'Completed'] }
            }
          }
        },
        totalEarnings: { $sum: '$payments.amount' },
        averageRating: { $avg: '$ratings.rating' }
      }
    }
  ];
}

/**
 * Build property search aggregation pipeline
 * Efficient search with filtering and sorting
 */
function buildPropertySearchPipeline(filters = {}, skip = 0, limit = 20) {
  const matchStage = { $match: {} };
  
  if (filters.location) {
    matchStage.$match.location = { $regex: filters.location, $options: 'i' };
  }
  if (filters.type) {
    matchStage.$match.type = filters.type;
  }
  if (filters.status !== undefined) {
    matchStage.$match.status = filters.status;
  }
  if (filters.priceMin || filters.priceMax) {
    matchStage.$match.price = {};
    if (filters.priceMin) matchStage.$match.price.$gte = filters.priceMin;
    if (filters.priceMax) matchStage.$match.price.$lte = filters.priceMax;
  }
  if (filters.isRented !== undefined) {
    matchStage.$match.isRented = filters.isRented;
  }

  return [
    matchStage,
    // Lookup owner details
    {
      $lookup: {
        from: 'owners',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner'
      }
    },
    // Lookup current tenant
    {
      $lookup: {
        from: 'tenants',
        localField: 'tenantId',
        foreignField: '_id',
        as: 'tenant'
      }
    },
    // Lookup active workers
    {
      $lookup: {
        from: 'workers',
        localField: 'activeWorkers',
        foreignField: '_id',
        as: 'workers'
      }
    },
    // Add metadata
    {
      $addFields: {
        ownerName: { $arrayElemAt: ['$owner.firstName', 0] },
        tenantName: { $arrayElemAt: ['$tenant.firstName', 0] },
        workerCount: { $size: '$workers' }
      }
    },
    // Sort
    {
      $sort: { createdAt: -1 }
    },
    // Paginate
    { $skip: skip },
    { $limit: limit },
    // Project
    {
      $project: {
        _id: 1,
        name: 1,
        location: 1,
        type: 1,
        price: 1,
        status: 1,
        isRented: 1,
        images: 1,
        rating: 1,
        ownerName: 1,
        workerCount: 1,
        tenantName: 1,
        createdAt: 1
      }
    }
  ];
}

module.exports = {
  buildOwnerDashboardPipeline,
  buildTenantDashboardPipeline,
  buildOwnerEarningsPipeline,
  buildPlatformStatsPipeline,
  buildMaintenanceRequestsPipeline,
  buildFinancialAnalyticsPipeline,
  buildWorkerDashboardPipeline,
  buildPropertySearchPipeline
};
