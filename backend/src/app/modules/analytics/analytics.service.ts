import prisma from "../../lib/prisma";
import { getComplaintSlaStatus } from "../complaint/complaint.utils";

// 1. Overview analytics dashboard
export const getOverviewAnalyticsFromDB = async () => {
  const [
    totalUsers,
    totalCitizens,
    totalStaff,
    totalDepartments,
    totalCategories,
    totalComplaints,
    totalFeedback,
    feedbackRatingAgg,
    totalMunicipalServices,
    totalServiceRequests,
    totalPaidServiceRequests,
    revenueAgg,
    statusGroup,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CITIZEN" } }),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.department.count(),
    prisma.category.count(),
    prisma.complaint.count(),
    prisma.feedback.count(),
    prisma.feedback.aggregate({ _avg: { rating: true } }),
    prisma.municipalService.count(),
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({
      where: { status: { in: ["PAID", "PROCESSING", "COMPLETED"] } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
    prisma.complaint.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const averageRating = feedbackRatingAgg._avg.rating
    ? Number(feedbackRatingAgg._avg.rating.toFixed(2))
    : 0;

  const totalRevenue = revenueAgg._sum.amount
    ? Number(revenueAgg._sum.amount)
    : 0;

  // Initialize status counts
  const statusCounts = {
    submitted: 0,
    underReview: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    rejected: 0,
    cancelled: 0,
    reopened: 0,
  };

  for (const item of statusGroup) {
    switch (item.status) {
      case "SUBMITTED":
        statusCounts.submitted = item._count.id;
        break;
      case "UNDER_REVIEW":
        statusCounts.underReview = item._count.id;
        break;
      case "ASSIGNED":
        statusCounts.assigned = item._count.id;
        break;
      case "IN_PROGRESS":
        statusCounts.inProgress = item._count.id;
        break;
      case "RESOLVED":
        statusCounts.resolved = item._count.id;
        break;
      case "CLOSED":
        statusCounts.closed = item._count.id;
        break;
      case "REJECTED":
        statusCounts.rejected = item._count.id;
        break;
      case "CANCELLED":
        statusCounts.cancelled = item._count.id;
        break;
      case "REOPENED":
        statusCounts.reopened = item._count.id;
        break;
    }
  }

  // Calculate dynamic SLA stats from complaints with dueAt
  const complaintsForSla = await prisma.complaint.findMany({
    where: {
      dueAt: { not: null },
      status: { notIn: ["CANCELLED", "REJECTED"] },
    },
    select: {
      status: true,
      dueAt: true,
      updatedAt: true,
      statusHistory: {
        where: { toStatus: { in: ["RESOLVED", "CLOSED"] } },
        select: { toStatus: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  let onTime = 0;
  let breached = 0;
  let completedOnTime = 0;
  let completedLate = 0;

  for (const complaint of complaintsForSla) {
    const slaStatus = getComplaintSlaStatus(complaint);
    if (slaStatus === "ON_TIME") onTime++;
    else if (slaStatus === "BREACHED") breached++;
    else if (slaStatus === "COMPLETED_ON_TIME") completedOnTime++;
    else if (slaStatus === "COMPLETED_LATE") completedLate++;
  }

  return {
    totalUsers,
    totalCitizens,
    totalStaff,
    totalDepartments,
    totalCategories,
    totalComplaints,
    totalFeedback,
    averageRating,
    totalMunicipalServices,
    totalServiceRequests,
    totalPaidServiceRequests,
    totalRevenue,
    statusCounts,
    slaStats: {
      onTime,
      breached,
      completedOnTime,
      completedLate,
    },
    // Top-level aliases for direct access
    submitted: statusCounts.submitted,
    underReview: statusCounts.underReview,
    assigned: statusCounts.assigned,
    inProgress: statusCounts.inProgress,
    resolved: statusCounts.resolved,
    closed: statusCounts.closed,
    rejected: statusCounts.rejected,
    cancelled: statusCounts.cancelled,
    reopened: statusCounts.reopened,
    onTime,
    breached,
    completedOnTime,
    completedLate,
  };
};

// 2. Department-wise complaint performance
export const getDepartmentPerformanceFromDB = async () => {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const complaints = await prisma.complaint.findMany({
    select: {
      id: true,
      departmentId: true,
      status: true,
      dueAt: true,
      updatedAt: true,
      statusHistory: {
        where: { toStatus: { in: ["RESOLVED", "CLOSED"] } },
        select: { toStatus: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      feedback: {
        select: { rating: true },
      },
    },
  });

  // Group complaints by department
  const complaintsByDept = new Map<string, typeof complaints>();
  for (const dept of departments) {
    complaintsByDept.set(dept.id, []);
  }

  for (const complaint of complaints) {
    const list = complaintsByDept.get(complaint.departmentId);
    if (list) {
      list.push(complaint);
    }
  }

  return departments.map((dept) => {
    const deptComplaints = complaintsByDept.get(dept.id) || [];

    let submitted = 0;
    let underReview = 0;
    let assigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let rejected = 0;
    let cancelled = 0;
    let reopened = 0;

    let breached = 0;
    let completedOnTime = 0;
    let completedLate = 0;

    let totalRating = 0;
    let ratingCount = 0;

    for (const c of deptComplaints) {
      switch (c.status) {
        case "SUBMITTED":
          submitted++;
          break;
        case "UNDER_REVIEW":
          underReview++;
          break;
        case "ASSIGNED":
          assigned++;
          break;
        case "IN_PROGRESS":
          inProgress++;
          break;
        case "RESOLVED":
          resolved++;
          break;
        case "CLOSED":
          closed++;
          break;
        case "REJECTED":
          rejected++;
          break;
        case "CANCELLED":
          cancelled++;
          break;
        case "REOPENED":
          reopened++;
          break;
      }

      const slaStatus = getComplaintSlaStatus(c);
      if (slaStatus === "BREACHED") breached++;
      else if (slaStatus === "COMPLETED_ON_TIME") completedOnTime++;
      else if (slaStatus === "COMPLETED_LATE") completedLate++;

      if (c.feedback?.rating) {
        totalRating += c.feedback.rating;
        ratingCount++;
      }
    }

    const averageRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : 0;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      totalComplaints: deptComplaints.length,
      submitted,
      underReview,
      assigned,
      inProgress,
      resolved,
      closed,
      rejected,
      cancelled,
      reopened,
      breached,
      completedOnTime,
      completedLate,
      averageRating,
    };
  });
};

// 3. Category-wise complaint statistics
export const getCategoryPerformanceFromDB = async () => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
  });

  const complaints = await prisma.complaint.findMany({
    select: {
      id: true,
      categoryId: true,
      status: true,
      dueAt: true,
      updatedAt: true,
      statusHistory: {
        where: { toStatus: { in: ["RESOLVED", "CLOSED"] } },
        select: { toStatus: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      feedback: {
        select: { rating: true },
      },
    },
  });

  // Group complaints by category
  const complaintsByCat = new Map<string, typeof complaints>();
  for (const cat of categories) {
    complaintsByCat.set(cat.id, []);
  }

  for (const complaint of complaints) {
    const list = complaintsByCat.get(complaint.categoryId);
    if (list) {
      list.push(complaint);
    }
  }

  const result = categories.map((cat) => {
    const catComplaints = complaintsByCat.get(cat.id) || [];

    let resolved = 0;
    let closed = 0;
    let rejected = 0;
    let breached = 0;

    let totalRating = 0;
    let ratingCount = 0;

    for (const c of catComplaints) {
      if (c.status === "RESOLVED") resolved++;
      if (c.status === "CLOSED") closed++;
      if (c.status === "REJECTED") rejected++;

      const slaStatus = getComplaintSlaStatus(c);
      if (slaStatus === "BREACHED") breached++;

      if (c.feedback?.rating) {
        totalRating += c.feedback.rating;
        ratingCount++;
      }
    }

    const averageRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      departmentId: cat.departmentId,
      departmentName: cat.department?.name || "",
      totalComplaints: catComplaints.length,
      resolved,
      closed,
      rejected,
      breached,
      averageRating,
    };
  });

  // Sort by total complaints descending
  result.sort((a, b) => b.totalComplaints - a.totalComplaints);

  return result;
};

// 4. Staff-wise complaint performance
export const getStaffPerformanceFromDB = async () => {
  const staffMembers = await prisma.user.findMany({
    where: { role: "STAFF", isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const complaints = await prisma.complaint.findMany({
    where: { assignedStaffId: { not: null } },
    select: {
      id: true,
      assignedStaffId: true,
      status: true,
      dueAt: true,
      updatedAt: true,
      statusHistory: {
        where: { toStatus: { in: ["RESOLVED", "CLOSED"] } },
        select: { toStatus: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      feedback: {
        select: { rating: true },
      },
    },
  });

  const complaintsByStaff = new Map<string, typeof complaints>();
  for (const staff of staffMembers) {
    complaintsByStaff.set(staff.id, []);
  }

  for (const complaint of complaints) {
    if (complaint.assignedStaffId) {
      const list = complaintsByStaff.get(complaint.assignedStaffId);
      if (list) {
        list.push(complaint);
      }
    }
  }

  return staffMembers.map((staff) => {
    const staffComplaints = complaintsByStaff.get(staff.id) || [];

    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let breached = 0;
    let completedOnTime = 0;
    let completedLate = 0;

    let totalRating = 0;
    let ratingCount = 0;

    for (const c of staffComplaints) {
      if (c.status === "IN_PROGRESS") inProgress++;
      if (c.status === "RESOLVED") resolved++;
      if (c.status === "CLOSED") closed++;

      const slaStatus = getComplaintSlaStatus(c);
      if (slaStatus === "BREACHED") breached++;
      else if (slaStatus === "COMPLETED_ON_TIME") completedOnTime++;
      else if (slaStatus === "COMPLETED_LATE") completedLate++;

      if (c.feedback?.rating) {
        totalRating += c.feedback.rating;
        ratingCount++;
      }
    }

    const averageRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : 0;

    return {
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      departmentId: staff.departmentId,
      departmentName: staff.department?.name || "",
      assignedComplaints: staffComplaints.length,
      inProgress,
      resolved,
      closed,
      breached,
      completedOnTime,
      completedLate,
      averageRating,
    };
  });
};

// 5. Time-based complaint report with optional from and to dates
export const getTimeBasedComplaintAnalyticsFromDB = async (
  from?: string,
  to?: string
) => {
  const whereClause: any = {};

  if (from || to) {
    whereClause.createdAt = {};
    if (from) {
      whereClause.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to) {
      whereClause.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }
  }

  const complaints = await prisma.complaint.findMany({
    where: whereClause,
    select: {
      id: true,
      status: true,
      priority: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
  });

  const statusCounts = {
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
    REJECTED: 0,
    CANCELLED: 0,
    REOPENED: 0,
  };

  const priorityCounts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  const deptMap = new Map<string, { departmentId: string; departmentName: string; count: number }>();
  const catMap = new Map<string, { categoryId: string; categoryName: string; departmentId: string; count: number }>();

  for (const c of complaints) {
    if (c.status in statusCounts) {
      statusCounts[c.status as keyof typeof statusCounts]++;
    }

    if (c.priority in priorityCounts) {
      priorityCounts[c.priority as keyof typeof priorityCounts]++;
    }

    // Department grouping
    if (c.departmentId && c.department) {
      const existing = deptMap.get(c.departmentId);
      if (existing) {
        existing.count++;
      } else {
        deptMap.set(c.departmentId, {
          departmentId: c.departmentId,
          departmentName: c.department.name,
          count: 1,
        });
      }
    }

    // Category grouping
    if (c.categoryId && c.category) {
      const existing = catMap.get(c.categoryId);
      if (existing) {
        existing.count++;
      } else {
        catMap.set(c.categoryId, {
          categoryId: c.categoryId,
          categoryName: c.category.name,
          departmentId: c.departmentId,
          count: 1,
        });
      }
    }
  }

  const complaintsByDepartment = Array.from(deptMap.values()).sort((a, b) => b.count - a.count);
  const complaintsByCategory = Array.from(catMap.values()).sort((a, b) => b.count - a.count);

  return {
    totalComplaints: complaints.length,
    statusCounts,
    priorityCounts,
    complaintsByDepartment,
    complaintsByCategory,
  };
};

// 6. Municipal service and payment statistics
export const getServiceAndPaymentAnalyticsFromDB = async () => {
  const [
    totalServices,
    activeServices,
    totalServiceRequests,
    pendingPayment,
    paid,
    processing,
    completed,
    cancelled,
    revenueAgg,
    services,
    serviceRequests,
  ] = await Promise.all([
    prisma.municipalService.count(),
    prisma.municipalService.count({ where: { isActive: true } }),
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.serviceRequest.count({ where: { status: "PAID" } }),
    prisma.serviceRequest.count({ where: { status: "PROCESSING" } }),
    prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
    prisma.serviceRequest.count({ where: { status: "CANCELLED" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
    prisma.municipalService.findMany({
      select: { id: true, name: true, price: true },
      orderBy: { name: "asc" },
    }),
    prisma.serviceRequest.findMany({
      select: {
        id: true,
        serviceId: true,
        status: true,
        amount: true,
        payment: {
          select: { status: true, amount: true },
        },
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0;

  // Group requests by service
  const requestsByService = new Map<string, typeof serviceRequests>();
  for (const s of services) {
    requestsByService.set(s.id, []);
  }

  for (const req of serviceRequests) {
    const list = requestsByService.get(req.serviceId);
    if (list) {
      list.push(req);
    }
  }

  const serviceWise = services.map((s) => {
    const reqs = requestsByService.get(s.id) || [];

    let paidRequests = 0;
    let completedRequests = 0;
    let cancelledRequests = 0;
    let revenue = 0;

    for (const r of reqs) {
      if (r.status === "COMPLETED") completedRequests++;
      if (r.status === "CANCELLED") cancelledRequests++;

      const isPaid =
        r.status === "PAID" ||
        r.status === "PROCESSING" ||
        r.status === "COMPLETED" ||
        r.payment?.status === "PAID";

      if (isPaid) {
        paidRequests++;
        const paidAmount = r.payment?.status === "PAID" && r.payment?.amount
          ? Number(r.payment.amount)
          : Number(r.amount);
        revenue += paidAmount;
      }
    }

    return {
      serviceId: s.id,
      serviceName: s.name,
      price: Number(s.price),
      totalRequests: reqs.length,
      paidRequests,
      completedRequests,
      cancelledRequests,
      revenue,
    };
  });

  return {
    totalServices,
    activeServices,
    totalServiceRequests,
    pendingPayment,
    paid,
    processing,
    completed,
    cancelled,
    totalRevenue,
    services: serviceWise,
    serviceWise,
  };
};

