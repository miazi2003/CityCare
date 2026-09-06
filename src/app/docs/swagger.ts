import { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "CivicFlow API",
    version: "1.0.0",
    description:
      "Comprehensive REST API for CivicFlow — City Complaint & Service Request Platform. Provides municipal complaint lifecycle tracking, SLA monitoring, paid city services with Stripe payment integration, notifications, audit logging, and administrative analytics.",
    contact: {
      name: "CivicFlow Engineering",
      email: "support@civicflow.gov",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "Default API Base URL",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JWT Bearer token obtained from /auth/login or /auth/google.",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object", nullable: true },
        },
      },
    },
  },
  paths: {
    // -------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register citizen account",
        description: "Creates a new user account strictly defaulted to CITIZEN role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Citizen" },
                  email: { type: "string", format: "email", example: "jane@citizen.com" },
                  password: { type: "string", minLength: 6, example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error or email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User login",
        description: "Authenticates citizen, staff, or admin with email & password, returning a JWT token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@civicflow.com" },
                  password: { type: "string", example: "admin123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful; returns user profile and JWT token" },
          400: { description: "Validation error" },
          401: { description: "Invalid email or password" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Current user profile (passwords omitted)" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/google": {
      get: {
        tags: ["Auth"],
        summary: "Initiate Google / GCP OAuth 2.0 login",
        description: "Redirects browser to Google consent screen, or returns auth URL if requested via JSON.",
        responses: {
          302: { description: "Redirects to Google OAuth 2.0" },
          200: { description: "Returns { url } when redirect=false is provided" },
        },
      },
      post: {
        tags: ["Auth"],
        summary: "Direct Google ID token login",
        description: "Validates Google ID token from frontend/mobile client, creates CITIZEN if new, and returns JWT.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idToken"],
                properties: {
                  idToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Google authentication successful" },
          401: { description: "Invalid Google ID token" },
        },
      },
    },
    "/auth/google/callback": {
      get: {
        tags: ["Auth"],
        summary: "Google OAuth callback endpoint",
        parameters: [
          { name: "code", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Returns authenticated user and JWT token" },
          400: { description: "Authorization code missing or invalid" },
        },
      },
    },

    // -------------------------------------------------------------
    // DEPARTMENTS
    // -------------------------------------------------------------
    "/departments": {
      get: {
        tags: ["Departments"],
        summary: "List all departments (Public/Authenticated)",
        responses: { 200: { description: "List of departments" } },
      },
      post: {
        tags: ["Departments"],
        summary: "Create department (ADMIN only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Water & Sanitation" },
                  description: { type: "string", example: "Manages public water supply and drainage" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Department created" },
          403: { description: "Forbidden - ADMIN only" },
        },
      },
    },
    "/departments/{id}": {
      get: {
        tags: ["Departments"],
        summary: "Get single department",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Department details" } },
      },
      patch: {
        tags: ["Departments"],
        summary: "Update department (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Department updated" } },
      },
    },
    "/departments/{id}/deactivate": {
      patch: {
        tags: ["Departments"],
        summary: "Deactivate department (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Department deactivated" } },
      },
    },

    // -------------------------------------------------------------
    // CATEGORIES
    // -------------------------------------------------------------
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories",
        parameters: [{ name: "departmentId", in: "query", schema: { type: "string" } }],
        responses: { 200: { description: "List of categories" } },
      },
      post: {
        tags: ["Categories"],
        summary: "Create category (ADMIN only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "slaHours", "departmentId"],
                properties: {
                  name: { type: "string", example: "Water Leakage" },
                  slaHours: { type: "integer", example: 48 },
                  departmentId: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Category created" } },
      },
    },
    "/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get single category",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Category details" } },
      },
      patch: {
        tags: ["Categories"],
        summary: "Update category (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Category updated" } },
      },
    },
    "/categories/{id}/deactivate": {
      patch: {
        tags: ["Categories"],
        summary: "Deactivate category (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Category deactivated" } },
      },
    },

    // -------------------------------------------------------------
    // STAFF
    // -------------------------------------------------------------
    "/staff": {
      get: {
        tags: ["Staff"],
        summary: "List staff members (ADMIN only, with optional departmentId filter)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "departmentId", in: "query", schema: { type: "string" } }],
        responses: { 200: { description: "List of staff members" } },
      },
      post: {
        tags: ["Staff"],
        summary: "Create staff member (ADMIN only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "departmentId"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  departmentId: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Staff created" } },
      },
    },
    "/staff/{id}": {
      get: {
        tags: ["Staff"],
        summary: "Get single staff member (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Staff member details" } },
      },
      patch: {
        tags: ["Staff"],
        summary: "Update staff member (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Staff member updated" } },
      },
    },
    "/staff/{id}/deactivate": {
      patch: {
        tags: ["Staff"],
        summary: "Deactivate staff member (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Staff deactivated" } },
      },
    },

    // -------------------------------------------------------------
    // COMPLAINTS
    // -------------------------------------------------------------
    "/complaints": {
      get: {
        tags: ["Complaints"],
        summary: "List complaints (Role-scoped: Admin sees all, Staff sees department)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "departmentId", in: "query", schema: { type: "string" } },
          { name: "priority", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "List of complaints" } },
      },
      post: {
        tags: ["Complaints"],
        summary: "Create complaint (CITIZEN only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "location", "categoryId", "departmentId"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  categoryId: { type: "string" },
                  departmentId: { type: "string" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Complaint created" } },
      },
    },
    "/complaints/my": {
      get: {
        tags: ["Complaints"],
        summary: "List current citizen's own complaints (CITIZEN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Citizen's complaint list" } },
      },
    },
    "/complaints/breached": {
      get: {
        tags: ["Complaints"],
        summary: "List all SLA-breached complaints (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of breached complaints" } },
      },
    },
    "/complaints/{id}": {
      get: {
        tags: ["Complaints"],
        summary: "Get single complaint details (Citizen owner, Department Staff, or Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Complaint details" } },
      },
    },
    "/complaints/{id}/review": {
      patch: {
        tags: ["Complaints"],
        summary: "Review complaint (ADMIN only: transition SUBMITTED -> UNDER_REVIEW)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Complaint reviewed" } },
      },
    },
    "/complaints/{id}/assign": {
      patch: {
        tags: ["Complaints"],
        summary: "Assign complaint to staff member (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["staffId"],
                properties: { staffId: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Complaint assigned" } },
      },
    },
    "/complaints/{id}/status": {
      patch: {
        tags: ["Complaints"],
        summary: "Start work on complaint (Assigned STAFF only: ASSIGNED -> IN_PROGRESS)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Status updated to IN_PROGRESS" } },
      },
    },
    "/complaints/{id}/resolve": {
      patch: {
        tags: ["Complaints"],
        summary: "Resolve complaint (Assigned STAFF only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["note"],
                properties: { note: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Complaint marked as RESOLVED" } },
      },
    },
    "/complaints/{id}/close": {
      patch: {
        tags: ["Complaints"],
        summary: "Close resolved complaint (Citizen owner only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Complaint marked as CLOSED" } },
      },
    },
    "/complaints/{id}/reopen": {
      patch: {
        tags: ["Complaints"],
        summary: "Reopen closed complaint (Citizen owner only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["note"],
                properties: { note: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Complaint marked as REOPENED" } },
      },
    },
    "/complaints/{id}/cancel": {
      patch: {
        tags: ["Complaints"],
        summary: "Cancel complaint (Citizen owner only, before assignment)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Complaint CANCELLED" } },
      },
    },
    "/complaints/{id}/history": {
      get: {
        tags: ["Complaints"],
        summary: "Get full chronological status history for complaint",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Chronological status history" } },
      },
    },
    "/complaints/{id}/sla": {
      get: {
        tags: ["Complaints"],
        summary: "Get dynamic SLA calculation for complaint",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "SLA status details" } },
      },
    },

    // -------------------------------------------------------------
    // FEEDBACK
    // -------------------------------------------------------------
    "/feedback": {
      get: {
        tags: ["Feedback"],
        summary: "List all feedback records (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of feedback entries" } },
      },
      post: {
        tags: ["Feedback"],
        summary: "Submit rating & comment for CLOSED complaint (Citizen owner only, max 1)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["complaintId", "rating"],
                properties: {
                  complaintId: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", example: "Issue was resolved quickly and effectively." },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Feedback submitted" },
          400: { description: "Invalid rating or complaint not CLOSED or duplicate feedback" },
        },
      },
    },

    // -------------------------------------------------------------
    // MUNICIPAL SERVICES & PAYMENTS
    // -------------------------------------------------------------
    "/services": {
      get: {
        tags: ["Services"],
        summary: "List all municipal services (Public/Citizen)",
        responses: { 200: { description: "List of services" } },
      },
      post: {
        tags: ["Services"],
        summary: "Create municipal service (ADMIN only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price"],
                properties: {
                  name: { type: "string", example: "Special Waste Collection" },
                  price: { type: "number", example: 45.0 },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Service created" } },
      },
    },
    "/service-requests": {
      get: {
        tags: ["Service Requests"],
        summary: "List service requests (Role-scoped: Admin sees all, Citizen sees own)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of service requests" } },
      },
      post: {
        tags: ["Service Requests"],
        summary: "Create service request (CITIZEN only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serviceId", "location", "quantity"],
                properties: {
                  serviceId: { type: "string" },
                  location: { type: "string" },
                  quantity: { type: "integer", minimum: 1, maximum: 20, example: 1 },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Service request created" } },
      },
    },
    "/payments/checkout-session": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe Checkout Session for service request (CITIZEN only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serviceRequestId"],
                properties: { serviceRequestId: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Stripe checkout URL and session details" } },
      },
    },
    "/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Stripe webhook endpoint for payment event verification",
        description: "Verifies Stripe cryptographic signature using STRIPE_WEBHOOK_SECRET and updates payment/service request status.",
        responses: { 200: { description: "Webhook handled" } },
      },
    },

    // -------------------------------------------------------------
    // NOTIFICATIONS
    // -------------------------------------------------------------
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get current user's notifications",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Notification list" } },
      },
    },
    "/notifications/unread": {
      get: {
        tags: ["Notifications"],
        summary: "Get unread count for current user",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Unread count" } },
      },
    },
    "/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Notification marked as read" } },
      },
    },
    "/notifications/read-all": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read for current user",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "All notifications marked as read" } },
      },
    },
    "/notifications/check-sla-breaches": {
      post: {
        tags: ["Notifications"],
        summary: "Run SLA breach check and generate notifications (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "SLA check completed" } },
      },
    },

    // -------------------------------------------------------------
    // AUDIT LOGS
    // -------------------------------------------------------------
    "/audit-logs": {
      get: {
        tags: ["Audit Logs"],
        summary: "List audit logs with optional filters (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "entity", in: "query", schema: { type: "string" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "userId", in: "query", schema: { type: "string" } },
          { name: "entityId", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "List of audit logs" } },
      },
    },
    "/audit-logs/{entity}/{entityId}": {
      get: {
        tags: ["Audit Logs"],
        summary: "Get chronological audit history for a specific entity (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "entity", in: "path", required: true, schema: { type: "string" } },
          { name: "entityId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Entity audit history" } },
      },
    },

    // -------------------------------------------------------------
    // ANALYTICS & REPORTS
    // -------------------------------------------------------------
    "/analytics/overview": {
      get: {
        tags: ["Analytics"],
        summary: "Overall platform analytics dashboard (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Platform overview statistics" } },
      },
    },
    "/analytics/departments": {
      get: {
        tags: ["Analytics"],
        summary: "Department-wise complaint performance (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Department performance breakdown" } },
      },
    },
    "/analytics/categories": {
      get: {
        tags: ["Analytics"],
        summary: "Category-wise complaint statistics (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Category statistics sorted by total complaints" } },
      },
    },
    "/analytics/staff": {
      get: {
        tags: ["Analytics"],
        summary: "Staff workload & resolution performance (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Staff performance (credentials omitted)" } },
      },
    },
    "/analytics/complaints": {
      get: {
        tags: ["Analytics"],
        summary: "Time-based complaint report with optional date range (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", example: "2026-01-01" }, description: "Start date (YYYY-MM-DD)" },
          { name: "to", in: "query", schema: { type: "string", example: "2026-12-31" }, description: "End date (YYYY-MM-DD)" },
        ],
        responses: {
          200: { description: "Time-filtered complaint metrics" },
          400: { description: "Invalid date format or invalid date range (from > to)" },
        },
      },
    },
    "/analytics/services": {
      get: {
        tags: ["Analytics"],
        summary: "Municipal service & payment revenue report (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Service and revenue metrics" } },
      },
    },
  },
};

export const setupSwagger = (app: Application) => {
  // Serve raw JSON spec
  app.get("/api-docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocument);
  });

  // Serve interactive Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: "CivicFlow API Documentation",
      customCss: ".swagger-ui .topbar { display: none }",
    })
  );
};
