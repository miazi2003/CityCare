export type ComplaintSlaStatus =
  | "ON_TIME"
  | "BREACHED"
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE"
  | null;

export interface IComplaintForSla {
  status: string;
  dueAt: Date | string | null;
  updatedAt?: Date | string;
  statusHistory?: Array<{
    toStatus: string;
    createdAt: Date | string;
  }>;
}

/**
 * Pure helper function to determine dynamic SLA status
 * based on dueAt, current status, and timestamps.
 */
export const getComplaintSlaStatus = (
  complaint: IComplaintForSla,
  currentTime: Date = new Date()
): ComplaintSlaStatus => {
  if (!complaint.dueAt) {
    return null;
  }

  // Cancelled or Rejected complaints do not have an active SLA
  if (complaint.status === "CANCELLED" || complaint.status === "REJECTED") {
    return null;
  }

  const dueDate = new Date(complaint.dueAt);

  // Completed complaints: RESOLVED or CLOSED
  if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
    let completionTime: Date | null = null;

    if (complaint.statusHistory && complaint.statusHistory.length > 0) {
      // Find all RESOLVED history entries, find the earliest one
      const resolvedEvents = complaint.statusHistory.filter(
        (h) => h.toStatus === "RESOLVED"
      );
      if (resolvedEvents.length > 0) {
        resolvedEvents.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        completionTime = new Date(resolvedEvents[0].createdAt);
      } else {
        // Fallback to CLOSED event if no RESOLVED
        const closedEvents = complaint.statusHistory.filter(
          (h) => h.toStatus === "CLOSED"
        );
        if (closedEvents.length > 0) {
          closedEvents.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          completionTime = new Date(closedEvents[0].createdAt);
        }
      }
    }

    if (!completionTime) {
      completionTime = complaint.updatedAt
        ? new Date(complaint.updatedAt)
        : currentTime;
    }

    return completionTime.getTime() <= dueDate.getTime()
      ? "COMPLETED_ON_TIME"
      : "COMPLETED_LATE";
  }

  // Active complaints: SUBMITTED, UNDER_REVIEW, ASSIGNED, IN_PROGRESS, REOPENED
  return currentTime.getTime() <= dueDate.getTime() ? "ON_TIME" : "BREACHED";
};

/**
 * Attaches the calculated slaStatus to a single complaint object.
 * Strips internal statusHistory used only for computation so the response shape is clean.
 */
export const attachSlaStatus = <T extends IComplaintForSla>(complaint: T) => {
  if (!complaint) return complaint;
  const slaStatus = getComplaintSlaStatus(complaint);
  const { statusHistory, ...rest } = complaint as any;
  return {
    ...rest,
    slaStatus,
  };
};

/**
 * Attaches the calculated slaStatus to an array of complaint objects.
 */
export const attachSlaStatusMany = <T extends IComplaintForSla>(
  complaints: T[]
) => {
  if (!complaints || !Array.isArray(complaints)) return complaints;
  return complaints.map((c) => attachSlaStatus(c));
};
