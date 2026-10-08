import type { ComplaintPriority, ComplaintStatus } from "./complaint";

export type ComplaintStatusCounts = {
  submitted: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  rejected: number;
  cancelled: number;
  reopened: number;
};

export type SlaAnalytics = {
  onTime: number;
  breached: number;
  completedOnTime: number;
  completedLate: number;
};

export type OverviewAnalytics = ComplaintStatusCounts & SlaAnalytics & {
  totalUsers: number;
  totalCitizens: number;
  totalStaff: number;
  totalDepartments: number;
  totalCategories: number;
  totalComplaints: number;
  totalFeedback: number;
  averageRating: number;
  totalMunicipalServices: number;
  totalServiceRequests: number;
  totalPaidServiceRequests: number;
  totalRevenue: number;
  statusCounts: ComplaintStatusCounts;
  slaStats: SlaAnalytics;
};

export type DepartmentAnalytics = ComplaintStatusCounts & {
  departmentId: string;
  departmentName: string;
  totalComplaints: number;
  breached: number;
  completedOnTime: number;
  completedLate: number;
  averageRating: number;
};

export type CategoryAnalytics = {
  categoryId: string;
  categoryName: string;
  departmentId: string;
  departmentName: string;
  totalComplaints: number;
  resolved: number;
  closed: number;
  rejected: number;
  breached: number;
  averageRating: number;
};

export type StaffAnalytics = {
  staffId: string;
  name: string;
  email: string;
  departmentId: string | null;
  departmentName: string;
  assignedComplaints: number;
  inProgress: number;
  resolved: number;
  closed: number;
  breached: number;
  completedOnTime: number;
  completedLate: number;
  averageRating: number;
};

export type TimeBasedComplaintAnalytics = {
  totalComplaints: number;
  statusCounts: Record<ComplaintStatus, number>;
  priorityCounts: Record<ComplaintPriority, number>;
  complaintsByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    count: number;
  }>;
  complaintsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    departmentId: string;
    count: number;
  }>;
};

export type ServiceAnalytics = {
  serviceId: string;
  serviceName: string;
  price: number;
  totalRequests: number;
  paidRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  revenue: number;
};

export type ServiceAndPaymentAnalytics = {
  totalServices: number;
  activeServices: number;
  totalServiceRequests: number;
  pendingPayment: number;
  paid: number;
  processing: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  services: ServiceAnalytics[];
  serviceWise: ServiceAnalytics[];
};

export type AnalyticsDateRange = {
  from?: string;
  to?: string;
};
